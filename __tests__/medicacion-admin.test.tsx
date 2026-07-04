import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Medicacion from '../app/(app)/nurse/medicacion';

const mockUpdate = jest.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => (t === 'medications' ? { update: mockUpdate } : { insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useMedications: () => [{ id: 'm1', name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides', time: '06:00', status: 'pending', sub: 'Próxima' }] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('tapping a pending dose marks it administered', async () => {
  render(<Medicacion />);
  fireEvent.press(screen.getByText('Tiroides'));
  await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
});
