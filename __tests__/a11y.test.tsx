import { render, screen } from '@testing-library/react-native';
import Perfil from '../app/(app)/family/(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('family perfil call buttons are labelled', () => {
  render(<Perfil />);
  expect(screen.getAllByLabelText(/^Llamar a /).length).toBeGreaterThan(0);
});
