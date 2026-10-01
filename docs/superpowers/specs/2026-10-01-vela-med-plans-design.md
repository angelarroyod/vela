# Vela — Recurring medication plans (design spec)

**Date:** 2026-10-01
**Repos:** `vela` (Expo mobile) + `vela-web` (Vite web) — shared Supabase backend.
**Goal:** Let the nurse define a recurring medication plan (*pauta*: drug + fixed times of day + duration) so doses appear on their own each day, are recorded by the nurse, and are followed live by the family — today plus 7 days of adherence history.

## 0. Why (gaps found in current code)

- **No create path for medications exists** in either app. The only write is `update status='administered'` (`vela/app/(app)/nurse/medicacion.tsx`, `vela-web/src/views/nurse/Medicacion.tsx`). On a real account the list is always empty. Plans become the *only* way medications enter the system.
- `useMedications` loads **every** medication row for the patient, unfiltered by date, under a "Dosis de hoy" header.
- Family has **no medication view** — only the "Medicación administrada" `care_event` in Actividad.
- Header `Sra. Elena · martes 26 jun` is hardcoded in both apps; footer "Te avisaremos antes de la próxima dosis" promises push notifications that do not exist.
- No migration adds tables to the `supabase_realtime` publication (M3 realtime was presumably toggled in the dashboard). A fresh project gets no live updates.

## 1. Decisions

| Topic | Decision |
|---|---|
| Frequency model | **Fixed times of day** (`08:00, 14:00, 22:00`). No intervals. |
| Duration | Start = **today**; optional **duration in days** → `end_date`. Empty = chronic. No days-of-week rules, no future start dates. |
| Missed doses | Computed from the clock: `pending` → **`overdue`** (amber, "Atrasada") from the slot time → **`missed`** (red, "Omitida") after a **2h** grace. Nurse can still record late. Never stored, no cron. |
| Changing a plan | **No in-place edits.** Suspend (`suspended_at = now()`) + create a new plan. History stays truthful. |
| Family | Full read-only screen: today + last 7 days adherence + active plans. |
| Architecture | Plans table + `medications` reused as the **dose log**; doses **expanded client-side** by a pure function (approach A). Rejected: SQL RPC expansion (untestable without local Supabase, needs RPC-aware live hook), pre-generated rows + `pg_cron` (moving parts, chronic plans need rolling generation). |

### Out of scope (YAGNI)
Push reminders (blocked on Apple / dev build), interval-based schedules, PRN (as-needed) meds, per-plan grace, editable plans, date-range history filter, patient time zone, refusal reasons, adding the M3 tables to the realtime publication (separate task).

## 2. Data model — `supabase/migrations/0003_medication_plans.sql`

Idempotent (re-runnable in the SQL Editor, like `0002`). Same file copied to `vela-web/supabase/migrations/`.

```sql
-- Vela recurring medication plans. Apply after 0002_rls.sql. Idempotent.

create table if not exists public.medication_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dose text not null default '',
  reason text not null default '',
  times time[] not null check (cardinality(times) between 1 and 12),
  start_date date not null default current_date,
  end_date date check (end_date is null or end_date >= start_date),
  suspended_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists medication_plans_patient_idx on public.medication_plans(patient_id);

-- medications = dose log: one row per dose actually recorded.
alter table public.medications
  add column if not exists plan_id uuid references public.medication_plans(id);
create unique index if not exists medications_plan_slot_uniq
  on public.medications(plan_id, scheduled_at);

alter table public.medication_plans enable row level security;
drop policy if exists plans_read on public.medication_plans;
create policy plans_read on public.medication_plans for select using (public.is_member(patient_id));
drop policy if exists plans_write on public.medication_plans;
create policy plans_write on public.medication_plans for all
  using (public.is_nurse(patient_id)) with check (public.is_nurse(patient_id));

do $$ begin
  alter publication supabase_realtime add table public.medication_plans;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.medications;
exception when duplicate_object then null; end $$;
```

Notes:
- `plan_id` FK uses the default **NO ACTION**: deleting a plan that has logged doses fails (history protected). Deleting a patient still cascades cleanly — NO ACTION is checked at end of statement, after the cascade removed both tables' rows.
- A log row = plan snapshot (`name`, `dose`, `reason`) + `scheduled_at` = slot instant + `status='administered'` + `administered_by` / `administered_at`.
- `scheduled_at` = local start-of-day + slot time in the **device time zone**, as UTC. The unique key assumes nurse and family devices share a time zone (ceiling; fix = `patients.timezone`).
- `end_date` = planned course (inclusive). `suspended_at` = stop mid-day; doses at or after it are no longer expected.
- Legacy rows with `plan_id null` (dev data only) are ignored by the new views.
- Existing `meds_read` (`is_member`) / `meds_write` (`is_nurse`) policies already cover log inserts. Family is read-only **by RLS**, not by hidden buttons.

