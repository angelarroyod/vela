# Vela M1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Vela Expo app — theme, shared components, mock data, and all 9 designed screens with working navigation — runnable on Windows via Expo (web + Expo Go).

**Architecture:** Expo SDK 54 + expo-router (file-based). M1 ships a *simplified* nav (Welcome → role tab groups, no auth) that M2 will wrap in session-gated `(auth)`/`(app)` groups. Every screen is a static render of `src/data.ts` mock fixtures; data entry, Supabase, and realtime arrive in M2–M3. UI is composed from a small set of themed primitives so M3 can swap mock data for live data without touching layout.

**Tech Stack:** TypeScript, expo-router, react-native-svg, expo-linear-gradient, @expo-google-fonts (Hanken Grotesk + Instrument Serif), jest-expo + @testing-library/react-native.

**Design source of truth:** The pixel-exact source is the handoff file
`C:\Users\angel\Claude\Projects\inc-app\independent-nursing-care-app\project\Vela.dc.html`.
Screen tasks below cite its line ranges. When a task says "match source lines X–Y," copy the exact colors/sizes/spacing/copy from those lines (CSS inline styles) into the RN `StyleSheet`. This is a precise reference, not a placeholder — the file is committed in the repo workspace and must be open while building screen tasks.

**CSS→RN translation rules (apply everywhere):**
- `font:700 16px 'Hanken Grotesk'` → `{ fontFamily: 'HankenGrotesk_700Bold', fontSize: 16 }`. Weight→family suffix map: 400 `_400Regular`, 500 `_500Medium`, 600 `_600SemiBold`, 700 `_700Bold`, 800 `_800ExtraBold`. Serif: `InstrumentSerif_400Regular`.
- `box-shadow: 0 30px 70px rgba(53,94,80,.16)` → `{ shadowColor: '#355E50', shadowOpacity: 0.16, shadowRadius: 35, shadowOffset: { width: 0, height: 30 }, elevation: 12 }`. (`53,94,80` = `#355E50`.)
- `linear-gradient(165deg,#5C8A77,#41685A)` → `<LinearGradient colors={['#5C8A77','#41685A']} start={{x:0,y:0}} end={{x:1,y:1}}>`.
- `border-radius:99px` (pill) → `borderRadius: 999`.
- inline SVG → `react-native-svg` (`Svg`, `Path`, `Rect`, `Circle`) with identical `viewBox`, `d`, `stroke`, `fill`, `strokeWidth`.
- All numeric px values map 1:1 to RN density-independent units.

---

## File Structure

```
vela/
  app/
    _layout.tsx                 # root Stack + font loading + SafeAreaProvider
    index.tsx                   # 00 Welcome (role picker)
    nurse/
      _layout.tsx               # Stack: tabs group + pushed medicacion
      (tabs)/
        _layout.tsx             # Tabs: Inicio·Signos·Relevo·Perfil
        inicio.tsx              # 01
        signos.tsx              # 02 (static)
        relevo.tsx              # 04
        perfil.tsx              # nurse profile (minimal)
      medicacion.tsx            # 03 (pushed)
    family/
      _layout.tsx               # Stack
      (tabs)/
        _layout.tsx             # Tabs: Inicio·Actividad·Mensajes·Perfil
        inicio.tsx              # 05
        actividad.tsx           # 06
        mensajes.tsx            # 07
        perfil.tsx              # 08
  src/
    theme.ts                    # color/type/space/radius/shadow tokens
    data.ts                     # typed mock fixtures + types
    components/
      PhoneFrame.tsx  Screen.tsx
      StatusBar.tsx   FakeNavBar.tsx
      Icon.tsx                  # react-native-svg icon set
      Card.tsx  Pill.tsx  StatusBadge.tsx  Avatar.tsx  PrimaryButton.tsx
      TabBarIcon.tsx
  __tests__/                    # jest tests mirror src/ + app/
  app.json  eas.json(stub later) babel.config.js  jest.config.js  jest.setup.js
  tsconfig.json  package.json  .gitignore
```

**Responsibilities:** `theme.ts` = all design tokens (single source). `data.ts` = all mock content + the TypeScript types screens bind to (M3 keeps the types, swaps the source). `components/*` = stateless presentational primitives. `app/*` = route + screen composition only.

---

## Task 1: Scaffold Expo project + tooling

**Files:**
- Create: `vela/package.json`, `vela/app.json`, `vela/babel.config.js`, `vela/tsconfig.json`, `vela/jest.config.js`, `vela/jest.setup.js`, `vela/.gitignore`, `vela/app/_layout.tsx`, `vela/app/index.tsx`

- [ ] **Step 1: Initialize Expo app in-place**

The `vela/` dir already exists (git + docs). Scaffold into it:

```bash
cd C:/Users/angel/Claude/Projects/vela
npx create-expo-app@latest . --template blank-typescript
```

If the CLI refuses due to existing files, scaffold in a temp dir and copy app source over, preserving `docs/` and `.git/`:

```bash
npx create-expo-app@latest ../vela-tmp --template blank-typescript
# then copy everything except node_modules/.git from ../vela-tmp into ./, and delete ../vela-tmp
```

- [ ] **Step 2: Install runtime + dev deps (use expo install for native to match SDK)**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-svg expo-linear-gradient expo-font
npx expo install @expo-google-fonts/hanken-grotesk @expo-google-fonts/instrument-serif
npm i -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

- [ ] **Step 3: Write config files**

`package.json` — set `"main": "expo-router/entry"` and scripts:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

`app.json` (merge into existing `expo` block):

```json
{
  "expo": {
    "name": "Vela",
    "slug": "vela",
    "scheme": "vela",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": { "supportsTablet": false, "bundleIdentifier": "com.vela.app" },
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

`jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-router|@react-native/js-polyfills))'
  ]
};
```

`jest.setup.js`:

```js
// Make fonts resolve instantly in tests
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
  isLoaded: () => true,
}));
```

`tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true, "baseUrl": ".", "paths": { "@/*": ["src/*"] } },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

