const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced early in dev; in tests these are undefined and the client is mocked.
  console.warn('[vela] Missing EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY — set them in .env');
}

export const env = {
  supabaseUrl: url ?? 'http://localhost',
  supabaseAnonKey: anonKey ?? 'anon',
};
