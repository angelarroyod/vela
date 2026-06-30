import { render, screen, fireEvent } from '@testing-library/react-native';
import Settings from '../app/(app)/settings/index';

const mockSignOut = jest.fn();
jest.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ signOut: mockSignOut, session: { user: { email: 'a@b.com' } } }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), back: jest.fn() }) }));

test('sign out is available and fires', () => {
  render(<Settings />);
  fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(mockSignOut).toHaveBeenCalled();
});

test('shows the destructive delete-account action', () => {
  render(<Settings />);
  expect(screen.getByText('Eliminar cuenta')).toBeTruthy();
});

test('shows the signed-in email', () => {
  render(<Settings />);
  expect(screen.getByText('a@b.com')).toBeTruthy();
});
