# Vela — Independent Nursing Care App (product design spec)

**Date:** 2026-06-26 (rev 3 — iOS delivery via Expo/EAS refined)
**Source design:** Claude Design handoff `Vela.dc.html` (9-phone canvas).
**Goal:** Ship a **complete, functional** home nursing-care app, **iOS-first**, built to satisfy Apple App Store Review Guidelines and delivered through Expo/EAS (TestFlight → App Store). Android is a parallel freebie from the same codebase.

## 0. Reality & constraints (read first)

- **No approval guarantee.** Apple review is discretionary. This spec maximizes guideline compliance and prepares submission; it cannot promise acceptance.
- **Windows dev host.** iOS binaries are produced by **EAS Build** (Expo cloud) — no Mac needed to *build* iOS. Local iOS builds / free-Apple-ID Xcode signing would need the Mac (mini incoming).
- **Expo Go vs dev build.** Email/password auth + every M1/M3 screen run in **Expo Go** today (tested on the user's iPhone 17 Pro Max over LAN). **Sign in with Apple and push notifications need a custom dev build** (`eas build --profile development`) — they cannot run in Expo Go.
- **Apple Developer Program ($99/yr) gates two things:** (a) signing + installing a **dev build on the physical iPhone** via EAS (device registration/provisioning, all from Windows), and (b) **TestFlight + `eas submit`**. Until enrolled: build email/password in Expo Go; a Mac with a free Apple ID is the alternative path for a personal on-device dev build. **Open decision:** enroll now to unblock on-device Apple auth/push, or defer and keep that work behind a flag.
- **Secrets:** Supabase **anon** key ships in the app (public-safe; RLS is the security boundary). The **service-role** key never goes in the client — server-only (Edge Functions). No secrets committed to git.

## 1. Overview

Two roles share one app around a patient:
- **Nurse** records vitals, medication, notes/anomalies, and shift handoff.
- **Family** follows the patient's status, activity feed, and chats with the nurse — **live**.

Access is patient-scoped: a user only sees patients they're a member of, with role-based write permissions.

### In scope (full app)
9 designed screens + the surfaces an App-Store app requires: auth/onboarding, account & settings (incl. **account deletion**), family **invite/join**, real data entry (vitals, meds, messages, handoff), **realtime sync**, **push notifications**, privacy policy + consent, medical disclaimer, loading/empty/error states, accessibility, Spanish localization.

### Out of scope (now)
Web/Android release (Expo supports them later), telehealth/video, billing/insurance, EHR integrations, wearable ingestion, AI features.

## 2. Stack

- **Expo SDK 54+ / React Native / TypeScript**, **expo-router**.
- **Supabase**: Postgres, Auth (email/password + Apple), Realtime, Storage (avatars), Edge Functions (push fan-out, account deletion).
- **expo-apple-authentication** + Supabase Apple identity; **expo-notifications** (Expo Push → APNs); **expo-secure-store** (session); **react-native-svg**; **expo-linear-gradient**; **@expo-google-fonts/hanken-grotesk** + **instrument-serif**.
- **EAS Build/Submit** for release.
- State/data: **@tanstack/react-query** over `@supabase/supabase-js`; light `zustand` for session/UI.

## 3. Data model (Postgres)

- `profiles` — 1:1 with `auth.users`: `id`, `full_name`, `avatar_url`, `locale`, `created_at`.
- `patients` — `id`, `full_name`, `age`, `room`, `status` (estable/observación/…), `dob`, `notes`.
- `care_memberships` — `patient_id`, `profile_id`, `role` (`nurse`|`family`|`doctor`), `relationship`, `is_primary`, `shift` (day/night, nurses). **Access-control join table.**
- `vitals` — `patient_id`, `recorded_by`, `bp_sys`, `bp_dia`, `hr`, `temp_c`, `spo2`, `taken_at`, `note`, `has_anomaly`.
- `medications` — `patient_id`, `name`, `dose`, `reason`, `scheduled_at`, `status` (`pending`|`administered`|`skipped`), `administered_by`, `administered_at`.
- `care_events` — `patient_id`, `author_id`, `type` (`vitals`|`medication`|`note`|`anomaly`|`position`|`settle`), `title`, `body`, `severity` (`info`|`warning`), `occurred_at`. Powers Activity feed + Relevo timeline.
- `messages` — `patient_id`, `sender_id`, `body`, `created_at`, `read_at`.
- `shift_handoffs` — `patient_id`, `nurse_id`, `summary`, `recommendation`, `started_at`, `ended_at`.
- `invites` — `patient_id`, `email`, `role`, `token`, `invited_by`, `accepted_at`, `expires_at`.
- `push_tokens` — `profile_id`, `token`, `platform`, `updated_at`.

### Row-Level Security (the security boundary)
- Helper: `is_member(patient_id, auth.uid())` via `care_memberships`.
- **Read:** any member of the patient can read that patient's `patients`, `vitals`, `medications`, `care_events`, `messages`, `shift_handoffs`.
- **Write:** `vitals`/`medications`/`care_events`/`shift_handoffs` insert/update gated to members with `role = 'nurse'`. `messages` insert gated to any member (sender = self). `invites` insert gated to `is_primary` member. `profiles`/`push_tokens` row owned by self.
- No table is world-readable. Anon key + RLS only.

## 4. Auth & onboarding

- **Welcome (00)** → choose role → **Sign up / Log in** (email/password + **Sign in with Apple**). Consent checkbox links Privacy Policy + medical disclaimer at signup.
- First nurse for a patient creates/links the patient record (or is assigned). **Family joins via invite** (email + token deep link, `expo-linking`).
- Session persisted in `expo-secure-store`; auto-refresh; protected route groups redirect unauthenticated users to Welcome.
- **Account deletion** (Settings): Edge Function deletes `auth.users` row → cascades app data; confirm dialog; required by Guideline 5.1.1(v).

## 5. Navigation architecture

Root **Stack**: `(auth)` group (welcome/login/signup/join) and `(app)` group gated by session. Inside `(app)`, role determines which tab group renders.

```
app/
  _layout.tsx                 # fonts, query client, session provider, route guard
  (auth)/
    welcome.tsx               # 00 Bienvenida (role pick)
    login.tsx  signup.tsx  join.tsx   # invite accept
  (app)/
    _layout.tsx               # session-gated; routes to nurse|family by membership role
    nurse/
      _layout.tsx             # Stack (tabs + pushed)
      (tabs)/_layout.tsx      # Inicio · Signos · Relevo · Perfil
      inicio.tsx              # 01
      signos.tsx              # 02 (read + entry form)
      relevo.tsx              # 04 (compose handoff)
      perfil.tsx              # nurse profile (minimal real screen)
      medicacion.tsx          # 03 pushed; administer action
    family/
      _layout.tsx
      (tabs)/_layout.tsx      # Inicio · Actividad · Mensajes · Perfil
      inicio.tsx  actividad.tsx  mensajes.tsx  perfil.tsx   # 05-08
    settings/                 # profile, notifications, privacy, delete account
```

### Routing rules (from design)
Welcome role → auth → role tab group. Nurse Inicio CTA + Signos tab → `signos`; "Próximas tareas → Medicación" → push `medicacion`; Relevo submit → confirm + back to Inicio. Family Mensajes reachable as tab; back pops to Inicio. Signos/Mensajes are **tabs** (no back arrow in tab context); **Medicación** is the lone pushed screen (keeps back arrow).

## 6. Real functionality per feature (beyond static design)

- **Signos vitales:** editable inputs (BP, HR, temp, SpO₂), range validation → status badge, anomaly toggle persists, "Guardar registro" inserts `vitals` + a `care_events` row (and a `warning` event if anomaly).
- **Medicación:** list from `medications`; tap pending dose → confirm administer → status `administered` + `care_events` + (later) cancels its reminder.
- **Relevo:** timeline from `care_events`; "Entregar turno" writes `shift_handoffs` (summary+recommendation), marks shift ended.
- **Family Inicio/Actividad:** live `care_events`/`vitals` via Realtime — nurse entries appear without refresh.
- **Mensajes:** real send/receive on `messages` (Realtime), read receipts.
- **Perfil (family):** patient, care team, conditions, emergency contacts; tap phone → `tel:` link.

## 7. Compliance & polish (mandatory workstreams)

- **Privacy:** in-app Privacy Policy + hosted URL; consent at signup; health data not used for ads/tracking (5.1.3); App Privacy "nutrition label" data map prepared.
- **Medical disclaimer:** record-keeping tool, not a medical device / not for diagnosis; shown at onboarding + Settings.
- **Account management:** edit profile, notification prefs, sign out, **delete account**.
- **Permissions:** notifications usage; no camera/location unless added (avatar uses library picker → photo permission string if enabled).
- **States:** loading skeletons, empty states, error + retry, offline banner (react-query cache).
- **Accessibility:** VoiceOver labels on icons/buttons, Dynamic Type-friendly sizing, ≥4.5:1 contrast check, hit targets ≥44pt.
- **Localization:** Spanish primary (`es`); strings centralized for future `en`.
- **No placeholder/demo content** in shipped build (Guideline 2.1) — real flows, seeded demo account allowed for review notes.

## 8. Push notifications
`expo-notifications` registers device → `push_tokens`. Triggers: medication reminders (scheduled) and family anomaly alerts (on `warning` `care_events`). Fan-out via Supabase Edge Function → Expo Push API → APNs. Requires APNs key (Apple account) at release; built behind a feature flag until then.

## 9. Design system

Tokens, components, fidelity targets, and the nurse-Perfil gap resolution are unchanged from rev 1 §4–§6 (Hanken Grotesk / Instrument Serif; green `#5C8A77` system; 390×844 frame on web, full-bleed + safe-area on device; SVG icons ported 1:1). All screen copy/colors/spacing match the canvas.

## 10. Milestone roadmap

- **M1 — Foundation:** Expo scaffold, theme, components, all 9 screens with real navigation + mock data placeholder. *Runnable on Windows (web + Expo Go).*
- **M2 — Backend + auth:** Supabase project, schema + RLS migrations, **email/password (Expo Go-testable now)** + onboarding, invite/join, account deletion. **Sign in with Apple** is coded here but runs only on the **iOS dev build** (see §11) — gated on Apple enrollment.
- **M3 — Live data:** wire screens to Supabase, react-query, Realtime sync, entry forms (vitals/meds/messages/handoff).
- **M4 — Compliance & polish:** privacy/consent/disclaimer, settings, push, states, accessibility, localization, icons/splash.
- **M5 — Release prep:** App Store Connect record, metadata/screenshots, production EAS build, TestFlight, `eas submit`. **Paid submission deferred** to Apple enrollment.

## 11. iOS delivery via Expo/EAS

Grounded in the Expo deployment + dev-client guides. All commands run from **Windows** (EAS builds in the cloud).

**Prereqs (user actions):** Expo account (free) · Apple Developer Program ($99/yr) — required for on-device dev builds, TestFlight, and submit.

### One-time EAS setup (start of M2)
- `npm i -g eas-cli && eas login`; `npx eas-cli@latest init` → writes `extra.eas.projectId` + `owner` into `app.json`.
- **`app.json` iOS:** `ios.bundleIdentifier` `com.vela.app`, `supportsTablet:false`, icon/splash, `ios.infoPlist.ITSAppUsesNonExemptEncryption:false`, usage strings as features land (`NSFaceIDUsageDescription` if biometric unlock, `NSPhotoLibraryUsageDescription` if avatar picker). Plugins: `expo-apple-authentication` (Sign in with Apple entitlement), `expo-notifications` (push).
- **`eas.json` profiles:**
  - `development` — `developmentClient:true`, `distribution:"internal"` (dev build for the iPhone).
  - `preview` — internal release build for beta sanity checks.
  - `production` — `autoIncrement:true`, `appVersionSource:"remote"`.
  - `submit.production.ios` — `{ appleId, ascAppId, appleTeamId }`, filled at enrollment.
- `eas credentials` → provision Apple signing; register the iPhone 17 Pro Max UDID for dev/internal distribution.

### Dev loop (M2–M4, once native features exist)
- `eas build -p ios --profile development --submit` → arrives in TestFlight (or internal link) → install on the iPhone → `npx expo start --dev-client` and connect over LAN. **This dev build replaces Expo Go** the moment Sign in with Apple / push are in. Email/password keeps working in plain Expo Go until then.

### Beta (end of M4)
- `eas build -p ios --profile production --submit` (or `npx testflight`) → TestFlight internal testers (you). Validate full nurse + family flows on-device.

### Store (M5 — deferred to enrollment)
- App Store Connect app record; App Privacy "nutrition labels" + age rating; screenshots; review notes incl. a demo account (nurse + family) so Apple can exercise both roles.
- `eas submit -p ios`. Versions managed remotely (`eas build:version:get/set`).

### Android (parallel, optional, no Mac)
- Same EAS flow with `-p android`; Google Play Developer account ($25 one-time); tracks internal → production.

## 12. File structure (target)
```
vela/
  app/                  # routes (§5)
  src/
    theme.ts            # tokens
    components/         # shared UI
    lib/supabase.ts     # client (anon key from env)
    features/{vitals,meds,events,messages,handoff,auth}/   # hooks + queries
    i18n/es.ts
  supabase/
    migrations/*.sql    # schema + RLS
    functions/          # push fan-out, delete-account
  assets/               # icon, splash, fonts
  app.json  eas.json  package.json  tsconfig.json  .env.example
  docs/superpowers/specs/2026-06-26-vela-design.md
```
