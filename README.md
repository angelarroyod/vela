# Vela — Independent Nursing Care App

Home nursing-care app with two roles sharing one app:

- **Nurse (enfermera):** records vitals, medication, notes/anomalies, and shift handoff.
- **Family (familiar):** follows the patient's status, activity feed, and chats with the nurse.

Built with **Expo (React Native + TypeScript)** and **expo-router**. Cross-platform — the same code runs on iOS and Android.

> Spanish-language UI. Backend is **live** (Supabase). Push notifications + full compliance polish arrive in M4.

## Status — M1 + M2 + M3 complete (backend live)

**M3 added:** screens read/write **live Supabase data** via one `useLiveList` realtime hook + per-resource hooks. Nurse writes vitals (Signos), administers meds, hands off shift; family sees the activity feed, latest vitals, and chats — syncing in realtime (family ⇄ nurse). See [M3 plan](docs/superpowers/plans/2026-07-03-vela-m3-live-data.md). *(No react-query — supabase-js realtime covers it.)*

**M2:** Supabase client + session storage, schema + RLS migrations, email/password auth, onboarding, `(auth)`/`(app)` route groups, invite generation, Settings + account deletion (Edge Function), Sign in with Apple behind a native-build flag. See [M2 plan](docs/superpowers/plans/2026-06-26-vela-m2-backend-auth.md).

> Live now: Supabase project + migrations applied + `.env` set; email/password + onboarding verified on device. Still pending: deploy `supabase/functions/delete-account`; Sign in with Apple needs the EAS dev build + Apple enrollment (spec §11).

**M1 screens** — all 9, built and navigable with mock data:

| # | Nurse | # | Family |
|---|-------|---|--------|
| 00 | Bienvenida (role picker) | 05 | Estado de mamá |
| 01 | Inicio del turno | 06 | Actividad |
| 02 | Signos vitales | 07 | Mensajes |
| 03 | Medicación (pushed) | 08 | Perfil de Elena |
| 04 | Relevo de turno | | |
| — | Perfil (minimal) | | |

Navigation: Welcome → role → role tab navigator; nurse "Medicación" pushes a detail screen with a back arrow; CTAs/tabs route; handoff confirms and returns to Inicio.

## Run it

```bash
npm install        # first time (uses .npmrc legacy-peer-deps for React 19)
cp .env.example .env   # then fill EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY from your Supabase project
npm start          # Expo dev server (Metro)
```

- **Supabase:** create a free project, run the two SQL files in `supabase/migrations/` (SQL Editor), and put the Project URL + anon key in `.env`. Without `.env` the UI still loads (auth calls just fail).
- **iPhone / Android (Expo Go):** open Expo Go → scan the QR or enter the `exp://<LAN-IP>:<port>` URL. Phone and computer must share a Wi-Fi network. Use `npx expo start --tunnel` if your network blocks LAN.
- **Web preview:** `npm run web`.

## Quality gates

```bash
npm test           # jest-expo + @testing-library/react-native (65 tests)
npm run typecheck  # tsc --noEmit
```

The web bundle builds cleanly via `npx expo export -p web`.

## Project layout

```
app/                 # expo-router routes
  index.tsx          # session-based entry redirect
  (auth)/            # welcome, login, signup, onboarding
  (app)/             # session-gated: nurse/ + family/ tab groups, settings/
src/
  theme.ts           # design tokens (color / type / radius / shadow)
  data.ts            # typed mock fixtures (M3 swaps the source for Supabase)
  components/         # Screen, StatusBar, Icon, Card, Pill, StatusBadge, Avatar, PrimaryButton, TabBarIcon
  lib/               # supabase client + env
  features/auth/     # AuthProvider, useAuth, useMembership, guard, invite, appleAuth
supabase/
  migrations/        # 0001_schema.sql, 0002_rls.sql
  functions/         # delete-account Edge Function
__tests__/           # unit + smoke tests
docs/superpowers/    # design spec + implementation plans
```

## Docs

- Design spec: [docs/superpowers/specs/2026-06-26-vela-design.md](docs/superpowers/specs/2026-06-26-vela-design.md)
- M1 plan: [docs/superpowers/plans/2026-06-26-vela-m1-foundation.md](docs/superpowers/plans/2026-06-26-vela-m1-foundation.md)
- M2 plan: [docs/superpowers/plans/2026-06-26-vela-m2-backend-auth.md](docs/superpowers/plans/2026-06-26-vela-m2-backend-auth.md)

## Roadmap

- **M1 — Foundation** ✅ screens, navigation, theme, mock data.
- **M2 — Backend + auth** ✅ Supabase (Postgres + RLS), email/password + Sign in with Apple, onboarding, family invite/join, account deletion.
- **M3 — Live data** ✅ screens wired to Supabase, realtime sync (family ⇄ nurse), real entry forms (vitals/meds/messages/handoff).
- **M4 — Compliance & polish:** privacy/consent, push, settings, accessibility, localization, icons/splash.
- **M5 — Release prep:** bundle id, EAS config, iOS/Android builds, TestFlight + store metadata. (Paid submission deferred until Apple Developer enrollment; iOS production build via EAS cloud or a Mac.)
