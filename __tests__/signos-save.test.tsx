import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Signos from '../app/(app)/nurse/(tabs)/signos';

const mockInsert = jest.fn((_row: Record<string, unknown>) => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1', role: 'nurse' } }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('saving inserts a vitals row for the active patient', async () => {
  render(<Signos />);
  fireEvent.changeText(screen.getByPlaceholderText('120/80'), '128/82');
  fireEvent.press(screen.getByText('Guardar registro'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  const arg = mockInsert.mock.calls[0][0];
  expect(arg.patient_id).toBe('p1');
  expect(arg.bp_sys).toBe(128);
  expect(arg.bp_dia).toBe(82);
});
