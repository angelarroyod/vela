# Vela Web — design spec

**Date:** 2026-07-03
**Source design:** Claude Design handoff `Vela Web.dc.html` (desktop web shell).
**Goal:** A functional **desktop web** version of Vela — Vite + React + TypeScript — on the **same live Supabase backend** as the mobile app. Nurses at a station and family on a laptop use the same accounts/data as mobile.

## 1. Overview

Desktop layout: a 252px **sidebar** (logo, patient mini-card, role nav, shift card + user + sign-out) beside a **main** area (topbar + max-1120px content). Same product as mobile — role-scoped access via `care_memberships`, live vitals/meds/messages/handoff, realtime family⇄nurse. Separate codebase from the Expo app; **shared database** (project `tcjrdiukrgqgqmdbljpa`, same tables/RLS/RPCs — no backend work).

### In scope
Auth (email/password + onboarding), the 8 content views (nurse: Inicio, Signos, Medicación, Relevo; family: Estado, Actividad, Mensajes, Perfil), sidebar shell, live reads + writes, realtime.

### Out of scope (YAGNI)
- **Dynamic theming generator** (paleta/carácter/atmósfera OKLCH) — ship the default **Salvia** palette only.
- **Sign in with Apple** (iOS concern; web uses email/password).
- **URL routing** (react-router) — v1 uses in-app view state; add bookmarkable URLs later if wanted.
- Push, account-deletion Edge Function reuse (already exists server-side; web links to it later), icons/PWA.

## 2. Stack
- **Vite + React 19 + TypeScript.** Plain CSS via the design's CSS custom properties (`--brand`, `--tint`, `--ink`, …) in `src/theme.css`, defaulting to the design's Salvia hexes (`--brand:#5C8A77`, etc.). Fonts: Hanken Grotesk + Instrument Serif (Google Fonts `<link>`).
- **@supabase/supabase-js** — `src/lib/supabase.ts`, default localStorage session (web). Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same values as mobile `.env`).
- **Vitest + @testing-library/react + jsdom** for tests.
- Icons: inline SVG React components ported 1:1 from the design (a small `Icon` set).

## 3. Behavior adaptations (design prototype → functional app)
1. **Role from membership.** Logged-out → login/signup. Logged-in → shell; role = the user's `care_memberships.role` (nurse|family), same selection logic as mobile (`pickActiveMembership`). No free "pick a view" toggle.
2. **Sidebar "cambiar de mirada" → "Cerrar sesión"** (sign out). A real user has one role per patient.
3. **Auth:** email/password sign-in/sign-up + onboarding (nurse `create_patient_with_nurse`, family `redeem_invite`), reusing the existing RPCs.
4. **Nav:** in-app `screen` state (as the design's script does) switching the 8 views; role determines which nav + views render.
5. **Theming:** static Salvia CSS variables; no runtime palette generator.

## 4. Architecture

```
vela-web/
  index.html                # font links, #root
  vite.config.ts  tsconfig.json  package.json  .env.example
  src/
    main.tsx  App.tsx        # App: session gate → Auth flow | AppShell
    theme.css                # CSS vars (Salvia) + base styles
    lib/supabase.ts          # client (VITE_ env)
    auth/
      AuthProvider.tsx  useAuth.ts        # session context (getSession + onAuthStateChange)
      useMembership.ts                    # loads care_membership; pickActiveMembership
      Welcome.tsx  Login.tsx  Signup.tsx  Onboarding.tsx
    care/
      useLiveList.ts                      # fetch + realtime subscribe (ported, plain React)
      hooks.ts                            # useVitals/useMedications/useCareEvents/useTimeline/useMessages + mappers
      data.ts                             # shared display types (Vitals, Medication, FeedEntry, Message, TimelineEntry)
    shell/
      AppShell.tsx  Sidebar.tsx  Topbar.tsx
    views/
      nurse/{Inicio,Signos,Medicacion,Relevo}.tsx
      family/{Estado,Actividad,Mensajes,Perfil}.tsx
    components/
      Icon.tsx  Card.tsx  Pill.tsx  StatusBadge.tsx  Avatar.tsx
```

**Data flow:** `AuthProvider` tracks session → `useMembership` yields `{ role, patient_id }` → `AppShell` renders sidebar (role nav) + the active view. Views read via `care/hooks` (live, realtime) and write via `supabase.from(...).insert/update` guarded by a `mutate()` helper (ported). RLS enforces access server-side; the client filters only by the active `patient_id`.

**Component boundaries:** `useLiveList(table, patientId, order, map)` is the one realtime primitive; per-resource hooks are one-liners over it. Shell components are presentational; views compose hooks + primitives. Mirrors the mobile app's proven structure so logic ports with minimal change.

## 5. Views (from `Vela Web.dc.html`, exact copy/colors)
- **Welcome** (logged-out entry): Vela hero + role cards → route to signup (role hint) / login. (In functional app, role is confirmed at onboarding.)
- **Nurse Inicio:** greeting, patient card (conditions incl. amber allergy), "Próximas tareas", right rail CTA "Registrar signos vitales" + "Esta noche" mini-timeline (live `care_events`).
- **Nurse Signos:** 2×2 editable vitals + anomaly toggle (reveals note) + "Nota del control" → save (insert `vitals` + `care_events`); right rail "Se comparte con la familia".
- **Nurse Medicación:** dose list (administer pending), right rail "Dosis de hoy" progress + reminder.
- **Nurse Relevo:** live timeline + recommendation + next-nurse + "Entregar turno" (insert `shift_handoffs`).
- **Family Estado:** reassurance hero + "Escribir a Carmen" + latest-vitals grid.
- **Family Actividad:** live `care_events` feed (anomaly styled amber).
- **Family Mensajes:** chat panel — live thread + composer (insert `messages`).
- **Family Perfil:** conditions, emergency contacts (tel links), care team.

## 6. Testing
Vitest: mappers (`mapVital`/`mapMed`/`mapMessage`), `pickActiveMembership`, `mutate()`, and smoke-render each view with mocked `supabase` + hooks. No exhaustive per-pixel tests.

## 7. Running / deploy
- `cd vela-web && npm run dev` → http://localhost:5173.
- `npm run build` → static `dist/`; deploy later (Vercel/Netlify/EAS Hosting). Not in this milestone.

## 8. Repo
`vela-web/` as a **sibling** app (own Vite project + git). Shares only the Supabase project with `vela/`. This design doc lives in `vela/docs` with the rest of the Vela product docs.
