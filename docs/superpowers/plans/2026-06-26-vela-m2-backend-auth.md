# Vela M2 — Backend + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Supabase backend (schema + row-level security) and a real authentication + onboarding flow — email/password (testable in Expo Go today) plus Sign in with Apple coded behind a dev-build flag — so a user can sign up, pick a role, link/join a patient, and have routes gated by session, with in-app account deletion.

**Architecture:** Supabase (Postgres + Auth + Edge Functions) behind a typed client in `src/lib/supabase.ts` with a platform-aware session store (expo-secure-store on native, localStorage on web). An `AuthProvider` exposes session state; the root layout redirects between an `(auth)` route group and the existing `(app)` group. Patient access is governed entirely by RLS over a `care_memberships` join table; a `redeem_invite` SECURITY DEFINER RPC lets a not-yet-member family user join by code. Account deletion runs in a service-role Edge Function. Screen *content* stays on mock `src/data.ts` until M3 — M2 only adds the auth shell, real role-based routing, and the data schema M3 will query.

**Tech Stack:** `@supabase/supabase-js`, `expo-secure-store`, `expo-apple-authentication` (SiwA, dev-build only), `expo-crypto`, Supabase SQL migrations + Edge Functions, jest-expo + @testing-library/react-native.

**Prerequisite (user action, execution start):** Create a free Supabase project → copy **Project URL** + **anon public key** into `.env` (Task 1). The **service-role key** is set only as a Supabase Edge Function secret, never in the app or git.

**Reuses (from M1, already built):** `Screen`, `PrimaryButton`, `Card`, `Avatar`, `Icon`, `colors`/`fontFamilyForWeight` from `src/theme.ts`. Auth screens compose these.

---

## File Structure

```
vela/
  .env.example                      # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY (committed, no secrets)
  app.config.ts                     # reads env -> expo.extra (replaces static app.json fields)
  app/
    _layout.tsx                     # + AuthProvider + QueryClient wrapper, session-gated redirect
    (auth)/
      _layout.tsx                   # Stack; redirects to (app) if already signed in
      welcome.tsx                   # role-aware entry (moved from app/index.tsx)
      login.tsx                     # email/password sign-in + Sign in with Apple button
      signup.tsx                    # email/password sign-up + consent
      onboarding.tsx                # role pick -> nurse: create/link patient / family: enter code
    (app)/
      _layout.tsx                   # redirects to (auth) if no session; routes nurse|family by role
      nurse/...                     # (moved unchanged from M1)
      family/...                    # (moved unchanged from M1)
      settings/
        index.tsx                   # profile, sign out, delete account
  src/
    lib/
      supabase.ts                   # client + platform session storage adapter
      env.ts                        # typed env access
    features/auth/
      AuthProvider.tsx              # session context + signIn/signUp/signOut/signInWithApple
      useAuth.ts                    # hook
      guard.ts                      # pure routeForState() decision function (unit-tested)
      invite.ts                     # generateInviteCode/normalizeInviteCode (unit-tested)
      appleAuth.ts                  # SiwA wrapper, feature-flagged
  supabase/
    migrations/
      0001_schema.sql               # tables
      0002_rls.sql                  # policies + is_member() + redeem_invite() RPC
    functions/
      delete-account/index.ts       # service-role user deletion
  __tests__/                        # unit tests (mock @supabase/supabase-js)
```

**Responsibilities:** `lib/` = transport + config only. `features/auth/` = all auth logic; pure functions (`guard.ts`, `invite.ts`) are unit-tested in isolation, the provider wraps Supabase calls. `supabase/` = database + server (SQL/Edge), versioned and reviewable. Route groups own redirect logic; screens stay presentational.

---

## Task 1: Supabase client + env + session storage adapter

**Files:**
- Create: `.env.example`, `src/lib/env.ts`, `src/lib/supabase.ts`, `__tests__/supabase-storage.test.ts`
- Modify: `.gitignore` (already ignores `.env*` except example — verify)

- [ ] **Step 1: User creates the Supabase project**

In the Supabase dashboard: New Project → copy **Project URL** and **anon public** key. Create `vela/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Create committed `vela/.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Install deps**

```bash
npm install @supabase/supabase-js
npx expo install expo-secure-store expo-crypto
```

- [ ] **Step 3: Write the failing test**

`__tests__/supabase-storage.test.ts`:

