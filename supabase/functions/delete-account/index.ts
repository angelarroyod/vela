// Vela — account deletion (App Store Guideline 5.1.1(v)).
// Deploy: supabase functions deploy delete-account
// Secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... (service role never ships in the app)
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Deleting the auth user cascades app data via on-delete-cascade FKs.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return new Response(error.message, { status: 400 });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
