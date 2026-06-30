import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Welcome from '../app/(auth)/welcome';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

test('routes to signup on Crear cuenta', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Crear cuenta'));
  expect(push).toHaveBeenCalledWith('/(auth)/signup');
});

test('routes to login on Iniciar sesión', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Iniciar sesión'));
  expect(push).toHaveBeenCalledWith('/(auth)/login');
});