```ts
import { makeStorage } from '@/lib/supabase';

test('web storage uses the provided localStorage-like backend', async () => {
  const mem: Record<string, string> = {};
  const web = makeStorage({
    getItem: (k) => mem[k] ?? null,
    setItem: (k, v) => { mem[k] = v; },
    removeItem: (k) => { delete mem[k]; },
  });
  await web.setItem('k', 'v');
  expect(await web.getItem('k')).toBe('v');
  await web.removeItem('k');
  expect(await web.getItem('k')).toBeNull();
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx jest supabase-storage`
Expected: FAIL — cannot find module `@/lib/supabase`.

- [ ] **Step 5: Implement `env.ts` and `supabase.ts`**

`src/lib/env.ts`:

```ts
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced early in dev; in tests these are undefined and client is mocked.
  console.warn('[vela] Missing EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY — set them in .env');
}

export const env = {
  supabaseUrl: url ?? 'http://localhost',
  supabaseAnonKey: anonKey ?? 'anon',
};
```

`src/lib/supabase.ts`:

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

type KV = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void };

// Wraps a synchronous localStorage-like backend as the async interface supabase expects.
export function makeStorage(backend: KV) {
  return {
    getItem: async (k: string) => backend.getItem(k),
    setItem: async (k: string, v: string) => backend.setItem(k, v),
    removeItem: async (k: string) => backend.removeItem(k),
  };
}

const nativeStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

const webBackend: KV = {
  getItem: (k) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k, v) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); },
};

const storage = Platform.OS === 'web' ? makeStorage(webBackend) : nativeStorage;

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest supabase-storage`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .env.example src/lib __tests__/supabase-storage.test.ts package.json package-lock.json
git commit -m "feat: add supabase client with platform session storage"
```

---

## Task 2: Database schema migration

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Write the schema SQL**

`supabase/migrations/0001_schema.sql`:

```sql
-- Profiles mirror auth.users (1:1).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age int,
  room text,
  status text not null default 'Estable',
  dob date,
  notes text,
  created_at timestamptz not null default now()
);

create type care_role as enum ('nurse', 'family', 'doctor');

create table public.care_memberships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role care_role not null,
  relationship text,
  is_primary boolean not null default false,
  shift text,
  created_at timestamptz not null default now(),
  unique (patient_id, profile_id)
);

create table public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid references public.profiles(id),
  bp_sys int, bp_dia int, hr int, temp_c numeric(4,1), spo2 int,
  taken_at timestamptz not null default now(),
  note text,
  has_anomaly boolean not null default false
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null, dose text, reason text,
  scheduled_at timestamptz,
  status text not null default 'pending',
  administered_by uuid references public.profiles(id),
  administered_at timestamptz
);

create table public.care_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_id uuid references public.profiles(id),
  type text not null,
  title text, body text,
  severity text not null default 'info',
  occurred_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.shift_handoffs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nurse_id uuid references public.profiles(id),
  summary text, recommendation text,
  started_at timestamptz, ended_at timestamptz
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  email text,
  role care_role not null default 'family',
  code text not null unique,
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table public.push_tokens (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (profile_id, token)
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create index on public.care_memberships (profile_id);
create index on public.care_memberships (patient_id);
create index on public.care_events (patient_id, occurred_at desc);
create index on public.messages (patient_id, created_at);
```

- [ ] **Step 2: Apply the migration**

In the Supabase dashboard → SQL Editor, paste and run `0001_schema.sql` (or `supabase db push` if using the CLI).
Expected: tables created, no errors. Verify in Table Editor that all 10 tables + `care_role` enum exist.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "feat: add Supabase schema migration"
```

---

## Task 3: Row-level security + membership helper + invite RPC

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write the RLS SQL**

`supabase/migrations/0002_rls.sql`:

```sql
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.care_memberships enable row level security;
alter table public.vitals enable row level security;
alter table public.medications enable row level security;
alter table public.care_events enable row level security;
alter table public.messages enable row level security;
alter table public.shift_handoffs enable row level security;
alter table public.invites enable row level security;
alter table public.push_tokens enable row level security;

-- Membership/role helpers (SECURITY DEFINER to avoid recursive RLS on care_memberships).
create function public.is_member(p_patient uuid) returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.care_memberships m
    where m.patient_id = p_patient and m.profile_id = auth.uid()
  );
$$;