## 3. Dose logic

Pure module, identical in both repos: `vela/src/features/care/doses.ts`, `vela-web/src/care/doses.ts`.

```ts
export type PlanRow = { id: string; name: string; dose: string; reason: string;
  times: string[]; start_date: string; end_date: string | null; suspended_at: string | null };
export type LogRow = { plan_id: string | null; scheduled_at: string; administered_at: string | null };
export type DoseStatus = 'administered' | 'pending' | 'overdue' | 'missed';
export type Dose = { planId: string; name: string; dose: string; reason: string;
  at: Date; status: DoseStatus; administeredAt?: Date };

export const GRACE_MS = 2 * 60 * 60_000; // ponytail: global 2h; per-plan when a nurse asks
export const HISTORY_DAYS = 7;

export function expandDoses(plans: PlanRow[], logs: LogRow[], from: Date, days: number, now: Date): Dose[];
export function summarize(doses: Dose[]): { given: number; overdue: number; missed: number; total: number };
export function parseTimes(text: string): string[] | null;
export function localDate(d: Date): string; // 'YYYY-MM-DD' in device time zone
```

`expandDoses` rules:
1. Iterate local days `[from, from + days)`. A plan is active on day `D` when `start_date <= D` and (`end_date` is null or `D <= end_date`) — string compare on `YYYY-MM-DD`.
2. Each `times[i]` (`HH:MM` or `HH:MM:SS` from Postgres) → `at = new Date(y, m, d, hh, mm)` (local constructor handles DST).
3. Match logs by `plan_id` + `new Date(scheduled_at).getTime() === at.getTime()` (numeric compare; immune to `Z` vs `+00:00`).
4. Status: log → `administered`; else `now < at` → `pending`; else `now < at + GRACE_MS` → `overdue`; else `missed`.
5. If `suspended_at` is set, drop doses with `at >= suspended_at` **unless logged**.
6. Sort ascending by `at`.

`summarize`: counts by status — `given` = administered, `overdue`, `missed`, `total` = all doses passed in. For past days `total` equals doses due (nothing is pending).

`parseTimes`: split on `,` / whitespace; each token `H:MM` or `HH:MM`, hour 0–23, minute 0–59; normalize to `HH:MM`; dedupe; sort; return `null` if empty, any token invalid, or more than 12.

**Hooks** (added to existing `hooks.ts` in each repo):
- `useNow(intervalMs = 60_000)` — re-render every minute so overdue/missed advance without data changes.
- `useDoses(pid, from, days)` → `{ doses, plans }`: two `useLiveList` subscriptions (`medication_plans` ordered by `created_at`, `medications` ordered by `scheduled_at`, identity mappers) + `useNow` → `useMemo(expandDoses(...))`. `plans` = active plans (not suspended, not past `end_date`).
- Ceiling (`// ponytail:` comment): logs query loads the patient's full history; add `.gte('scheduled_at', …)` when it grows.

**Removed** (both repos): `mapMed`, `useMedications`, `Medication` type, `medications` mock array in mobile `data.ts`, and their tests.

## 4. Nurse UI

### Mobile `app/(app)/nurse/medicacion.tsx` (rewrite)
- Header: real date via `toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })`. Hardcoded patient name dropped (no patient hook exists).
- "Dosis de hoy" card: `useDoses(pid, startOfToday, 1)` → `summarize` → "`given` de `total`" + progress bar.
- `DoseRow` list. Any non-administered dose is pressable → `Alert.alert` confirm "¿Registrar {name} {dose} de las {HH:MM}?" → insert log row → `care_event` (`type: 'medication'`, title "Medicación administrada", body "{name} {dose} · pauta {HH:MM}").
- **Pautas** section: active plans (name, dose, times, "hasta {d MMM}" / "Crónica") each with **Suspender** → confirm → `update({ suspended_at: now })` → `care_event` "Pauta suspendida: {name}".
- "+ Nueva pauta" → `router.push('/nurse/pauta-nueva')`.
- Footer "Te avisaremos…" **removed**.

### Mobile `app/(app)/nurse/pauta-nueva.tsx` (new; registered in `nurse/_layout.tsx` Stack)
- Fields: Nombre*, Dosis, Motivo, **Horas*** (text), **Duración (días)** (numeric, optional).
- Preset chips fill Horas: "1 al día" → `09:00`; "Cada 12 h" → `09:00, 21:00`; "Cada 8 h" → `06:00, 14:00, 22:00`.
- Validation: name non-empty, `parseTimes` non-null, duration empty or integer 1–365. Invalid → inline error, save disabled.
- Save: insert plan (`start_date = localDate(today)`, `end_date = start + days − 1` or null, `created_by`) → `care_event` "Nueva pauta: {name}" → `router.back()`. Pattern copied from `signos.tsx` (`busy`, `PrimaryButton`, `mutate`, `Alert`).

