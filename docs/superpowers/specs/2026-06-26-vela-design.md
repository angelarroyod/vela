# Vela — Independent Nursing Care App (product design spec)

**Date:** 2026-06-26 (rev 2 — full product scope)
**Source design:** Claude Design handoff `Vela.dc.html` (9-phone canvas).
**Goal:** Ship a **complete, functional** home nursing-care app built to satisfy Apple App Store Review Guidelines, ready for TestFlight/submission via EAS.

## 0. Reality & constraints (read first)

- **No approval guarantee.** Apple review is discretionary. This spec maximizes guideline compliance and prepares submission; it cannot promise acceptance.
- **Windows dev host → no Xcode.** All iOS builds go through **EAS Build** (Expo cloud). No Mac required.
- **Apple Developer Program not yet held.** We build + produce a TestFlight/submission-ready binary and metadata; the paid `eas submit` step is deferred until the user enrolls ($99/yr, 24–48h identity check).
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
- **M2 — Backend + auth:** Supabase project, schema + RLS migrations, email/password + Apple auth, onboarding, invite/join, account deletion.
- **M3 — Live data:** wire screens to Supabase, react-query, Realtime sync, entry forms (vitals/meds/messages/handoff).
- **M4 — Compliance & polish:** privacy/consent/disclaimer, settings, push, states, accessibility, localization, icons/splash.
- **M5 — Release prep:** bundle id, `app.json`, `eas.json` (dev/preview/production + submit placeholder), iOS EAS build, TestFlight + App Store Connect metadata/screenshots draft. **`eas submit` deferred** to user's Apple account.

## 11. Release engineering (M5 detail)
- `app.json`: name "Vela", slug, bundle id `com.<owner>.vela`, icon/splash, `infoPlist` usage strings, `supportsTablet:false` (iPhone), `userInterfaceStyle`.
- `eas.json`: build profiles; `production` for store; submit config stubbed (`ascAppId`, `appleTeamId` filled when enrolled).
- Build: `eas build -p ios --profile production` (cloud). Distribute via TestFlight first.
- App Store Connect: privacy answers, age rating, screenshots (from EAS build/simulator), review notes incl. demo credentials.

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