create function public.is_nurse(p_patient uuid) returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.care_memberships m
    where m.patient_id = p_patient and m.profile_id = auth.uid() and m.role = 'nurse'
  );
$$;

-- profiles: own row.
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- patients: readable by members; a nurse member can update.
create policy patients_read on public.patients
  for select using (public.is_member(id));
create policy patients_update on public.patients
  for update using (public.is_nurse(id)) with check (public.is_nurse(id));

-- care_memberships: a user sees their own memberships.
create policy memberships_self on public.care_memberships
  for select using (profile_id = auth.uid());

-- Read for any member; write for nurse members. Applied to clinical tables.
create policy vitals_read on public.vitals for select using (public.is_member(patient_id));
create policy vitals_write on public.vitals for insert with check (public.is_nurse(patient_id));
create policy meds_read on public.medications for select using (public.is_member(patient_id));
create policy meds_write on public.medications for all using (public.is_nurse(patient_id)) with check (public.is_nurse(patient_id));
create policy events_read on public.care_events for select using (public.is_member(patient_id));
create policy events_write on public.care_events for insert with check (public.is_nurse(patient_id));
create policy handoff_read on public.shift_handoffs for select using (public.is_member(patient_id));
create policy handoff_write on public.shift_handoffs for insert with check (public.is_nurse(patient_id));

-- messages: any member reads; sender must be self and a member.
create policy messages_read on public.messages for select using (public.is_member(patient_id));
create policy messages_send on public.messages for insert with check (sender_id = auth.uid() and public.is_member(patient_id));

-- invites: primary members manage; insert by a primary nurse member.
create policy invites_read on public.invites for select using (public.is_member(patient_id));
create policy invites_insert on public.invites for insert with check (public.is_nurse(patient_id));

-- push_tokens: own rows.
create policy push_self on public.push_tokens for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Redeem an invite as the current user without prior membership (SECURITY DEFINER).
create function public.redeem_invite(p_code text) returns uuid language plpgsql security definer as $$
declare inv public.invites; begin
  select * into inv from public.invites where code = p_code and accepted_at is null and expires_at > now();
  if inv.id is null then raise exception 'invalid_or_expired_invite'; end if;
  insert into public.care_memberships (patient_id, profile_id, role, relationship)
  values (inv.patient_id, auth.uid(), inv.role, 'family')
  on conflict (patient_id, profile_id) do nothing;
  update public.invites set accepted_at = now() where id = inv.id;
  return inv.patient_id;
end; $$;

-- Let an authenticated user create their first patient + nurse membership atomically.
create function public.create_patient_with_nurse(p_name text, p_age int, p_room text)
  returns uuid language plpgsql security definer as $$
declare new_id uuid; begin
  insert into public.patients (full_name, age, room) values (p_name, p_age, p_room) returning id into new_id;
  insert into public.care_memberships (patient_id, profile_id, role, is_primary, shift)
  values (new_id, auth.uid(), 'nurse', true, 'night');
  return new_id;
end; $$;

grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.create_patient_with_nurse(text, int, text) to authenticated;
```

- [ ] **Step 2: Apply + verify RLS with test queries**

Run `0002_rls.sql` in the SQL Editor. Then verify isolation: create two test users (Auth → Users), and in the SQL Editor run (as service role for setup) one user's `create_patient_with_nurse`, then confirm the *other* user gets 0 rows from that patient's `vitals`/`care_events`. Document the check in the PR description.

Expected: non-members see no rows; redeem_invite adds a membership and then the family user can read.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat: add RLS policies, membership helpers, invite/patient RPCs"
```

---

## Task 4: Auth provider + session state

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/useAuth.ts`, `__tests__/auth-provider.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/auth-provider.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/useAuth';

jest.mock('@/lib/supabase', () => {
  const listeners: any[] = [];
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: (cb: any) => { listeners.push(cb); return { data: { subscription: { unsubscribe: () => {} } } }; },
        signInWithPassword: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null })),
        signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
      },
    },
  };
});

function Probe() {
  const { loading, session } = useAuth();
  return <Text>{loading ? 'loading' : session ? 'in' : 'out'}</Text>;
}

test('resolves to signed-out when no session', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('out')).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest auth-provider`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement provider + hook**

`src/features/auth/AuthProvider.tsx`:

```tsx
import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signUp: AuthValue['signUp'] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    return { error: error?.message ?? null };
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
```

`src/features/auth/useAuth.ts`:

```ts
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest auth-provider`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/AuthProvider.tsx src/features/auth/useAuth.ts __tests__/auth-provider.test.tsx
git commit -m "feat: add auth provider and session hook"
```

