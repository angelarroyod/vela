import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/useAuth';

jest.mock('@/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
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
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('out')).toBeTruthy(), { timeout: 5000 });
});
