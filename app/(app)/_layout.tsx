import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';

export default function AppLayout() {
  const { session, loading: authLoading } = useAuth();
  const { membership, loading: memLoading } = useMembership();
  if (authLoading || (session && memLoading)) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!membership) return <Redirect href="/(auth)/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