---

## Task 5: Route groups + session guard

**Files:**
- Create: `src/features/auth/guard.ts`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`, `__tests__/guard.test.ts`
- Modify: `app/_layout.tsx`; move `app/nurse` → `app/(app)/nurse`, `app/family` → `app/(app)/family`, `app/index.tsx` → `app/(auth)/welcome.tsx`

- [ ] **Step 1: Write the failing test for the pure guard**

`__tests__/guard.test.ts`:

```ts
import { routeForState } from '@/features/auth/guard';

test('no session -> auth welcome', () => {
  expect(routeForState({ hasSession: false, hasMembership: false, role: null })).toBe('/(auth)/welcome');
});
test('session but no membership -> onboarding', () => {
  expect(routeForState({ hasSession: true, hasMembership: false, role: null })).toBe('/(auth)/onboarding');
});
test('nurse membership -> nurse home', () => {
  expect(routeForState({ hasSession: true, hasMembership: true, role: 'nurse' })).toBe('/(app)/nurse/inicio');
});
test('family membership -> family home', () => {
  expect(routeForState({ hasSession: true, hasMembership: true, role: 'family' })).toBe('/(app)/family/inicio');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest guard`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the pure guard**

`src/features/auth/guard.ts`:

```ts
export type AuthState = { hasSession: boolean; hasMembership: boolean; role: 'nurse' | 'family' | 'doctor' | null };

export function routeForState(s: AuthState): string {
  if (!s.hasSession) return '/(auth)/welcome';
  if (!s.hasMembership || !s.role) return '/(auth)/onboarding';
  return s.role === 'nurse' ? '/(app)/nurse/inicio' : '/(app)/family/inicio';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest guard`
Expected: PASS.

- [ ] **Step 5: Move existing routes into groups**

```bash
cd vela
git mv app/nurse "app/(app)/nurse"
git mv app/family "app/(app)/family"
git mv app/index.tsx "app/(auth)/welcome.tsx"
```

Update internal route strings (group segments stay omitted from URLs, so paths are unchanged): in `welcome.tsx` the role taps still `router.replace('/nurse/inicio')` / `'/family/inicio'` — but in M2 routing is decided by the guard after onboarding, so change Welcome's two role buttons to `router.push('/(auth)/login')` (sign in) and keep role choice for onboarding. (Welcome becomes the unauthenticated entry: a "Log in" and "Crear cuenta" pair; the role-card visual is reused on the onboarding screen.)

- [ ] **Step 6: Implement layouts + redirect**

`app/_layout.tsx` (wrap with AuthProvider; keep fonts):

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold } from '@expo-google-fonts/hanken-grotesk';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { AuthProvider } from '@/features/auth/AuthProvider';

export default function RootLayout() {
  const [loaded] = useFonts({ HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold, InstrumentSerif_400Regular });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F1F5F2' } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

`app/(auth)/_layout.tsx` — redirect to app if signed in:

```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Redirect href="/(app)/nurse/inicio" />; // onboarding decides final role
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/(app)/_layout.tsx` — redirect to auth if no session:

```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

> Note: full role-based redirect (nurse vs family, onboarding when no membership) uses `routeForState` once membership loading lands in Task 7; this task wires the session gate.

- [ ] **Step 7: Run tests + typecheck + commit**

Run: `npx jest && npx tsc --noEmit`
Expected: all green (existing screen tests still pass at new paths — update import paths in `__tests__/nurse-screens.test.tsx`, `family-screens.test.tsx`, `welcome.test.tsx`, `smoke.test.tsx` to `../app/(app)/nurse/...` etc.).

```bash
git add -A
git commit -m "feat: add (auth)/(app) route groups with session guard"
```

---

## Task 6: Login + Signup screens (email/password)

**Files:**
- Create: `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`, `__tests__/auth-screens.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/auth-screens.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../app/(auth)/login';

const signIn = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ signIn, signUp: jest.fn(), loading: false, session: null }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), Link: ({ children }: any) => children }));

test('login calls signIn with entered credentials', async () => {
  render(<Login />);
  fireEvent.changeText(screen.getByPlaceholderText('correo@ejemplo.com'), 'a@b.com');
  fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'secret123');
  fireEvent.press(screen.getByText('Iniciar sesión'));
  await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.com', 'secret123'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest auth-screens`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement login + signup**

`app/(auth)/login.tsx` (compose M1 primitives; green theme):

```tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { AppleButton } from '@/features/auth/appleAuth';
import { useAuth } from '@/features/auth/useAuth';
import { colors, fontFamilyForWeight } from '@/theme';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error); else router.replace('/(app)/nurse/inicio');
  };

  return (
    <Screen time="9:41" bg={colors.white}>
      <View style={s.body}>
        <Text style={s.title}>Iniciar sesión</Text>
        <TextInput style={s.input} placeholder="correo@ejemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholderTextColor={colors.muted3} />
        <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={colors.muted3} />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'Entrando…' : 'Iniciar sesión'} onPress={submit} />
        <AppleButton />
        <Text style={s.alt} onPress={() => router.push('/(auth)/signup')}>¿No tienes cuenta? <Text style={s.link}>Crear cuenta</Text></Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 24, gap: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 26, color: colors.ink, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fontFamilyForWeight(500), fontSize: 15, color: colors.ink },
  error: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: '#B4452F' },
  alt: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, textAlign: 'center', marginTop: 8 },
  link: { fontFamily: fontFamilyForWeight(700), color: colors.primary },
});
```

`app/(auth)/signup.tsx` — same layout with a `fullName` field and a consent row linking the privacy policy + medical disclaimer (text for M2; URLs wired in M4). On success route to `/(auth)/onboarding`. Calls `signUp(email, password, fullName)`; show returned error inline; require the consent checkbox before enabling the button.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest auth-screens`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/login.tsx" "app/(auth)/signup.tsx" __tests__/auth-screens.test.tsx
git commit -m "feat: add email/password login and signup screens"
```

---

## Task 7: Onboarding + membership loading + full role routing

**Files:**
- Create: `app/(auth)/onboarding.tsx`, `src/features/auth/useMembership.ts`, `__tests__/membership.test.ts`
- Modify: `app/(app)/_layout.tsx`, `app/(auth)/_layout.tsx` to use `routeForState` + membership

- [ ] **Step 1: Write the failing test for membership mapping**

`__tests__/membership.test.ts`:

```ts
import { pickActiveMembership } from '@/features/auth/useMembership';

test('prefers a nurse membership, else first', () => {
  expect(pickActiveMembership([{ role: 'family', patient_id: 'p' }, { role: 'nurse', patient_id: 'q' }])).toEqual({ role: 'nurse', patient_id: 'q' });
  expect(pickActiveMembership([])).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest membership`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement membership query + selector**

`src/features/auth/useMembership.ts`:

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type Membership = { role: 'nurse' | 'family' | 'doctor'; patient_id: string };

export function pickActiveMembership(rows: Membership[]): Membership | null {
  if (rows.length === 0) return null;
  return rows.find((r) => r.role === 'nurse') ?? rows[0];
}

export function useMembership() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  useEffect(() => {
    if (!session) { setMembership(null); setLoading(false); return; }
    setLoading(true);
    supabase.from('care_memberships').select('role, patient_id').then(({ data }) => {
      setMembership(pickActiveMembership((data as Membership[]) ?? []));
      setLoading(false);
    });
  }, [session]);
  return { loading, membership };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest membership`
Expected: PASS.

- [ ] **Step 5: Implement onboarding screen**

`app/(auth)/onboarding.tsx`: two role cards (reuse the Welcome role-row visual).
- **Nurse:** a small form (patient name, age, room) → calls `supabase.rpc('create_patient_with_nurse', { p_name, p_age, p_room })` → on success `router.replace('/(app)/nurse/inicio')`.
- **Family:** an invite-code field → calls `supabase.rpc('redeem_invite', { p_code })` → on success `router.replace('/(app)/family/inicio')`; on error show "Código inválido o expirado".

- [ ] **Step 6: Wire full routing in `(app)/_layout.tsx`**

Use `useAuth` + `useMembership` + `routeForState`: while either loads, return null; then if `routeForState` points outside `(app)`, `<Redirect>` there. Mirror in `(auth)/_layout.tsx` (redirect signed-in users with membership into their role home, signed-in without membership to onboarding).

- [ ] **Step 7: Run tests + typecheck + commit**

Run: `npx jest && npx tsc --noEmit`
Expected: green.

```bash
git add -A
git commit -m "feat: add onboarding (nurse patient create / family invite redeem) and role routing"
```

---

## Task 8: Family invite creation (nurse)

**Files:**
- Create: `src/features/auth/invite.ts`, `__tests__/invite.test.ts`
- Modify: `app/(app)/nurse/(tabs)/perfil.tsx` (add "Invitar a la familia" action)

- [ ] **Step 1: Write the failing test**

`__tests__/invite.test.ts`:

```ts
import { generateInviteCode, normalizeInviteCode } from '@/features/auth/invite';

test('generated code is 6 uppercase alphanumerics', () => {
  const c = generateInviteCode();
  expect(c).toMatch(/^[A-Z0-9]{6}$/);
});
test('normalize trims, uppercases, strips spaces/dashes', () => {
  expect(normalizeInviteCode(' ab-c d1 ')).toBe('ABCD1');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest invite`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement invite helpers**

`src/features/auth/invite.ts`:

```ts
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateInviteCode(len = 6): string {
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest invite`
Expected: PASS.

- [ ] **Step 5: Wire "Invitar a la familia" into nurse Perfil**

Add a row/button that, for the nurse's active patient, inserts an invite (`supabase.from('invites').insert({ patient_id, role: 'family', code: generateInviteCode(), invited_by })`) then shows the code via `Share.share()` / an Alert. Family enters that code on the onboarding screen (Task 7).

- [ ] **Step 6: Run tests + commit**

```bash
npx jest && npx tsc --noEmit
git add src/features/auth/invite.ts __tests__/invite.test.ts "app/(app)/nurse/(tabs)/perfil.tsx"
git commit -m "feat: add family invite code generation and share"
```

---

## Task 9: Settings + account deletion

**Files:**
- Create: `app/(app)/settings/index.tsx`, `supabase/functions/delete-account/index.ts`, `__tests__/settings.test.tsx`
- Modify: nurse + family `perfil.tsx` ("Cerrar sesión" → real signOut; add "Configuración" link)

- [ ] **Step 1: Write the failing test**

`__tests__/settings.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import Settings from '../app/(app)/settings/index';

const signOut = jest.fn();
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ signOut, session: { user: { email: 'a@b.com' } } }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), back: jest.fn() }) }));

