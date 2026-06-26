import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Welcome from '../app/index';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

test('routes to nurse on nurse role tap', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Soy enfermera/o'));
  expect(push).toHaveBeenCalledWith('/nurse/inicio');
});

test('routes to family on family role tap', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<Welcome />);
  fireEvent.press(screen.getByText('Soy familiar'));
  expect(push).toHaveBeenCalledWith('/family/inicio');
});
