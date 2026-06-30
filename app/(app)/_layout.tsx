import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
