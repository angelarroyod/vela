import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { routeForState } from '@/features/auth/guard';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { membership, loading: memLoading } = useMembership();
  if (authLoading || (session && memLoading)) return null;
  const route = routeForState({
    hasSession: !!session,
    hasMembership: !!membership,
    role: membership?.role ?? null,
  });
  return <Redirect href={route} />;
}
