import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={session ? '/(app)/nurse/inicio' : '/(auth)/welcome'} />;
}
