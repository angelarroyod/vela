# Vela M4 — Polish (lean) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the App-Store-relevant, non-blocked gaps: surface write errors (no silent data loss), fill accessibility labels, and add an in-app Privacy + medical-disclaimer screen.

**Architecture:** One tiny `mutate()` helper wraps every Supabase write so a failing insert/update raises a Spanish `Alert` instead of failing silently; screens adopt it. Accessibility labels are added to icon-only pressables. A static `legal` screen (no network) is linked from Settings and the signup consent line.

**Tech Stack:** existing — supabase-js, expo-router, RN `Alert`/`accessibilityLabel`.

## Global Constraints

- Expo SDK 56, TS strict, `@/*` → `src/*`. Tests mock `@supabase/supabase-js` (mock-prefixed vars). Spanish copy. Reuse M1 primitives + theme.
- **Deferred (external deps, not in this plan):** push notifications (needs EAS dev build + APNs + Apple enrollment); app icon/splash (needs a 1024px logo asset). Both tracked in spec §7/§8.
- Never simplify away error handling that prevents data loss (a care app — a "saved" vital that silently failed is a safety bug).

---

## Task 1: `mutate()` write-error helper + adopt in write handlers

**Files:**
- Create: `src/lib/db.ts`, `__tests__/db.test.ts`
- Modify: `app/(app)/nurse/(tabs)/signos.tsx`, `app/(app)/nurse/medicacion.tsx`, `app/(app)/nurse/(tabs)/relevo.tsx`, `app/(app)/family/(tabs)/mensajes.tsx`, `app/(auth)/onboarding.tsx`

**Interfaces:**
- Produces: `mutate<T extends { error: { message: string } | null }>(p: PromiseLike<T>): Promise<string | null>` — resolves to the error message, or `null` on success.

- [ ] **Step 1: Write the failing test**

`__tests__/db.test.ts`:

```ts
import { mutate } from '@/lib/db';

test('returns null on success', async () => {
  expect(await mutate(Promise.resolve({ error: null }))).toBeNull();
});

test('returns the error message on failure', async () => {
  expect(await mutate(Promise.resolve({ error: { message: 'boom' } }))).toBe('boom');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest db.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/lib/db.ts`:

```ts
// Awaits a Supabase write and returns the error message (or null on success).
export async function mutate<T extends { error: { message: string } | null }>(p: PromiseLike<T>): Promise<string | null> {
  const { error } = await p;
  return error?.message ?? null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest db.test`
Expected: PASS (2).

- [ ] **Step 5: Adopt in every write handler**

In each write, replace the bare `await supabase.from(...).insert/update(...)` with the guarded form. Example (Signos `save`):

```tsx
import { Alert } from 'react-native';
import { mutate } from '@/lib/db';
// ...
const err = await mutate(supabase.from('vitals').insert({ /* …unchanged… */ }));
if (err) { setBusy(false); Alert.alert('No se pudo guardar', err); return; }
await mutate(supabase.from('care_events').insert({ /* …unchanged… */ }));
setBusy(false);
router.back();
```

