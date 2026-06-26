# Vela — Independent Nursing Care App (design spec)

**Date:** 2026-06-26
**Source:** Claude Design handoff `independent-nursing-care-app/project/Vela.dc.html` (9-phone canvas).
**Goal:** Recreate the design pixel-faithfully as a navigable Expo (React Native + TypeScript) prototype.

## 1. Overview

Vela is a bilingual-feeling (Spanish copy) home nursing-care app with **two roles sharing one app**:

- **Nurse (enfermera)** — Carmen registers care during the night shift for patient Elena.
- **Family (familiar)** — Lucía follows her mother's status in real time.

The prototype reproduces all 9 designed screens with working navigation and static mock data. No backend, no auth, no persistence.

### Goals
- Pixel-faithful match to the canvas: spacing, colors, radii, shadows, SVG icons, Spanish copy verbatim.
- Working navigation: role pick → role tab navigators; back arrows pop; CTAs route.
- Runnable on Windows via Expo (web preview primary; Expo Go secondary).

### Non-goals (YAGNI)
- No real data/API, auth, forms that submit, or local DB.
- No dark mode, i18n switcher, animations beyond what the design implies, or tests of business logic (it has none).
- Do not port `support.js` (it's the Claude Design canvas runtime, irrelevant to the app).

## 2. Tech stack

- **Expo SDK 54+**, **expo-router** (file-based routing), **TypeScript**.
- **react-native-svg** for all icons (the design uses inline SVG).
- Fonts via **@expo-google-fonts/hanken-grotesk** + **@expo-google-fonts/instrument-serif** (loaded with `expo-font` / `useFonts`).
- **react-native-safe-area-context** (already implied by phone frame; faux status bar is part of the design).
- Web preview through `react-native-web` (Expo default).

## 3. Navigation architecture

Root **Stack** → Welcome role-picker → one of two **Tab** groups.

```
app/
  _layout.tsx              # root Stack; load fonts here; initial route = index
  index.tsx                # 00 Bienvenida — role picker, routes to nurse/family
  nurse/
    _layout.tsx            # Stack wrapping the nurse tabs + pushed detail screen
    (tabs)/
      _layout.tsx          # Tabs: Inicio · Signos · Relevo · Perfil
      inicio.tsx           # 01 Inicio del turno
      signos.tsx           # 02 Signos vitales
      relevo.tsx           # 04 Relevo de turno
      perfil.tsx           # nurse profile (see §6 gap resolution)
    medicacion.tsx         # 03 Medicación — PUSHED from Inicio task card (keeps back arrow)
  family/
    _layout.tsx            # Stack wrapping the family tabs
    (tabs)/
      _layout.tsx          # Tabs: Inicio · Actividad · Mensajes · Perfil
      inicio.tsx           # 05 Estado de mamá
      actividad.tsx        # 06 Actividad
      mensajes.tsx         # 07 Mensajes
      perfil.tsx           # 08 Perfil de Elena
```

### Routing rules (from the design)
- Welcome "Soy enfermera/o" → `/nurse/(tabs)/inicio`. "Soy familiar" → `/family/(tabs)/inicio`.
- Nurse Inicio CTA "Registrar signos vitales" **and** the "Signos" tab → `signos`.
- Nurse Inicio "Próximas tareas → Medicación" card → push `/nurse/medicacion` (header back arrow pops).
- "Entregar turno al equipo de día" (Relevo) → for the prototype, returns to Inicio (no further screen designed).
- Family chat (Mensajes) back arrow + Mensajes tab both reach the chat screen; back pops to Inicio.
- Tab bars switch screens; detail back arrows pop. Tab-context screens render no back arrow; pushed screens (Medicación) do.

### Screen-type reconciliation
The canvas mixes tab screens and pushed detail screens; some screens (02 Signos, 07 Mensajes) show a back arrow yet also appear as a tab. Resolution: treat **Signos** and **Mensajes** as **tabs** (primary), drawn without the back arrow in tab context. Only **Medicación (03)** is a true pushed screen and keeps its back arrow.

## 4. Design tokens (`src/theme.ts`)

### Color
- **Brand greens:** primary `#5C8A77`; deep `#3C6353`; ink `#28332E`; serif-heading `#3C4D45`; body-on-card `#52605A`; gradient pairs welcome `#5C8A77→#41685A`, family hero `#5C8A77→#487062` (and `#487062` deep variant).
- **Mint fills:** `#E3EFE9`, `#DCEAE3`, `#EAF3EE`; hero-on-green text `#D6ECE1`/`#CFE6DA`; hero dot `#BFE6D2`.
- **Neutrals/bg:** app bg `#F1F5F2`; chat bg `#EEF3F0`; white `#fff`; chip bg `#F2F6F3`.
- **Borders:** main `#E7EEE9`; card `#EEF3EF`; chat header `#EAF0EC`; progress track `#EAF0EC`; divider `#F0F4F1`; dashed pending `#D6DEDA` / circle `#C9D3CD`; timeline line `#E2EAE5`.
- **Muted text:** `#7C8A82`, `#8A968E`, `#A9B4AD`; chevron `#C2CCC6`.
- **Amber/warning:** accent `#C0913F`; family-role icon `#B07A4E`; anomaly dot `#D6A547`; fills `#F6ECD9`/`#F3EADF`/`#FBF4E6`/`#F2E4C2`; border `#F0E2C4`; texts `#8A6A1E`/`#8A7338`/`#9A7B2E`/`#A88A4A`; strokes `#B58A2E`; timestamps `#B49454`/`#C0A463`; Rosa initials `#A56F42`.
- **Doctor blue:** `#5E739B` on `#E4E9F0`.

### Type
- Sans: **Hanken Grotesk** (400/500/600/700/800).
- Serif: **Instrument Serif** (regular + italic) — used for the "Vela" wordmark and large greetings.
- Key sizes seen: serif 46/40/32/30/25/24; sans 18/17/16/15/14/13/12/11/10 with weights per element.

### Geometry / effects
- Phone frame: **390 × 844**, radius **46**, border `#E7EEE9`, shadow `0 30px 70px rgba(53,94,80,.16)` + `0 4px 14px rgba(53,94,80,.08)`.
- Cards: radius 16–26; borders `#EEF3EF`; soft shadows `rgba(53,94,80,.04–.08)`.
- Pills/badges: radius 99; status badge mint `#E3EFE9` + dot `#5C8A77` + text `#3C6353`.
- Primary button: height 56, radius 18, bg `#5C8A77`, shadow `0 10px 24px rgba(92,138,119,.34)`, white 700/16 text, optional leading icon.
- Status bar: 54 tall; icon color `#fff` on green screens else `#28332E`.
- Tab bar: 80 tall, white, border-top `#EEF3EF`; active `#5C8A77`, inactive `#A9B4AD`.

> RN mapping: CSS `box-shadow` → iOS `shadowColor/Opacity/Radius/Offset` + Android `elevation`; gradients → `expo-linear-gradient`; `font:700 16px` shorthand → explicit `fontFamily`/`fontWeight`/`fontSize`.

## 5. Shared components (`src/components/`)

- `PhoneFrame` — 390-wide rounded frame, shadow, background color prop; clips content. (For web preview; on device it fills the screen.)
- `StatusBar` — time string + signal/wifi/battery SVGs; `tint` prop (light/dark).
- `TabBar` — driven by expo-router `Tabs`; 4 items with SVG icon + label, active/inactive tint.
- `Card`, `Pill`, `StatusBadge` (mint "Estable"/"Normal").
- `PrimaryButton` — green CTA with optional leading icon.
- `Avatar` — initials chip with configurable bg/fg (CM, L, E, RG, DM).
- `Icon` — central `react-native-svg` icon set ported 1:1 from the canvas: drop (logo), activity/pulse line, heart, pill, clipboard, home, user, message, send, check, plus, chevron-left/right, warning-triangle, bell, phone, lightbulb, signal/wifi/battery.

## 6. Gap resolution — nurse "Perfil" tab

The nurse tab bar includes a **Perfil** tab but the canvas has **no nurse profile mockup**. **Decision (approved):** build a minimal nurse Perfil reusing theme components — Carmen avatar (CM), role "Enfermera · turno de noche", shift "22:00 – 06:00", assigned patient (Elena), and a "Cerrar sesión" row. Visual language matches existing cards; nothing invented beyond layout.

## 7. Mock data (`src/data.ts`)

Single static module exporting typed fixtures used across screens (keeps copy/numbers consistent):
- `patient` (Elena Rivas, 78, Habitación principal, Estable, conditions, allergy).
- `nurse` (Carmen Morales, night shift), `family` (Lucía Rivas), `careTeam` (Carmen/Rosa/Dr. Méndez), `contacts`.
- `vitals` (PA 128/82, FC 72, T 36.7, SpO₂ 97, all Normal, control 00:00/00:02).
- `medications` (Amlodipino, Atorvastatina, Losartán, Levotiroxina with times/status; "4 de 5", 80%).
- `relevoTimeline` (4 entries incl. amber anomaly 01:15), `recommendation`.
- `activityFeed` (4 entries), `messages` (4-bubble thread).

## 8. Fidelity notes
- Spanish copy reproduced exactly (incl. emojis 🌙 💊 🙏, "SpO₂", "°C", accents).
- Per-screen status-bar times preserved (21:30, 23:14, 00:02, 23:44, 05:48, 23:42, 23:43, 23:44, 23:46).
- The canvas section headers ("Bienvenida"/"Para la enfermera"/"Para la familia") are presentation chrome, not app UI — omitted from the running app.

## 9. Running
- `cd vela && npx expo start` → press `w` for web (primary on Windows), or scan QR in Expo Go.
- Web frame renders the 390×844 phone; on a device it fills the screen with safe-area padding.

## 10. File structure (target)
```
vela/
  app/                 # routes (see §3)
  src/
    theme.ts           # tokens (§4)
    data.ts            # mock fixtures (§7)
    components/        # shared UI (§5)
  assets/
  app.json, package.json, tsconfig.json
  docs/superpowers/specs/2026-06-26-vela-design.md
```
