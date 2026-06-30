import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  // Signed-in users belong in the app; onboarding/role routing decides the final screen.
  if (session) return <Redirect href="/(app)/nurse/inicio" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