### Web `src/views/nurse/Medicacion.tsx` (rewrite)
Same logic in the existing 2-column grid: left = today's `DoseRow`s; right = progress card + Pautas card (Suspender) + **inline** "Nueva pauta" form toggled by a button (no URL routing in web). Native `confirm()` / `alert()`.

## 5. Family UI

- Mobile: new tab `app/(app)/family/(tabs)/medicacion.tsx`, icon `pill`, registered in `family/(tabs)/_layout.tsx` between Actividad and Mensajes.
- Web: `Sidebar.tsx` family item `{ id: 'medicacion', label: 'Medicación', icon: 'pill' }`; `App.tsx` `familyViews.medicacion`; new `src/views/family/Medicacion.tsx`.

Content (read-only), one `useDoses(pid, startOfDay(today − HISTORY_DAYS), HISTORY_DAYS + 1)`:
1. **Hoy** — summary "{given} de {total} · {overdue} atrasada(s)" + today's `DoseRow`s (no `onPress`).
2. **Últimos 7 días** — newest first, one row per day: "{weekday d MMM} · {given}/{total}" + mini bar; missed doses listed by name under the day ("Omitida: Enalapril 22:00").
3. **Pautas activas** — name, dose, times, "Crónica" / "hasta {d MMM}".
4. Empty state: "Aún no hay pautas de medicación."

Past days contain only `administered` / `missed`; `overdue` / `pending` occur only today. Plans expand only from `start_date`, so no phantom misses before a plan existed.

**Shared component** (2 callers per app): `vela/src/components/DoseRow.tsx`, `vela-web/src/components/DoseRow.tsx` — props `{ dose: Dose; onPress?: () => void }`. States: administered (green check, "Administrada {HH:MM}"), pending (dashed ring, "Próxima"), overdue (amber ring, "Atrasada"), missed (red, "Omitida").

## 6. Error handling

| Case | Behavior |
|---|---|
| Dose insert fails (network / RLS) | Alert "No se pudo registrar la dosis"; row unchanged |
| Double record (double tap, two devices) | `medications_plan_slot_uniq` rejects → generic Alert; realtime already shows administered |
| `care_event` insert after a dose fails | Dose kept; feed entry missing. Same as current behavior — log is the record, feed is secondary |
| Invalid plan input | Client validation disables save; DB `check`s are the backstop |
| Suspend fails | Alert; plan stays active |

Known ceilings: device clock / time zone, global 2h grace, unfiltered logs query, empty-state flash before first fetch (as on every other screen).

## 7. Testing

**Pure logic** — `doses.test.ts`, same cases in both repos (catches copy drift). Dates built with `new Date(y, m, d, h, mi)` so tests pass in any CI time zone.
- expansion plan × times × days, sorted
- `start_date` / `end_date` inclusive bounds
- status boundaries: `now < at` pending; `now = at` overdue; `at + 2h − 1ms` overdue; `at + 2h` missed
- log match with `Z` and `+00:00` timestamps → administered
- `suspended_at` drops later unlogged doses, keeps logged ones
- `summarize` counts per status + total; `parseTimes` valid / invalid / dedupe / sort / >12 rejected

**Screens**
- mobile (jest-expo + RNTL): rewrite `medicacion-admin.test.tsx` (press → confirm → insert with `plan_id` + `scheduled_at`); new `pauta-nueva.test.tsx` (chip fills times, invalid disables save, insert with computed `end_date`); new family medicacion test (today + history day with a missed name); update `nurse-screens.test.tsx`, `smoke.test.tsx` (new screens), `care-hooks.test.ts` and `data.test.ts` (drop `mapMed` / mock meds).
- web (vitest + RTL): nurse + family Medicacion views; Sidebar family item; drop `mapMed` test from `hooks.test.ts`.
- `tsc` (mobile), `tsc -b` + `vite build` (web), CI green in both repos.

**Manual E2E** — user applies `0003` in the Supabase SQL Editor → nurse (iPhone, Expo Go) creates a plan → family (web) sees it live → nurse records a dose → family sees it administered live. Also closes the pending M3 two-account realtime check.

## 8. Rollout

1. Apply `0003` to the live project **before** shipping either client. Purely additive: old clients keep working; new clients against an un-migrated DB fail on `medication_plans`.
2. Ship mobile + web changes.