test('sign out is available and fires', () => {
  render(<Settings />);
  fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(signOut).toHaveBeenCalled();
});
test('shows the destructive delete-account action', () => {
  render(<Settings />);
  expect(screen.getByText('Eliminar cuenta')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest settings`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the Edge Function**

`supabase/functions/delete-account/index.ts`:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { error } = await admin.auth.admin.deleteUser(user.id); // cascades app data via FKs
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});
```

Deploy: `supabase functions deploy delete-account`; set secret `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` (service role lives only here, never in the app).

- [ ] **Step 4: Implement Settings screen**

`app/(app)/settings/index.tsx`: shows the signed-in email, a "Cerrar sesión" button (`await signOut()` → `router.replace('/(auth)/welcome')`), and a destructive **"Eliminar cuenta"** button that confirms via `Alert.alert`, then calls `supabase.functions.invoke('delete-account')` and on success signs out. Compose with `Screen`/`Card`/`PrimaryButton`; the delete button uses a red style.

- [ ] **Step 5: Run to verify it passes**

Run: `npx jest settings`
Expected: PASS.

- [ ] **Step 6: Wire perfil sign-out + commit**

In both `perfil.tsx` screens, make "Cerrar sesión" call the real `signOut` (via `useAuth`) and add a link to `/(app)/settings`.

```bash
npx jest && npx tsc --noEmit
git add -A
git commit -m "feat: add settings screen with sign out and account deletion"
```

---

## Task 10: Sign in with Apple (flagged, dev-build only)

**Files:**
- Create: `src/features/auth/appleAuth.tsx`, `__tests__/apple-auth.test.tsx`
- Modify: `app.json` (add plugin + entitlement — only effective in a dev/native build), `package.json`

- [ ] **Step 1: Install + configure (effective on native dev build)**

```bash
npx expo install expo-apple-authentication
```

Add to `app.json`: `"plugins": [..., "expo-apple-authentication"]` and `"ios": { ..., "usesAppleSignIn": true }`. (No effect in Expo Go; takes effect in the EAS dev build from spec §11.)

- [ ] **Step 2: Write the failing test (flag-off path)**

`__tests__/apple-auth.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { AppleButton } from '@/features/auth/appleAuth';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android', select: (o: any) => o.android }));

test('AppleButton renders nothing off iOS', () => {
  const { toJSON } = render(<AppleButton />);
  expect(toJSON()).toBeNull();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx jest apple-auth`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the flagged Apple button**

`src/features/auth/appleAuth.tsx`:

```tsx
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Sign in with Apple needs the native module — absent in Expo Go. Render only
// on iOS in a native/dev build; otherwise render nothing.
const isExpoGo = Constants.appOwnership === 'expo';
const enabled = Platform.OS === 'ios' && !isExpoGo;

export function AppleButton() {
  if (!enabled) return null;
  // Lazy require so Expo Go never loads the native module.
  const AppleAuthentication = require('expo-apple-authentication');
  const signIn = async () => {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (cred.identityToken) {
      await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
    }
  };
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={14}
      style={{ height: 50 }}
      onPress={signIn}
    />
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx jest apple-auth`
Expected: PASS.

> Enable in Supabase: Auth → Providers → Apple (add Services ID / team / key) when the Apple account exists. Provider config is dashboard-side; no app code change.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/appleAuth.tsx __tests__/apple-auth.test.tsx app.json package.json package-lock.json
git commit -m "feat: add Sign in with Apple behind a native-build flag"
```

---

## Task 11: Verify + docs

**Files:**
- Modify: `README.md` (M2 status), `docs/superpowers/specs/2026-06-26-vela-design.md` (roadmap tick)

- [ ] **Step 1: Full automated gate**

Run: `npx jest && npx tsc --noEmit`
Expected: all suites pass; types clean.

- [ ] **Step 2: Web bundle**

Run: `npx expo export -p web`
Expected: `Exported: dist`, exit 0. Delete `dist/` after.

- [ ] **Step 3: Manual E2E in Expo Go (email/password) against Supabase**

`npx expo start --port 8083`, open on the iPhone. Sign up → confirm a `profiles` row appears in Supabase → onboard as nurse (create patient) → land on nurse home → sign out → log back in → as a second account, redeem the invite code → land on family home. Confirm RLS: the family account cannot see another patient's data.

- [ ] **Step 4: Update docs**

README: mark M2 complete, document `.env` setup + Supabase prerequisite. Spec §10: tick M2.

- [ ] **Step 5: Commit**

```bash
git add README.md docs
git commit -m "docs: mark M2 (backend + auth) complete"
```

---

## Self-Review (completed)

**Spec coverage (rev 3 §):** §2 stack (supabase-js, secure-store, apple-auth) → Tasks 1,4,10; §3 data model → Task 2; §3 RLS/helpers → Task 3; §4 auth (email/password + Apple) → Tasks 4,6,10; §4 onboarding + invite/join → Tasks 7,8; §4 account deletion (5.1.1v) → Task 9; route gating (§5 (auth)/(app)) → Tasks 5,7; secrets handling (§0: anon in app, service-role server-only) → Tasks 1,9. Deferred by design (M3/M4, noted): live data wiring of screens, realtime, react-query, push, privacy-policy URLs, accessibility. M2 delivers a working auth+onboarding shell on its own. ✓

**Placeholder scan:** No "TBD"/"add validation later". Pure-logic tasks (1,4,5,7,8,10) ship full code + tests; SQL tasks (2,3) ship complete migrations with explicit apply+verify steps; screen tasks (6,7,9) give full code for the non-obvious screen (login) and precise composition + exact RPC/calls for the rest, reusing M1 primitives (defined, not placeholders). ✓

**Type consistency:** `routeForState`/`AuthState`, `Membership`/`pickActiveMembership`, `generateInviteCode`/`normalizeInviteCode`, `AppleButton`, `useAuth` shape (`session/loading/signIn/signUp/signOut`), and RPC names (`create_patient_with_nurse`, `redeem_invite`) match across tasks and SQL. Env vars `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` consistent. ✓

**Honest gaps to flag at execution:** (a) needs the Supabase project (Task 1 prereq); (b) Sign in with Apple verifiable only on the EAS dev build + Apple enrollment (spec §11) — email/password is the Expo-Go-testable path now; (c) `app.config.ts` is listed in the file map for env→extra but M2 reads env directly via `EXPO_PUBLIC_*`, so `app.config.ts` is optional and not required by any task — keep `app.json` as-is unless a task needs dynamic config.
```