Apply the same pattern to: `medicacion.tsx` `administer` (guard the `update`; alert 'No se pudo registrar la dosis'), `relevo.tsx` handoff insert ('No se pudo entregar el turno'), `mensajes.tsx` `send` (on error, restore the draft: `setDraft(body)` + alert 'No se pudo enviar'), `onboarding.tsx` `createPatient` + `redeem` (already surface errors via `setError` — leave those; they're not silent).

- [ ] **Step 6: Commit**

```bash
npx jest && npx tsc --noEmit
git add src/lib/db.ts __tests__/db.test.ts "app/(app)" "app/(auth)/onboarding.tsx"
git commit -m "feat: surface Supabase write errors instead of failing silently"
```

---

## Task 2: Accessibility labels on icon-only controls

**Files:**
- Modify: `app/(app)/nurse/medicacion.tsx`, `app/(app)/nurse/(tabs)/perfil.tsx`, `app/(app)/family/(tabs)/perfil.tsx`, `app/(app)/settings/index.tsx` (back buttons already labelled in some — audit), `app/(app)/family/(tabs)/perfil.tsx` call buttons
- Test: `__tests__/a11y.test.tsx`

**Interfaces:** none new — adds `accessibilityLabel` / `accessibilityRole` props.

- [ ] **Step 1: Write the failing test**

`__tests__/a11y.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import Perfil from '../app/(app)/family/(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('family perfil call buttons are labelled', () => {
  render(<Perfil />);
  // one "Llamar a <name>" button per emergency contact
  expect(screen.getAllByLabelText(/^Llamar a /).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest a11y`
Expected: FAIL — call buttons are unlabelled `View`s.

- [ ] **Step 3: Implement**

In `family/(tabs)/perfil.tsx`, change each emergency-contact call button from `View` to `Pressable` with `accessibilityRole="button"` and `accessibilityLabel={`Llamar a ${c.name}`}` (wire `onPress={() => Linking.openURL('tel:')}` — number lookup is M5; label is the a11y fix). Audit the other listed files: every icon-only `Pressable` gets an `accessibilityLabel` (back arrows → "Volver"; medicacion back → "Volver"; send → already "Enviar"). Add `accessibilityRole="button"` where missing.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest a11y`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx jest && npx tsc --noEmit
git add "app/(app)" __tests__/a11y.test.tsx
git commit -m "feat: accessibility labels on icon-only controls"
```

---

## Task 3: In-app Privacy + medical-disclaimer screen

**Files:**
- Create: `app/(app)/legal.tsx`
- Modify: `app/(app)/settings/index.tsx` (link), `app/(auth)/signup.tsx` (consent line → tappable, but signup is in `(auth)` and legal is in `(app)`; put the link text only, route omitted there for M4 — see step 3)
- Test: `__tests__/legal.test.tsx`

**Interfaces:** none — a static screen.

- [ ] **Step 1: Write the failing test**

`__tests__/legal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import Legal from '../app/(app)/legal';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('legal screen shows privacy + disclaimer sections', () => {
  render(<Legal />);
  expect(screen.getByText('Privacidad')).toBeTruthy();
  expect(screen.getByText(/no es un dispositivo médico/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest legal`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `app/(app)/legal.tsx`: a `Screen` with a back arrow (`accessibilityLabel="Volver"` → `router.back()`) and two `Card` sections — **"Privacidad"** (what data Vela stores: cuenta, paciente, signos, mensajes; that health data is never sold or used for publicidad; how to delete the account → Configuración) and **"Aviso médico"** (text incl. the exact phrase "Vela no es un dispositivo médico" and that it does not diagnose or treat). Add a `Configuración` row in `settings/index.tsx` linking `router.push('/(app)/legal')` labelled "Privacidad y aviso médico". In `signup.tsx`, the consent line already names the privacy policy + disclaimer as text; leave it as text for M4 (the tappable link + hosted URL is M5, since `(auth)` can't reach the `(app)` legal route pre-login).

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest legal`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx jest && npx tsc --noEmit
git add "app/(app)/legal.tsx" "app/(app)/settings/index.tsx" __tests__/legal.test.tsx
git commit -m "feat: add in-app privacy + medical disclaimer screen"
```

---

## Task 4: Verify + docs

- [ ] **Step 1:** `npx jest && npx tsc --noEmit` → green. `npx expo export -p web` → exit 0; delete `dist/`.
- [ ] **Step 2:** README + spec §7: note M4 (lean) done; push + icons explicitly deferred with reasons. Commit `docs: mark M4 (lean polish) done; defer push + icons`.

---

## Self-Review (completed)

**Spec coverage (rev 3 §7):** error/empty/loading → Task 1 (errors; empty states already added in M3; loading spinners deferred as low-value — `// ponytail`); accessibility → Task 2; privacy + medical disclaimer → Task 3; account management → done (M2); push → **deferred** (Apple); localization → already Spanish; icons/splash → **deferred** (asset). Gaps are the two deferrals, both flagged. ✓

**Placeholder scan:** `mutate()` shown in full; each handler's guarded form shown; a11y + legal changes concrete. No TBDs. ✓

**Type consistency:** `mutate<T extends {error:{message}|null}>` matches supabase write return shape used in Tasks 3/5/6/7 of M3. Legal route `/(app)/legal` matches the file path. ✓
