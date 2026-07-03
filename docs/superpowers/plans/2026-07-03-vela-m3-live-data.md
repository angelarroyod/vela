# Vela M3 — Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock `src/data.ts` content in the screens with **live Supabase data** — reads stream in realtime (family sees the nurse's entries live), and the nurse's forms (vitals, medication administer, messages, handoff) write real rows.

**Architecture:** One reusable hook, `useLiveList(table, patientId, order, map)` — initial fetch + a Postgres-changes subscription that refetches on any change. Per-resource hooks (`useVitals`, `useMedications`, `useCareEvents`, `useMessages`) are one-liners over it. Writes are plain `supabase.from(...).insert/update` calls inside screen handlers. The active `patient_id` comes from the existing `useMembership()`; the author id from `useAuth().session.user.id`. Screens keep their layout — only the data source swaps, using mappers that produce the shapes the JSX already renders.

**Tech Stack:** `@supabase/supabase-js` (realtime channels), existing M1/M2 components + hooks. **No react-query** — supabase-js covers fetch + realtime; a client-side cache layer is speculative until multiple screens share cached queries. `// ponytail: add react-query when screens share cached reads and manual refetch hurts.`

## Global Constraints

- Expo SDK 56, TypeScript strict, `@/*` → `src/*`.
- Tests mock `@supabase/supabase-js` (jest hoist rule: mock vars prefixed `mock`). Realtime isn't unit-tested; the fetch+map logic is.
- Spanish copy verbatim; reuse `colors`/`fontFamilyForWeight` from `src/theme.ts` and M1 primitives.
- DB columns (from `supabase/migrations/0001_schema.sql`): `vitals(bp_sys,bp_dia,hr,temp_c,spo2,taken_at,note,has_anomaly,recorded_by)`, `medications(name,dose,reason,scheduled_at,status,administered_by,administered_at)`, `care_events(type,title,body,severity,occurred_at,author_id)`, `messages(sender_id,body,created_at,read_at)`, `shift_handoffs(nurse_id,summary,recommendation,started_at,ended_at)`. All have `patient_id`.
- RLS already enforces access; the client never filters for security, only for the active patient.

---

## File Structure

```
src/features/care/
  useLiveList.ts        # the one reusable fetch+subscribe hook
  hooks.ts              # useVitals/useMedications/useCareEvents/useMessages + row→display mappers
src/data.ts             # keep TYPES (Vitals, Medication, FeedEntry, Message, TimelineEntry); mock consts stay as seed/reference
app/(app)/nurse/(tabs)/signos.tsx     # editable form -> insert vitals + care_event
app/(app)/nurse/medicacion.tsx        # live meds + administer action
app/(app)/nurse/(tabs)/relevo.tsx     # live timeline + handoff insert
app/(app)/family/(tabs)/inicio.tsx    # live latest vitals + reassurance
app/(app)/family/(tabs)/actividad.tsx # live care_events feed
app/(app)/family/(tabs)/mensajes.tsx  # live thread + send
```

**Responsibilities:** `useLiveList` = transport + realtime, nothing domain-specific. `hooks.ts` = per-resource queries + the row→display mapping (the only place DB shape meets screen shape). Screens keep layout; swap `import { x } from '@/data'` for a hook.

---

## Task 1: `useLiveList` — fetch + realtime hook

**Files:**
- Create: `src/features/care/useLiveList.ts`, `__tests__/live-list.test.tsx`

**Interfaces:**
- Produces: `useLiveList<Row, T>(table: string, patientId: string | undefined, order: { col: string; asc: boolean }, map: (r: Row) => T): T[]`

- [ ] **Step 1: Write the failing test** (mock supabase; assert initial rows are fetched + mapped)

