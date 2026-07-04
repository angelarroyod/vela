import { render, screen } from '@testing-library/react-native';
import Legal from '../app/(app)/legal';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('legal screen shows privacy + disclaimer sections', () => {
  render(<Legal />);
  expect(screen.getByText('Privacidad')).toBeTruthy();
  expect(screen.getByText(/no es un dispositivo médico/i)).toBeTruthy();
});
