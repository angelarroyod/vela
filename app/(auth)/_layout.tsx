import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { routeForState } from '@/features/auth/guard';

export default function AuthLayout() {
  const { session, loading: authLoading } = useAuth();
  const { membership, loading: memLoading } = useMembership();
  if (authLoading || (session && memLoading)) return null;
  // Signed-in users go to their role home (or onboarding if no membership yet).
  if (session) {
    return <Redirect href={routeForState({ hasSession: true, hasMembership: !!membership, role: membership?.role ?? null })} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
