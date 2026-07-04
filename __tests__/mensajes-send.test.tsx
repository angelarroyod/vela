import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Mensajes from '../app/(app)/family/(tabs)/mensajes';

const mockInsert = jest.fn((_row: Record<string, unknown>) => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert: mockInsert }) } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({ useMessages: () => [] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('sending inserts a message', async () => {
  render(<Mensajes />);
  fireEvent.changeText(screen.getByPlaceholderText('Escribe un mensaje…'), 'hola');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() => expect(mockInsert).toHaveBeenCalledWith({ patient_id: 'p1', sender_id: 'me', body: 'hola' }));
});