`__tests__/live-list.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { useLiveList } from '@/features/care/useLiveList';

const mockOrder = jest.fn(() => Promise.resolve({ data: [{ n: 1 }, { n: 2 }] }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: mockOrder }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: jest.fn(),
  },
}));

test('fetches and maps rows for a patient', async () => {
  const { result } = renderHook(() => useLiveList('vitals', 'p1', { col: 'taken_at', asc: false }, (r: { n: number }) => r.n * 10));
  await waitFor(() => expect(result.current).toEqual([10, 20]));
});

test('returns empty with no patient', () => {
  const { result } = renderHook(() => useLiveList('vitals', undefined, { col: 'taken_at', asc: false }, (r: unknown) => r));
  expect(result.current).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest live-list`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/features/care/useLiveList.ts`:

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useLiveList<Row, T>(
  table: string,
  patientId: string | undefined,
  order: { col: string; asc: boolean },
  map: (r: Row) => T,
): T[] {
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    if (!patientId) {
      setRows([]);
      return;
    }
    let active = true;
    const fetchRows = () =>
      supabase
        .from(table)
        .select('*')
        .eq('patient_id', patientId)
        .order(order.col, { ascending: order.asc })
        .then(({ data }: { data: Row[] | null }) => {
          if (active) setRows((data ?? []).map(map));
        });

    fetchRows();
    // ponytail: refetch on any change, not incremental merge — fine at this scale.
    const channel = supabase
      .channel(`${table}:${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `patient_id=eq.${patientId}` }, fetchRows)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [table, patientId, order.col, order.asc]);

  return rows;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest live-list`
Expected: PASS (2 tests). (The mock's `order` ignores its 2nd arg, fine.)

- [ ] **Step 5: Commit**

```bash
git add src/features/care/useLiveList.ts __tests__/live-list.test.tsx
git commit -m "feat: add useLiveList realtime fetch hook"
```

---

## Task 2: Per-resource hooks + row→display mappers

**Files:**
- Create: `src/features/care/hooks.ts`, `__tests__/care-hooks.test.ts`

**Interfaces:**
- Consumes: `useLiveList` (Task 1); types `Vitals`, `Medication`, `FeedEntry`, `Message`, `TimelineEntry` from `@/data`.
- Produces: `mapVital(row)→Vitals`, `mapMed(row)→Medication`, `mapEvent(row)→FeedEntry`, `mapMessage(row, selfId)→Message`, `mapTimeline(row)→TimelineEntry`; hooks `useVitals(pid)`, `useMedications(pid)`, `useCareEvents(pid)`, `useMessages(pid, selfId)`.

- [ ] **Step 1: Write the failing test** (pure mappers — no supabase needed)

`__tests__/care-hooks.test.ts`:

```ts
import { mapVital, mapMed, mapMessage } from '@/features/care/hooks';

test('mapVital formats bp + fields', () => {
  const v = mapVital({ bp_sys: 128, bp_dia: 82, hr: 72, temp_c: 36.7, spo2: 97, taken_at: '2026-07-03T00:02:00Z', note: 'ok' });
  expect(v.bp).toBe('128/82');
  expect(v.hr).toBe(72);
  expect(v.takenAt).toBe('00:02');
});

