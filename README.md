# Vela — Independent Nursing Care App

Home nursing-care app with two roles sharing one app:

- **Nurse (enfermera):** records vitals, medication, notes/anomalies, and shift handoff.
- **Family (familiar):** follows the patient's status, activity feed, and chats with the nurse.

Built with **Expo (React Native + TypeScript)** and **expo-router**. Cross-platform — the same code runs on iOS and Android.

> Spanish-language UI. Patient/care content in this milestone is **static mock data** (`src/data.ts`); the live Supabase backend, auth, real data entry, realtime sync, and push arrive in M2–M3.

## Status — M1 (foundation) complete

All 9 designed screens, built and navigable with mock data:

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
npm start          # Expo dev server (Metro)
```

- **iPhone / Android (Expo Go):** open Expo Go → scan the QR or enter the `exp://<LAN-IP>:<port>` URL. Phone and computer must share a Wi-Fi network. Use `npx expo start --tunnel` if your network blocks LAN.
- **Web preview:** `npm run web`.

## Quality gates

```bash
npm test           # jest-expo + @testing-library/react-native (38 tests)
npm run typecheck  # tsc --noEmit
```

The web bundle builds cleanly via `npx expo export -p web`.

## Project layout

```
app/                 # expo-router routes
  index.tsx          # 00 Welcome
  nurse/             # nurse Stack + (tabs) + pushed medicacion
  family/            # family Stack + (tabs)
src/
  theme.ts           # design tokens (color / type / radius / shadow)
  data.ts            # typed mock fixtures (M3 swaps the source for Supabase)
  components/         # Screen, StatusBar, Icon, Card, Pill, StatusBadge, Avatar, PrimaryButton, TabBarIcon
__tests__/           # unit + smoke tests
docs/superpowers/    # design spec + implementation plan
```

## Docs

- Design spec: [docs/superpowers/specs/2026-06-26-vela-design.md](docs/superpowers/specs/2026-06-26-vela-design.md)
- M1 plan: [docs/superpowers/plans/2026-06-26-vela-m1-foundation.md](docs/superpowers/plans/2026-06-26-vela-m1-foundation.md)

## Roadmap

- **M1 — Foundation** ✅ screens, navigation, theme, mock data (this milestone).
- **M2 — Backend + auth:** Supabase (Postgres + RLS), email/password + Sign in with Apple, onboarding, family invite/join, account deletion.
- **M3 — Live data:** wire screens to Supabase, realtime sync (family ⇄ nurse), real entry forms (vitals/meds/messages/handoff).
- **M4 — Compliance & polish:** privacy/consent, push, settings, accessibility, localization, icons/splash.
- **M5 — Release prep:** bundle id, EAS config, iOS/Android builds, TestFlight + store metadata. (Paid submission deferred until Apple Developer enrollment; iOS production build via EAS cloud or a Mac.)
