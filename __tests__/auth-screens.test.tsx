import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../app/(auth)/login';

const mockSignIn = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ signIn: mockSignIn, signUp: jest.fn(), loading: false, session: null }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/features/auth/appleAuth', () => ({ AppleButton: () => null }));

test('login calls signIn with entered credentials', async () => {
  render(<Login />);
  fireEvent.changeText(screen.getByPlaceholderText('correo@ejemplo.com'), 'a@b.com');
  fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'secret123');
  fireEvent.press(screen.getByText('Iniciar sesión'));
  await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('a@b.com', 'secret123'));
});
