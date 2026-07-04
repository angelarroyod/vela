import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Relevo from '../app/(app)/nurse/(tabs)/relevo';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useTimeline: () => [{ title: 'Signos vitales', time: '00:02', body: 'todo normal', tone: 'normal' }] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

test('handing off inserts a shift_handoff', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, btns) => (btns as { onPress?: () => void }[])[1].onPress!());
  render(<Relevo />);
  fireEvent.press(screen.getByText('Entregar turno al equipo de día'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
});