Append to `.gitignore`: `node_modules/`, `.expo/`, `dist/`, `*.log`, `.env*` (keep `.env.example`).

- [ ] **Step 4: Remove default `App.tsx` and create minimal router entry**

Delete the template `App.tsx` if present. Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

Create `app/index.tsx` (temporary, replaced in Task 9):

```tsx
import { Text, View } from 'react-native';
export default function Index() {
  return <View><Text>Vela boots</Text></View>;
}
```

- [ ] **Step 5: Verify boot + test runner**

```bash
npm run typecheck
npm test -- --passWithNoTests
npx expo start --web
```
Expected: typecheck passes; jest runs (0 tests OK); web opens showing "Vela boots". Stop the server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vela Expo app with expo-router and jest"
```

---

## Task 2: Design tokens (`src/theme.ts`)

**Files:**
- Create: `src/theme.ts`, `__tests__/theme.test.ts`

- [ ] **Step 1: Write the failing test**

`__tests__/theme.test.ts`:

```ts
import { colors, font, radius, shadow, fontFamilyForWeight } from '@/theme';

test('core brand colors present', () => {
  expect(colors.primary).toBe('#5C8A77');
  expect(colors.ink).toBe('#28332E');
  expect(colors.appBg).toBe('#F1F5F2');
});

test('weight maps to google-font family', () => {
  expect(fontFamilyForWeight(700)).toBe('HankenGrotesk_700Bold');
  expect(fontFamilyForWeight(400)).toBe('HankenGrotesk_400Regular');
  expect(font.serif).toBe('InstrumentSerif_400Regular');
});