test('mapMed marks administered vs pending', () => {
  expect(mapMed({ name: 'Losartán', dose: '50 mg', reason: 'PA', scheduled_at: '2026-07-03T23:30:00Z', status: 'administered' }).status).toBe('administered');
  expect(mapMed({ name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides', scheduled_at: '2026-07-03T06:00:00Z', status: 'pending' }).sub).toBe('Próxima');
});

test('mapMessage flags self', () => {
  expect(mapMessage({ sender_id: 'me', body: 'hola', created_at: '2026-07-03T23:38:00Z' }, 'me').fromSelf).toBe(true);
  expect(mapMessage({ sender_id: 'nurse', body: 'hola', created_at: '2026-07-03T23:40:00Z' }, 'me').fromSelf).toBe(false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest care-hooks`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/features/care/hooks.ts`:

```ts
import { useLiveList } from './useLiveList';
import type { Vitals, Medication, FeedEntry, Message, TimelineEntry } from '@/data';

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });

type VitalRow = { bp_sys: number; bp_dia: number; hr: number; temp_c: number; spo2: number; taken_at: string; note: string; has_anomaly?: boolean };
export const mapVital = (r: VitalRow): Vitals => ({
  bp: `${r.bp_sys}/${r.bp_dia}`, hr: r.hr, tempC: r.temp_c, spo2: r.spo2, takenAt: hhmm(r.taken_at), note: r.note ?? '',
});

type MedRow = { name: string; dose: string; reason: string; scheduled_at: string; status: 'administered' | 'pending' };
export const mapMed = (r: MedRow): Medication => ({
  name: r.name, dose: r.dose, reason: r.reason, time: hhmm(r.scheduled_at),
  status: r.status, sub: r.status === 'administered' ? 'Administrada' : 'Próxima',
});

type EventRow = { type: string; title: string; body: string; severity: string; occurred_at: string; author_id: string };
export const mapEvent = (r: EventRow): FeedEntry => ({
  who: 'Carmen', initials: 'CM', action: r.title ?? r.type, time: hhmm(r.occurred_at),
  tone: r.severity === 'warning' ? 'anomaly' : 'normal', body: r.body ?? undefined,
});

export const mapTimeline = (r: EventRow): TimelineEntry => ({
  title: r.title ?? r.type, time: hhmm(r.occurred_at), body: r.body ?? '', tone: r.severity === 'warning' ? 'anomaly' : 'normal',
});

type MsgRow = { sender_id: string; body: string; created_at: string };
export const mapMessage = (r: MsgRow, selfId: string): Message => ({
  body: r.body, time: hhmm(r.created_at), fromSelf: r.sender_id === selfId,
});

export const useVitals = (pid?: string) => useLiveList<VitalRow, Vitals>('vitals', pid, { col: 'taken_at', asc: false }, mapVital);
export const useMedications = (pid?: string) => useLiveList<MedRow, Medication>('medications', pid, { col: 'scheduled_at', asc: true }, mapMed);
export const useCareEvents = (pid?: string) => useLiveList<EventRow, FeedEntry>('care_events', pid, { col: 'occurred_at', asc: false }, mapEvent);
export const useTimeline = (pid?: string) => useLiveList<EventRow, TimelineEntry>('care_events', pid, { col: 'occurred_at', asc: true }, mapTimeline);
export const useMessages = (pid: string | undefined, selfId: string) =>
  useLiveList<MsgRow, Message>('messages', pid, { col: 'created_at', asc: true }, (r) => mapMessage(r, selfId));
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest care-hooks`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/care/hooks.ts __tests__/care-hooks.test.ts
git commit -m "feat: add per-resource live hooks and row mappers"
```

---

## Task 3: Nurse Signos — editable vitals form that writes

**Files:**
- Modify: `app/(app)/nurse/(tabs)/signos.tsx`
- Test: `__tests__/signos-save.test.tsx`

**Interfaces:**
- Consumes: `useMembership` (`patient_id`), `useAuth` (`session.user.id`), `supabase`.
- Produces: on save, one `vitals` insert + one `care_events` insert (type `vitals`; `severity 'warning'` if anomaly on).

- [ ] **Step 1: Write the failing test**

`__tests__/signos-save.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Signos from '../app/(app)/nurse/(tabs)/signos';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1', role: 'nurse' } }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('saving inserts a vitals row for the active patient', async () => {
  render(<Signos />);
  fireEvent.changeText(screen.getByPlaceholderText('120/80'), '128/82');
  fireEvent.press(screen.getByText('Guardar registro'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  const arg = mockInsert.mock.calls[0][0];
  expect(arg.patient_id).toBe('p1');
  expect(arg.bp_sys).toBe(128);
  expect(arg.bp_dia).toBe(82);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest signos-save`
Expected: FAIL — current Signos is read-only (no inputs, no insert).

- [ ] **Step 3: Implement** — make the 4 vitals editable + wire save

Replace the static value displays with `TextInput`s (`state`: `bp` "128/82", `hr`, `temp`, `spo2`, `anomaly` bool already exists as a static toggle → make it stateful, `note`). Keep the existing card layout/styles; swap the `<Text>{value}</Text>` for `<TextInput placeholder=... value=... onChangeText=.../>`. Add:

```tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { supabase } from '@/lib/supabase';
// ...
const { session } = useAuth();
const { membership } = useMembership();
const router = useRouter();
const [bp, setBp] = useState('');
const [hr, setHr] = useState('');
const [temp, setTemp] = useState('');
const [spo2, setSpo2] = useState('');
const [anomaly, setAnomaly] = useState(false);
const [note, setNote] = useState('');

const save = async () => {
  if (!membership) return;
  const [sys, dia] = bp.split('/').map((n) => parseInt(n, 10));
  await supabase.from('vitals').insert({
    patient_id: membership.patient_id, recorded_by: session?.user.id,
    bp_sys: sys, bp_dia: dia, hr: Number(hr), temp_c: Number(temp), spo2: Number(spo2),
    note, has_anomaly: anomaly,
  });
  await supabase.from('care_events').insert({
    patient_id: membership.patient_id, author_id: session?.user.id, type: 'vitals',
    title: 'Signos vitales', body: `PA ${bp} · FC ${hr} · ${temp}° · SpO₂ ${spo2}%`,
    severity: anomaly ? 'warning' : 'info',
  });
  router.back();
};
```

Give the BP input `placeholder="120/80"`. Wire the anomaly toggle `onPress={() => setAnomaly(a => !a)}` and tint it green when on. `Guardar registro` button `onPress={save}`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest signos-save`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/nurse/(tabs)/signos.tsx" __tests__/signos-save.test.tsx
git commit -m "feat: nurse Signos writes real vitals + care event"
```

---

## Task 4: Family Estado + Actividad — live reads

**Files:**
- Modify: `app/(app)/family/(tabs)/inicio.tsx`, `app/(app)/family/(tabs)/actividad.tsx`
- Test: `__tests__/family-live.test.tsx`

**Interfaces:** Consumes `useMembership`, `useVitals`, `useCareEvents`.

- [ ] **Step 1: Write the failing test**

`__tests__/family-live.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import Actividad from '../app/(app)/family/(tabs)/actividad';

jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({
  useCareEvents: () => [{ who: 'Carmen', initials: 'CM', action: 'registró signos vitales', time: '00:02', tone: 'normal' }],
  useVitals: () => [{ bp: '128/82', hr: 72, tempC: 36.7, spo2: 97, takenAt: '00:02', note: '' }],
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('actividad renders live feed entries', () => {
  render(<Actividad />);
  expect(screen.getByText('registró signos vitales')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest family-live`
Expected: FAIL — screens still import the mock `activityFeed`.

- [ ] **Step 3: Implement** — swap mock imports for hooks

`actividad.tsx`: replace `import { activityFeed } from '@/data'` with `const { membership } = useMembership(); const activityFeed = useCareEvents(membership?.patient_id);`. `inicio.tsx`: replace mock `vitals` with `const vitals = useVitals(pid)[0] ?? EMPTY` (guard empty: render `—` when no rows). Keep all JSX. Add an empty state when the feed is `[]` ("Sin novedades aún").

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest family-live`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/family/(tabs)/inicio.tsx" "app/(app)/family/(tabs)/actividad.tsx" __tests__/family-live.test.tsx
git commit -m "feat: family Estado + Actividad read live data"
```

---

## Task 5: Messages — live thread + send

**Files:**
- Modify: `app/(app)/family/(tabs)/mensajes.tsx`
- Test: `__tests__/mensajes-send.test.tsx`

**Interfaces:** Consumes `useMembership`, `useAuth`, `useMessages`, `supabase`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Mensajes from '../app/(app)/family/(tabs)/mensajes';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useMessages: () => [] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('sending inserts a message', async () => {
  render(<Mensajes />);
  fireEvent.changeText(screen.getByPlaceholderText('Escribe un mensaje…'), 'hola');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalledWith({ patient_id: 'p1', sender_id: 'me', body: 'hola' }));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest mensajes-send`
Expected: FAIL — composer is static placeholder text, not a `TextInput`.

- [ ] **Step 3: Implement** — make the composer a real `TextInput` + send button

Replace the placeholder `<Text>` with a `TextInput` (state `draft`), give the send circle `accessibilityLabel="Enviar"` + `onPress={send}`:

```tsx
const send = async () => {
  if (!draft.trim() || !membership) return;
  await supabase.from('messages').insert({ patient_id: membership.patient_id, sender_id: session?.user.id, body: draft.trim() });
  setDraft('');
};
```

Replace mock `messages` with `const messages = useMessages(membership?.patient_id, session?.user.id ?? '')`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest mensajes-send`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/family/(tabs)/mensajes.tsx" __tests__/mensajes-send.test.tsx
git commit -m "feat: family Mensajes live thread + send"
```

---

## Task 6: Medications — live list + administer

**Files:**
- Modify: `app/(app)/nurse/medicacion.tsx`
- Test: `__tests__/medicacion-admin.test.tsx`

**Interfaces:** Consumes `useMembership`, `useAuth`, `useMedications`, `supabase`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Medicacion from '../app/(app)/nurse/medicacion';

const mockUpdate = jest.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => (t === 'medications' ? { update: mockUpdate } : { insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useMedications: () => [{ id: 'm1', name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides', time: '06:00', status: 'pending', sub: 'Próxima' }] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('tapping a pending dose marks it administered', async () => {
  render(<Medicacion />);
  fireEvent.press(screen.getByText('Levotiroxina'));
  await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest medicacion-admin`
Expected: FAIL — meds come from mock, rows aren't pressable.

- [ ] **Step 3: Implement**

`mapMed` must also carry `id` — extend `Medication` type in `@/data` with `id?: string` and set it in `mapMed`. Replace mock `medications` with `useMedications(pid)`. Compute `medsProgress` from the live list (`done = filter(status==='administered').length`). Wrap each pending `MedRow` in a `Pressable` that calls:

```tsx
const administer = async (id: string) => {
  await supabase.from('medications').update({ status: 'administered', administered_by: session?.user.id, administered_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('care_events').insert({ patient_id: membership!.patient_id, author_id: session?.user.id, type: 'medication', title: 'Medicación administrada', body: `${name} ${dose}`, severity: 'info' });
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest medicacion-admin`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/nurse/medicacion.tsx" src/data.ts __tests__/medicacion-admin.test.tsx
git commit -m "feat: nurse Medicacion live list + administer action"
```

---

## Task 7: Relevo — live timeline + handoff write

**Files:**
- Modify: `app/(app)/nurse/(tabs)/relevo.tsx`
- Test: `__tests__/relevo-handoff.test.tsx`

**Interfaces:** Consumes `useMembership`, `useAuth`, `useTimeline`, `supabase`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Relevo from '../app/(app)/nurse/(tabs)/relevo';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useTimeline: () => [{ title: 'Signos vitales', time: '00:02', body: 'todo normal', tone: 'normal' }] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation((_t, _m, btns) => btns[1].onPress());

test('handing off inserts a shift_handoff', async () => {
  render(<Relevo />);
  fireEvent.press(screen.getByText('Entregar turno al equipo de día'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest relevo-handoff`
Expected: FAIL — timeline is mock; handoff only navigates.

- [ ] **Step 3: Implement**

Replace mock `relevoTimeline` with `useTimeline(pid)`. In the existing `Alert` confirm's onPress, before `router.replace`, insert:

```tsx
await supabase.from('shift_handoffs').insert({ patient_id: membership!.patient_id, nurse_id: session?.user.id, summary: 'Turno sin novedades relevantes.', recommendation, ended_at: new Date().toISOString() });
```

(`recommendation` stays the static line for M3; editable in M4.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest relevo-handoff`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/nurse/(tabs)/relevo.tsx" __tests__/relevo-handoff.test.tsx
git commit -m "feat: nurse Relevo live timeline + handoff write"
```

---

## Task 8: Verify + docs

- [ ] **Step 1:** `npx jest && npx tsc --noEmit` → all green. Fix any screen still importing removed mock consts (nurse Inicio/family Perfil may still use `@/data` seed values — leave those; they're static reference labels, not live data).
- [ ] **Step 2:** `npx expo export -p web` → `Exported: dist`, exit 0; delete `dist/`.
- [ ] **Step 3: Device E2E (the real proof):** two Expo Go sessions / two accounts on one patient. Nurse: save vitals in Signos → **family Actividad shows the entry within ~1s** (realtime). Nurse: administer a dose → progress updates. Family: send a message → nurse thread updates live.
- [ ] **Step 4:** README + spec §10: tick M3. Commit.

```bash
git add README.md docs
git commit -m "docs: mark M3 (live data) complete"
```

---

## Self-Review (completed)

**Spec coverage (rev 3 §6 real functionality):** Signos editable + insert vitals/event → Task 3; Medicación administer → Task 6; Relevo handoff → Task 7; family live Estado/Actividad → Task 4; Mensajes send + realtime → Task 5; realtime sync (family ⇄ nurse) → Task 1 subscription used everywhere. Deferred by design: editable recommendation/handoff summary (M4), read receipts, push. ✓

**Placeholder scan:** No TBDs. `useLiveList` + mappers shown in full; each screen task gives the exact insert/update payload + the hook swap. The `// ponytail:` notes mark deliberate simplifications (refetch-not-merge, no react-query), not gaps. ✓

**Type consistency:** `useLiveList(table, patientId, {col,asc}, map)` signature used identically in Task 2's five hooks. `Medication` gains `id?: string` (Task 6) — used only there. Mapper outputs match the M1 `@/data` types the screens already render. `patient_id` from `useMembership().membership.patient_id`, author ids from `useAuth().session.user.id`, consistent across Tasks 3/5/6/7. ✓

**Lazy ledger:** no react-query (add when shared cache hurts); realtime = refetch-on-change (add incremental merge if a list gets large); handoff summary hardcoded (M4). All reversible, none blocks M3's goal.
```