test('phone frame shadow shaped for RN', () => {
  expect(shadow.phone.shadowColor).toBe('#355E50');
  expect(radius.phone).toBe(46);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- theme`
Expected: FAIL — cannot find module `@/theme`.

- [ ] **Step 3: Implement `src/theme.ts`**

```ts
export const colors = {
  primary: '#5C8A77', primaryDeep: '#3C6353', ink: '#28332E',
  serifHead: '#3C4D45', bodyOnCard: '#52605A',
  gradWelcome: ['#5C8A77', '#41685A'] as const,
  gradFamilyHero: ['#5C8A77', '#487062'] as const,
  mint: '#E3EFE9', mint2: '#DCEAE3', mint3: '#EAF3EE',
  onGreenText: '#D6ECE1', onGreenSub: '#CFE6DA', heroDot: '#BFE6D2',
  appBg: '#F1F5F2', chatBg: '#EEF3F0', white: '#fff', chipBg: '#F2F6F3',
  border: '#E7EEE9', cardBorder: '#EEF3EF', chatBorder: '#EAF0EC',
  track: '#EAF0EC', divider: '#F0F4F1', dashed: '#D6DEDA', pendingRing: '#C9D3CD',
  timeline: '#E2EAE5',
  muted: '#7C8A82', muted2: '#8A968E', muted3: '#A9B4AD', chevron: '#C2CCC6',
  amber: '#C0913F', amberRole: '#B07A4E', anomalyDot: '#D6A547',
  amberFill: '#F6ECD9', amberFill2: '#F3EADF', anomalyBg: '#FBF4E6',
  anomalyBorder: '#F0E2C4', anomalyAvatar: '#F2E4C2',
  amberText: '#8A6A1E', amberBody: '#8A7338', amberCond: '#9A7B2E',
  amberMuted: '#A88A4A', amberStroke: '#B58A2E', amberTs: '#B49454', amberTs2: '#C0A463',
  rosaInitials: '#A56F42',
  docBlue: '#5E739B', docBlueBg: '#E4E9F0',
  shadowBase: '#355E50',
};

export const font = { serif: 'InstrumentSerif_400Regular' };

const weightMap: Record<number, string> = {
  400: 'HankenGrotesk_400Regular', 500: 'HankenGrotesk_500Medium',
  600: 'HankenGrotesk_600SemiBold', 700: 'HankenGrotesk_700Bold',
  800: 'HankenGrotesk_800ExtraBold',
};
export const fontFamilyForWeight = (w: number) => weightMap[w] ?? weightMap[400];

export const radius = { phone: 46, card: 24, sm: 16, pill: 999, button: 18 };

export const shadow = {
  phone: { shadowColor: colors.shadowBase, shadowOpacity: 0.16, shadowRadius: 35, shadowOffset: { width: 0, height: 30 }, elevation: 12 },
  card: { shadowColor: colors.shadowBase, shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  button: { shadowColor: '#5C8A77', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- theme`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/theme.ts __tests__/theme.test.ts
git commit -m "feat: add design tokens"
```

---

## Task 3: Font loading in root layout

**Files:**
- Modify: `app/_layout.tsx`
- Test: `__tests__/root-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/root-layout.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import RootLayout from '../app/_layout';

test('root layout renders without crashing once fonts loaded', () => {
  // useFonts mocked to [true] in jest.setup.js
  expect(() => render(<RootLayout />)).not.toThrow();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- root-layout`
Expected: FAIL (current `_layout` renders Stack with no font hook; test passes trivially OR fails on Stack context). If it passes trivially, still proceed to add fonts in Step 3 (the test guards regressions).

- [ ] **Step 3: Implement font loading**

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';

export default function RootLayout() {
  const [loaded] = useFonts({
    HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold, InstrumentSerif_400Regular,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F1F5F2' } }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- root-layout`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx __tests__/root-layout.test.tsx
git commit -m "feat: load Hanken Grotesk and Instrument Serif fonts"
```

---

## Task 4: Icon set (`src/components/Icon.tsx`)

**Files:**
- Create: `src/components/Icon.tsx`, `__tests__/icon.test.tsx`

Icon names needed (ported from canvas SVGs): `drop`, `pulse`, `heart`, `pill`, `clipboard`, `home`, `user`, `message`, `send`, `check`, `plus`, `chevronRight`, `chevronLeft`, `warningTri`, `warningCircle`, `bell`, `phone`, `bulb`, `signal`, `wifi`, `battery`.

- [ ] **Step 1: Write the failing test**

`__tests__/icon.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { Icon } from '@/components/Icon';

test('renders a known icon by name', () => {
  const { UNSAFE_root } = render(<Icon name="home" size={24} color="#5C8A77" />);
  expect(UNSAFE_root).toBeTruthy();
});

test('unknown icon renders nothing but does not throw', () => {
  // @ts-expect-error testing invalid name
  expect(() => render(<Icon name="nope" size={10} color="#000" />)).not.toThrow();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- icon`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Icon.tsx`**

Port each SVG 1:1 from the canvas. Signature:

```tsx
import Svg, { Path, Rect, Circle } from 'react-native-svg';

type IconName =
  | 'drop' | 'pulse' | 'heart' | 'pill' | 'clipboard' | 'home' | 'user'
  | 'message' | 'send' | 'check' | 'plus' | 'chevronRight' | 'chevronLeft'
  | 'warningTri' | 'warningCircle' | 'bell' | 'phone' | 'bulb'
  | 'signal' | 'wifi' | 'battery';

export function Icon({ name, size = 24, color = '#28332E', strokeWidth = 1.9 }:
  { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const stroke = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 10.5 12 3l9 7.5" {...stroke} /><Path d="M5 9.5V20h14V9.5" {...stroke} /></Svg>);
    case 'pulse': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 12h4l2-6 3 12 2-6h7" {...stroke} /></Svg>);
    case 'user': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={8} r={3.5} {...stroke} /><Path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" {...stroke} /></Svg>);
    case 'clipboard': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={6} y={4} width={12} height={17} rx={2.5} {...stroke} /><Path d="M9.5 4h5v3h-5z" {...stroke} /><Path d="M9 11.5h6M9 15h4" {...stroke} /></Svg>);
    case 'message': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 6h14v9H10l-4 3.5V15H5z" {...stroke} /></Svg>);
    case 'chevronRight': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M9 5l7 7-7 7" {...stroke} /></Svg>);
    case 'chevronLeft': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M15 5l-7 7 7 7" {...stroke} /></Svg>);
    case 'plus': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" {...stroke} /></Svg>);
    case 'check': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 6.5" {...stroke} /></Svg>);
    case 'send': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" {...stroke} /></Svg>);
    case 'heart': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 20s-6.5-4-6.5-8.5A3.4 3.4 0 0 1 12 8a3.4 3.4 0 0 1 6.5 3.5C18.5 16 12 20 12 20z" {...stroke} /></Svg>);
    case 'drop': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 3c0 4-3 5-3 8a3 3 0 0 0 6 0c0-3-3-4-3-8z" fill={color} /><Path d="M8 16a4 4 0 0 0 8 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" /></Svg>);
    case 'pill': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M10.5 13.5 7 17a3.5 3.5 0 0 1-5-5l3.5-3.5" {...stroke} /><Path d="M13.5 10.5 17 7a3.5 3.5 0 0 0-5-5L8.5 5.5" {...stroke} /><Path d="M9 15l6-6" {...stroke} /></Svg>);
    case 'warningTri': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 8v5" {...stroke} /><Circle cx={12} cy={16.5} r={0.3} {...stroke} /><Path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" {...stroke} /></Svg>);
    case 'warningCircle': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 8v5" {...stroke} /><Circle cx={12} cy={16.5} r={0.4} {...stroke} /></Svg>);
    case 'bell': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...stroke} /><Path d="M10.5 21a1.8 1.8 0 0 0 3 0" {...stroke} /></Svg>);
    case 'phone': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-3z" {...stroke} /></Svg>);
    case 'bulb': return (
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2h6c0-.7.4-1.4 1-2a6 6 0 0 0-4-10z" {...stroke} /></Svg>);
    case 'signal': return (
      <Svg width={size} height={12} viewBox="0 0 18 12"><Rect x={0} y={7} width={3} height={5} rx={1} fill={color} /><Rect x={5} y={4} width={3} height={8} rx={1} fill={color} /><Rect x={10} y={2} width={3} height={10} rx={1} fill={color} /><Rect x={15} y={0} width={3} height={12} rx={1} fill={color} /></Svg>);
    case 'wifi': return (
      <Svg width={17} height={12} viewBox="0 0 17 12"><Path d="M1 4.4C5.2 1 11.8 1 16 4.4M3.6 6.9C6.2 4.9 10.8 4.9 13.4 6.9M6.2 9.2C7.5 8.2 9.5 8.2 10.8 9.2" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" /></Svg>);
    case 'battery': return (
      <Svg width={26} height={13} viewBox="0 0 26 13"><Rect x={0.5} y={0.5} width={21} height={12} rx={3.5} stroke={color} strokeOpacity={0.4} fill="none" /><Rect x={2} y={2} width={16.5} height={9} rx={2} fill={color} /><Rect x={23.5} y={4.5} width={2} height={4} rx={1} fill={color} fillOpacity={0.4} /></Svg>);
    default: return null;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- icon`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Icon.tsx __tests__/icon.test.tsx
git commit -m "feat: add react-native-svg icon set ported from canvas"
```

---

## Task 5: Frame primitives — `PhoneFrame`, `Screen`, `StatusBar`

**Files:**
- Create: `src/components/PhoneFrame.tsx`, `src/components/Screen.tsx`, `src/components/StatusBar.tsx`
- Test: `__tests__/statusbar.test.tsx`

`PhoneFrame` = 390×844 rounded card with `shadow.phone`, border, `overflow:hidden`, accepts `bg` + children. On web it's centered with a max width; on device it flexes to fill. `Screen` = `PhoneFrame` + `StatusBar` + content area. `StatusBar` = 54-tall row, time text left, signal/wifi/battery right; `tint` prop `'light'|'dark'` selects icon/text color (`#fff` vs `#28332E`).

- [ ] **Step 1: Write the failing test**

`__tests__/statusbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { StatusBar } from '@/components/StatusBar';

test('shows the provided time', () => {
  render(<StatusBar time="23:14" tint="dark" />);
  expect(screen.getByText('23:14')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- statusbar`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the three components**

`StatusBar.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { fontFamilyForWeight } from '@/theme';

export function StatusBar({ time, tint = 'dark' }: { time: string; tint?: 'light' | 'dark' }) {
  const c = tint === 'light' ? '#fff' : '#28332E';
  return (
    <View style={s.row}>
      <Text style={[s.time, { color: c }]}>{time}</Text>
      <View style={s.icons}>
        <Icon name="signal" size={18} color={c} />
        <Icon name="wifi" size={17} color={c} />
        <Icon name="battery" size={26} color={c} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  row: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 34, paddingRight: 28 },
  time: { fontFamily: fontFamilyForWeight(700), fontSize: 15 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
```

`PhoneFrame.tsx`:

```tsx
import { View, StyleSheet, Platform } from 'react-native';
import { colors, radius, shadow } from '@/theme';

export function PhoneFrame({ bg = colors.appBg, children }: { bg?: string; children: React.ReactNode }) {
  return <View style={[s.frame, { backgroundColor: bg }]}>{children}</View>;
}
const s = StyleSheet.create({
  frame: {
    width: 390, height: 844, borderRadius: radius.phone, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadow.phone,
    ...(Platform.OS === 'web' ? { alignSelf: 'center', marginVertical: 24 } : { flex: 1 }),
  },
});
```

`Screen.tsx`:

```tsx
import { View, StyleSheet } from 'react-native';
import { PhoneFrame } from './PhoneFrame';
import { StatusBar } from './StatusBar';

export function Screen({ time, tint = 'dark', bg, children }:
  { time: string; tint?: 'light' | 'dark'; bg?: string; children: React.ReactNode }) {
  return (
    <PhoneFrame bg={bg}>
      <StatusBar time={time} tint={tint} />
      <View style={s.body}>{children}</View>
    </PhoneFrame>
  );
}
const s = StyleSheet.create({ body: { flex: 1 } });
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- statusbar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PhoneFrame.tsx src/components/Screen.tsx src/components/StatusBar.tsx __tests__/statusbar.test.tsx
git commit -m "feat: add PhoneFrame, Screen, StatusBar primitives"
```

---

## Task 6: Content primitives — `Card`, `Pill`, `StatusBadge`, `Avatar`, `PrimaryButton`

**Files:**
- Create: `src/components/Card.tsx`, `Pill.tsx`, `StatusBadge.tsx`, `Avatar.tsx`, `PrimaryButton.tsx`
- Test: `__tests__/primitives.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/primitives.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';

test('StatusBadge shows label', () => {
  render(<StatusBadge label="Estable" />);
  expect(screen.getByText('Estable')).toBeTruthy();
});
test('Avatar shows initials', () => {
  render(<Avatar initials="CM" />);
  expect(screen.getByText('CM')).toBeTruthy();
});
test('PrimaryButton fires onPress', () => {
  const fn = jest.fn();
  render(<PrimaryButton label="Guardar" onPress={fn} />);
  fireEvent.press(screen.getByText('Guardar'));
  expect(fn).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- primitives`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement primitives**

`Card.tsx`:

```tsx
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme';
export function Card({ style, children }: { style?: ViewStyle | ViewStyle[]; children: React.ReactNode }) {
  return <View style={[s.card, style]}>{children}</View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, ...shadow.card },
});
```

`Pill.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontFamilyForWeight } from '@/theme';
export function Pill({ label, bg = colors.chipBg, color = colors.muted, border = colors.border }:
  { label: string; bg?: string; color?: string; border?: string }) {
  return (
    <View style={[s.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.txt, { color }]}>{label}</Text>
    </View>);
}
const s = StyleSheet.create({
  pill: { borderRadius: radius.pill, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 11, alignSelf: 'flex-start' },
  txt: { fontFamily: fontFamilyForWeight(600), fontSize: 12 },
});
```

`StatusBadge.tsx` (mint badge with dot, e.g. "Estable"/"Normal"):

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontFamilyForWeight } from '@/theme';
export function StatusBadge({ label, dot = colors.primary, bg = colors.mint, color = colors.primaryDeep }:
  { label: string; dot?: string; bg?: string; color?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <Text style={[s.txt, { color }]}>{label}</Text>
    </View>);
}
const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 11, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 99 },
  txt: { fontFamily: fontFamilyForWeight(700), fontSize: 12 },
});
```

`Avatar.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilyForWeight } from '@/theme';
export function Avatar({ initials, size = 38, bg = colors.mint2, color = colors.primaryDeep, radius = 999 }:
  { initials: string; size?: number; bg?: string; color?: string; radius?: number }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: bg }, s.center]}>
      <Text style={[s.txt, { color, fontSize: Math.round(size * 0.37) }]}>{initials}</Text>
    </View>);
}
const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  txt: { fontFamily: fontFamilyForWeight(700) },
});
```

`PrimaryButton.tsx`:

```tsx
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, fontFamilyForWeight } from '@/theme';
import { Icon } from './Icon';
export function PrimaryButton({ label, onPress, icon }:
  { label: string; onPress?: () => void; icon?: React.ComponentProps<typeof Icon>['name'] }) {
  return (
    <Pressable onPress={onPress} style={s.btn}>
      {icon ? <Icon name={icon} size={20} color="#fff" strokeWidth={2} /> : null}
      <Text style={s.txt}>{label}</Text>
    </Pressable>);
}
const s = StyleSheet.create({
  btn: { height: 56, borderRadius: radius.button, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button },
  txt: { fontFamily: fontFamilyForWeight(700), fontSize: 16, color: '#fff' },
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- primitives`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Card.tsx src/components/Pill.tsx src/components/StatusBadge.tsx src/components/Avatar.tsx src/components/PrimaryButton.tsx __tests__/primitives.test.tsx
git commit -m "feat: add Card, Pill, StatusBadge, Avatar, PrimaryButton primitives"
```

---

## Task 7: Mock data + types (`src/data.ts`)

**Files:**
- Create: `src/data.ts`, `__tests__/data.test.ts`

- [ ] **Step 1: Write the failing test**

`__tests__/data.test.ts`:

```ts
import { patient, nurse, family, vitals, medications, relevoTimeline, activityFeed, messages, careTeam, contacts } from '@/data';

test('patient fixture matches design', () => {
  expect(patient.fullName).toBe('Sra. Elena Rivas');
  expect(patient.age).toBe(78);
  expect(patient.status).toBe('Estable');
});
test('vitals match the 00:02 control', () => {
  expect(vitals.bp).toBe('128/82');
  expect(vitals.hr).toBe(72);
  expect(vitals.spo2).toBe(97);
});
test('medication progress is 4 of 5', () => {
  const administered = medications.filter(m => m.status === 'administered').length;
  expect(administered).toBe(4);
  expect(medications.length).toBe(5);
});
test('message thread has 4 bubbles', () => {
  expect(messages.length).toBe(4);
  expect(messages[0].fromSelf).toBe(true);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- data`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/data.ts`**

Define types then fixtures. Pull exact strings/numbers from the canvas:
- `patient` from source lines 106–119, 455 (name "Sra. Elena Rivas", 78, "Habitación principal", status "Estable", conditions ["Hipertensión","Movilidad reducida"], allergy "Penicilina", "Hipotiroidismo").
- `nurse` Carmen Morales (initials "CM"), `family` Lucía Rivas ("L").
- `vitals` lines 184–207 (PA 128/82 mmHg Normal, FC 72 lpm, T 36.7 °C, SpO₂ 97 %), note line 218.
- `medications` lines 252–271: Amlodipino 5mg 08:00 administered; Atorvastatina 20mg 20:00 administered; Losartán 50mg 23:30 administered("hace 14 min"); (a 4th administered to total 4 — use the morning dose implied by "4 de 5"; model the 4 done + Levotiroxina 50mcg 06:00 pending). Keep `progress = { done: 4, total: 5 }`.
- `relevoTimeline` lines 295–310: 4 entries incl. amber "Anomalía leve" 01:15 + recommendation line 315.
- `activityFeed` lines 395–434: vitals 00:02 (chips PA 128/82, 72 lpm, 36.7°, 97%), anomaly 01:15, med 23:30, settle 22:40.
- `messages` lines 520–536: 4 bubbles (self 23:38 "Leído", nurse 23:40, nurse 23:41, self 23:43).
- `careTeam` lines 461–463 (Carmen/Noche, Rosa RG/Día, Dr. Méndez DM/Cardio).
- `contacts` lines 477–486 (Dr. Méndez, Lucía Rivas "Hija · contacto principal").

```ts
export type VitalStatus = 'Normal';
export interface Vitals { bp: string; hr: number; tempC: number; spo2: number; takenAt: string; note: string; }
export interface Medication { name: string; dose: string; reason: string; time: string; status: 'administered' | 'pending'; sub: string; }
export interface TimelineEntry { title: string; time: string; body: string; tone: 'normal' | 'anomaly'; }
export interface FeedEntry { who: string; initials: string; action: string; time: string; tone: 'normal' | 'anomaly'; chips?: string[]; body?: string; }
export interface Message { body: string; time: string; fromSelf: boolean; meta?: string; }
export interface Member { name: string; initials: string; role: string; bg: string; fg: string; }

export const patient = {
  fullName: 'Sra. Elena Rivas', shortName: 'Elena', age: 78, room: 'Habitación principal',
  status: 'Estable' as const,
  conditions: ['Hipertensión', 'Movilidad reducida'],
  conditionsFull: ['Hipertensión', 'Hipotiroidismo', 'Movilidad reducida'],
  allergy: 'Penicilina',
};
export const nurse = { name: 'Carmen Morales', short: 'Carmen', initials: 'CM', shift: 'Turno nocturno · 22:00 – 06:00' };
export const family = { name: 'Lucía Rivas', short: 'Lucía', initials: 'L' };

export const vitals: Vitals = { bp: '128/82', hr: 72, tempC: 36.7, spo2: 97, takenAt: '00:02', note: 'Durmió tranquila las últimas dos horas. Sin molestias ni dolor. Piel hidratada.' };

export const medsProgress = { done: 4, total: 5 };
export const medications: Medication[] = [
  { name: 'Amlodipino', dose: '5 mg', reason: 'Presión arterial', time: '08:00', status: 'administered', sub: 'Administrada' },
  { name: 'Atorvastatina', dose: '20 mg', reason: 'Colesterol', time: '20:00', status: 'administered', sub: 'Administrada' },
  { name: 'Losartán', dose: '50 mg', reason: 'Presión arterial', time: '23:30', status: 'administered', sub: 'hace 14 min' },
  { name: 'Paracetamol', dose: '1 g', reason: 'Dolor leve', time: '14:00', status: 'administered', sub: 'Administrada' },
  { name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides · en ayunas', time: '06:00', status: 'pending', sub: 'Próxima' },
];

export const relevoTimeline: TimelineEntry[] = [
  { title: 'Medicación administrada', time: '23:30', body: 'Losartán 50 mg · sin reacción', tone: 'normal' },
  { title: 'Signos vitales', time: '00:02', body: 'PA 128/82 · FC 72 · 36.7° · SpO₂ 97% — todo normal', tone: 'normal' },
  { title: 'Anomalía leve', time: '01:15', body: 'Tos seca ocasional, sin fiebre. Se mantiene en observación.', tone: 'anomaly' },
  { title: 'Cambio de posición', time: '03:00', body: 'Descansó cómoda el resto de la noche', tone: 'normal' },
];
export const recommendation = 'Vigilar la tos y ofrecer líquidos tibios. Avisar al médico si aparece fiebre.';

export const activityFeed: FeedEntry[] = [
  { who: 'Carmen', initials: 'CM', action: 'registró signos vitales', time: '00:02', tone: 'normal', chips: ['PA 128/82', '72 lpm', '36.7°', '97%'] },
  { who: 'Carmen', initials: 'CM', action: 'notó algo a observar', time: '01:15', tone: 'anomaly', body: 'Tos seca ocasional, sin fiebre. La mantengo vigilada y con líquidos tibios. Nada de qué preocuparse por ahora.' },
  { who: 'Carmen', initials: 'CM', action: 'administró la medicación', time: '23:30', tone: 'normal', body: 'Losartán 50 mg · tomada sin problema 💊' },
  { who: 'Carmen', initials: 'CM', action: 'acomodó a Elena para dormir', time: '22:40', tone: 'normal', body: 'Cómoda y tranquila. Cena ligera completa.' },
];

export const messages: Message[] = [
  { body: 'Hola Carmen, ¿cómo va la noche? ¿Logró dormir mamá?', time: '23:38 · Leído', fromSelf: true },
  { body: 'Hola Lucía 🌙 Todo tranquilo. Está descansando muy bien, signos vitales normales.', time: '23:40', fromSelf: false },
  { body: 'Tuvo algo de tos seca pero sin fiebre. La estoy vigilando y le di líquidos tibios.', time: '23:41', fromSelf: false },
  { body: 'Gracias por cuidarla tan bien 🙏 Me deja mucho más tranquila.', time: '23:43', fromSelf: true },
];

export const careTeam: Member[] = [
  { name: 'Carmen', initials: 'CM', role: 'Noche', bg: '#DCEAE3', fg: '#3C6353' },
  { name: 'Rosa', initials: 'RG', role: 'Día', bg: '#F3EADF', fg: '#A56F42' },
  { name: 'Dr. Méndez', initials: 'DM', role: 'Cardio', bg: '#E4E9F0', fg: '#5E739B' },
];
export const contacts = [
  { name: 'Dr. Méndez', sub: 'Cardiología', initials: 'DM', bg: '#E4E9F0', fg: '#5E739B' },
  { name: 'Lucía Rivas', sub: 'Hija · contacto principal', initials: 'L', bg: '#DCEAE3', fg: '#3C6353' },
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- data`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data.ts __tests__/data.test.ts
git commit -m "feat: add typed mock data fixtures from canvas"
```

---

## Task 8: Tab layouts + custom tab bar icons

**Files:**
- Create: `app/nurse/_layout.tsx`, `app/nurse/(tabs)/_layout.tsx`, `app/family/_layout.tsx`, `app/family/(tabs)/_layout.tsx`, `src/components/TabBarIcon.tsx`
- Test: `__tests__/tabbar-icon.test.tsx`

Nurse tabs: Inicio(`home`)·Signos(`pulse`)·Relevo(`clipboard`)·Perfil(`user`). Family tabs: Inicio(`home`)·Actividad(`pulse`)·Mensajes(`message`)·Perfil(`user`). Active `#5C8A77`, inactive `#A9B4AD`, label 10px (700 active / 600 inactive), bar height 80, white, top border `#EEF3EF`.

- [ ] **Step 1: Write the failing test**

`__tests__/tabbar-icon.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { TabBarIcon } from '@/components/TabBarIcon';
test('renders focused color', () => {
  expect(() => render(<TabBarIcon name="home" focused />)).not.toThrow();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tabbar-icon`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement icon + layouts**

`TabBarIcon.tsx`:

```tsx
import { Icon } from './Icon';
import { colors } from '@/theme';
export function TabBarIcon({ name, focused }: { name: React.ComponentProps<typeof Icon>['name']; focused: boolean }) {
  return <Icon name={name} size={23} color={focused ? colors.primary : colors.muted3} strokeWidth={1.9} />;
}
```

`app/nurse/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/TabBarIcon';
import { colors, fontFamilyForWeight } from '@/theme';

export default function NurseTabs() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted3,
      tabBarStyle: { height: 80, backgroundColor: colors.white, borderTopColor: colors.cardBorder, paddingTop: 8 },
      tabBarLabelStyle: { fontFamily: fontFamilyForWeight(600), fontSize: 10 },
    }}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="signos" options={{ title: 'Signos', tabBarIcon: ({ focused }) => <TabBarIcon name="pulse" focused={focused} /> }} />
      <Tabs.Screen name="relevo" options={{ title: 'Relevo', tabBarIcon: ({ focused }) => <TabBarIcon name="clipboard" focused={focused} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} /> }} />
    </Tabs>
  );
}
```

`app/nurse/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function NurseStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="medicacion" options={{ presentation: 'card' }} />
    </Stack>
  );
}
```

`app/family/(tabs)/_layout.tsx` — same as nurse tabs but screens `inicio`(home), `actividad`(pulse), `mensajes`(message), `perfil`(user).

`app/family/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function FamilyStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tabbar-icon`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/nurse app/family src/components/TabBarIcon.tsx __tests__/tabbar-icon.test.tsx
git commit -m "feat: add nurse and family tab/stack layouts"
```

---

## Task 9: Welcome screen (00) + routing

**Files:**
- Modify: `app/index.tsx`
- Test: `__tests__/welcome.test.tsx`

Source: lines 27–64. Green gradient header (`gradWelcome`), Vela wordmark (serif 46), tagline; two role rows ("Soy enfermera/o" → `/nurse/(tabs)/inicio`, "Soy familiar" → `/family/(tabs)/inicio`); "Iniciar sesión" footer.

- [ ] **Step 1: Write the failing test**

`__tests__/welcome.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Welcome from '../app/index';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

test('routes to nurse on nurse role tap', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Soy enfermera/o'));
  expect(push).toHaveBeenCalledWith('/nurse/(tabs)/inicio');
});
test('routes to family on family role tap', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Soy familiar'));
  expect(push).toHaveBeenCalledWith('/family/(tabs)/inicio');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- welcome`
Expected: FAIL — current `index.tsx` has no role rows.

- [ ] **Step 3: Implement Welcome**

Build per source lines 27–64 using `PhoneFrame`, `StatusBar tint="light"`, `LinearGradient` header, `Icon` (`drop` in header tile; `pulse`/`heart` in role tiles; `chevronRight`), serif wordmark. Role rows are `Pressable` calling `router.push(...)`. Use `colors`, `fontFamilyForWeight`, exact paddings from source. Header tint light because gradient is dark. (Full composition; match colors/sizes from lines 27–64.)

Key wiring:

```tsx
import { useRouter } from 'expo-router';
// ...
const router = useRouter();
// nurse row:
<Pressable onPress={() => router.push('/nurse/(tabs)/inicio')}> ... <Text>Soy enfermera/o</Text> ... </Pressable>
// family row:
<Pressable onPress={() => router.push('/family/(tabs)/inicio')}> ... <Text>Soy familiar</Text> ... </Pressable>
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- welcome`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx __tests__/welcome.test.tsx
git commit -m "feat: add Welcome role-picker screen with routing"
```

---

## Task 10: Nurse screens — Inicio (01), Signos (02), Medicación (03), Relevo (04), Perfil

**Files:**
- Modify: `app/nurse/(tabs)/inicio.tsx`, `signos.tsx`, `relevo.tsx`, `perfil.tsx`; `app/nurse/medicacion.tsx`
- Test: `__tests__/nurse-screens.test.tsx`

Each screen composes primitives + `data.ts`. Match source line ranges exactly:
- **Inicio (01)** lines 74–159: topbar (Vela logo + CM avatar), serif greeting "Buenas noches, Carmen", patient `Card` (StatusBadge "Estable", condition Pills), "Próximas tareas" list (Medicación 23:30, Signos vitales 00:00), `PrimaryButton icon="plus" label="Registrar signos vitales"`. Wire: CTA + Medicación task → `router.push('/nurse/medicacion')`; the Signos vitals CTA navigates to the `signos` tab via `router.push('/nurse/(tabs)/signos')`.
- **Signos (02)** lines 162–228: header row with `chevronLeft` (calls `router.back()` when reached as push; in tab context it still renders but is decorative — keep it but no-op acceptable in M1), 2×2 vitals grid (`Card`s, value 800/26, StatusBadge "Normal"), anomaly toggle row (static switch off), note `Card`, `PrimaryButton icon="check" label="Guardar registro"`.
- **Medicación (03)** lines 231–274: header w/ back arrow → `router.back()`; "Dosis de hoy 4 de 5" progress bar (80%); med rows from `medications` (administered = green check circle; the highlighted Losartán row uses mint bg `#EAF3EE` + border `#CFE6DA`; pending = dashed border + empty ring + "Próxima" amber); footer bell note line 272.
- **Relevo (04)** lines 277–323: title block, vertical timeline (line `#E2EAE5`; dots green `#5C8A77` normal / `#D6A547` anomaly; anomaly entry rendered as amber card lines 304–306), recommendation `Card` (bulb icon), `PrimaryButton label="Entregar turno al equipo de día"` → confirm then `router.replace('/nurse/(tabs)/inicio')`.
- **Perfil (nurse, minimal)** — no canvas source. Compose with primitives: `Avatar initials="CM" size=60`, name "Carmen Morales", "Enfermera · turno de noche", a `Card` "Turno" 22:00–06:00, a `Card` "Paciente asignada" (Elena, StatusBadge), and a row "Cerrar sesión" (static in M1). Match the family-Perfil visual language (Task 11).

- [ ] **Step 1: Write the failing test**

`__tests__/nurse-screens.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Inicio from '../app/nurse/(tabs)/inicio';
import Medicacion from '../app/nurse/medicacion';

jest.mock('expo-router', () => ({ useRouter: jest.fn(), Stack: { Screen: () => null } }));

test('nurse inicio shows greeting and patient', () => {
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn() });
  render(<Inicio />);
  expect(screen.getByText('Buenas noches, Carmen')).toBeTruthy();
  expect(screen.getByText('Sra. Elena Rivas')).toBeTruthy();
});
test('inicio CTA pushes medicacion from the med task', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push, back: jest.fn(), replace: jest.fn() });
  render(<Inicio />);
  fireEvent.press(screen.getByText('Medicación'));
  expect(push).toHaveBeenCalledWith('/nurse/medicacion');
});
test('medicacion shows 4 de 5 progress', () => {
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn() });
  render(<Medicacion />);
  expect(screen.getByText('4 de 5')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- nurse-screens`
Expected: FAIL — screens are still default/empty.

- [ ] **Step 3: Implement the five nurse screens**

Build each per its cited source lines using primitives + `data.ts`, applying the CSS→RN rules. Wrap each in `<Screen time=... tint="dark" bg={colors.appBg}>`. Status-bar times: Inicio `23:14`, Signos `00:02`, Medicación `23:44`, Relevo `05:48`. Wire navigation exactly as listed above (`router.push`/`back`/`replace`). For scrollable content use `ScrollView` inside the `Screen` body.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- nurse-screens`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/nurse __tests__/nurse-screens.test.tsx
git commit -m "feat: build nurse screens (inicio, signos, medicacion, relevo, perfil)"
```

---

## Task 11: Family screens — Estado (05), Actividad (06), Mensajes (07), Perfil (08)

**Files:**
- Modify: `app/family/(tabs)/inicio.tsx`, `actividad.tsx`, `mensajes.tsx`, `perfil.tsx`
- Test: `__tests__/family-screens.test.tsx`

Match source line ranges:
- **Estado (05)** lines 332–377: header ("Hola, Lucía" + serif "¿Cómo está mamá?" + `Avatar "L"`), reassurance hero (`LinearGradient gradFamilyHero`, "EN CASA · ATENDIDA AHORA", serif 32 "Elena está estable y descansando", nurse chip "Carmen está con ella"), vitals-at-a-glance 2×2 grid from `vitals` (labels Presión/Pulso/Temperatura/Saturación).
- **Actividad (06)** lines 380–437: title "Actividad / Hoy · noche del 26 jun", feed from `activityFeed` (normal entries white card with CM avatar + chips/body; anomaly entry amber card `anomalyBg`/`anomalyBorder` with `warningCircle`).
- **Mensajes (07)** lines 498–543: chat header (`chevronLeft` → `router.back()`, CM avatar, "Carmen Morales", "En turno ahora"), message list from `messages` (self = green right-aligned bubble radius `18 18 6 18`; nurse = white left bubble `18 18 18 6`), composer row (input placeholder + green `send` button). Composer is static in M1 (no send).
- **Perfil (08)** lines 439–496: patient header (`Avatar "E" size=60`, "Elena Rivas", "78 años · En casa", StatusBadge), "Equipo de cuidado" `Card` (3 members from `careTeam`), "Condiciones" `Card` (Pills incl. amber allergy "Alergia · Penicilina"), "Contactos de emergencia" `Card` (from `contacts`, phone buttons → `Linking.openURL('tel:...')`).

- [ ] **Step 1: Write the failing test**

`__tests__/family-screens.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import Estado from '../app/family/(tabs)/inicio';
import Perfil from '../app/family/(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));

test('family estado shows reassurance headline and a vital', () => {
  render(<Estado />);
  expect(screen.getByText('Elena está estable y descansando')).toBeTruthy();
  expect(screen.getByText('128/82')).toBeTruthy();
});
test('family perfil lists care team and allergy', () => {
  render(<Perfil />);
  expect(screen.getByText('Equipo de cuidado')).toBeTruthy();
  expect(screen.getByText('Alergia · Penicilina')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- family-screens`
Expected: FAIL — screens empty.

- [ ] **Step 3: Implement the four family screens**

Build each per cited lines using primitives + `data.ts`. Wrap in `<Screen>` with times: Estado `23:42`, Actividad `23:43`, Mensajes `23:44`, Perfil `23:46`. Mensajes body bg `colors.chatBg`. Use `ScrollView` for feed/messages.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- family-screens`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/family __tests__/family-screens.test.tsx
git commit -m "feat: build family screens (estado, actividad, mensajes, perfil)"
```

---

## Task 12: End-to-end smoke + README + final verification

**Files:**
- Create: `README.md`
- Test: `__tests__/smoke.test.tsx`

- [ ] **Step 1: Write a render-all smoke test**

`__tests__/smoke.test.tsx` imports every screen component and asserts each renders without throwing (guards against broken imports/styles). Mock `expo-router` `useRouter`/`Stack`/`Tabs`/`Link` as in earlier tasks.

```tsx
import { render } from '@testing-library/react-native';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }), Stack: { Screen: () => null }, Tabs: Object.assign(() => null, { Screen: () => null }), Link: () => null }));
import Welcome from '../app/index';
import NInicio from '../app/nurse/(tabs)/inicio';
import NSignos from '../app/nurse/(tabs)/signos';
import NRelevo from '../app/nurse/(tabs)/relevo';
import NPerfil from '../app/nurse/(tabs)/perfil';
import NMed from '../app/nurse/medicacion';
import FInicio from '../app/family/(tabs)/inicio';
import FAct from '../app/family/(tabs)/actividad';
import FMsg from '../app/family/(tabs)/mensajes';
import FPerfil from '../app/family/(tabs)/perfil';

test.each([
  ['Welcome', Welcome], ['NInicio', NInicio], ['NSignos', NSignos], ['NRelevo', NRelevo],
  ['NPerfil', NPerfil], ['NMed', NMed], ['FInicio', FInicio], ['FAct', FAct], ['FMsg', FMsg], ['FPerfil', FPerfil],
])('%s renders', (_n, C) => { expect(() => render(<C />)).not.toThrow(); });
```

- [ ] **Step 2: Run full suite**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 3: Manual web verification**

```bash
npx expo start --web
```
Walk the flow: Welcome → "Soy enfermera/o" → nurse tabs (switch all 4) → Inicio "Medicación" task → Medicación (back) → back to Welcome → "Soy familiar" → family tabs (switch all 4). Confirm fonts render and colors match. Stop the server.

- [ ] **Step 4: Write `README.md`**

Document: what Vela is, M1 status, `npm start` / `npm run web` / `npm test`, how to open in Expo Go, link to the spec and this plan, and the roadmap (M2 Supabase/auth next).

- [ ] **Step 5: Commit**

```bash
git add README.md __tests__/smoke.test.tsx
git commit -m "test: add full-screen smoke suite; docs: add README"
```

---

## Self-Review (completed)

**Spec coverage (rev-2 §):** §2 stack → Task 1; §9 design system/tokens → Tasks 2,4,5,6; §5 navigation (M1 simplified variant, noted in Architecture) → Tasks 8,9; all 9 screens (§1/§6 static portions) → Tasks 9,10,11; nurse-Perfil gap → Task 10. Out of M1 scope by design (deferred, called out): §3 data model, §4 auth, §6 entry forms/realtime, §7 compliance, §8 push, §10 M2–M5, §11 release. M1 produces a runnable, testable app on its own. ✓

**Placeholder scan:** No "TBD"/"add error handling"/"write tests for the above". Screen tasks cite exact source line ranges + show navigation wiring code; reusable code is given in full. Design-source reference is a precise committed file, not a placeholder. ✓

**Type consistency:** `fontFamilyForWeight`, `colors.*`, `shadow.phone/card/button`, `Icon` `name` union, `Vitals/Medication/TimelineEntry/FeedEntry/Message/Member` types, and fixture names (`patient/nurse/family/vitals/medications/medsProgress/relevoTimeline/recommendation/activityFeed/messages/careTeam/contacts`) are used consistently across tasks. Routes (`/nurse/(tabs)/inicio`, `/family/(tabs)/inicio`, `/nurse/medicacion`) match the layouts in Task 8. ✓
