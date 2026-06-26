import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Inicio from '../app/nurse/(tabs)/inicio';
import Medicacion from '../app/nurse/medicacion';
import Signos from '../app/nurse/(tabs)/signos';
import Relevo from '../app/nurse/(tabs)/relevo';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn() });
});

test('nurse inicio shows greeting and patient', () => {
  render(<Inicio />);
  expect(screen.getByText('Buenas noches, Carmen')).toBeTruthy();
  expect(screen.getByText('Sra. Elena Rivas')).toBeTruthy();
});

test('inicio pushes medicacion from the med task', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push, back: jest.fn(), replace: jest.fn() });
  render(<Inicio />);
  fireEvent.press(screen.getByText('Medicación'));
  expect(push).toHaveBeenCalledWith('/nurse/medicacion');
});

test('medicacion shows 4 de 5 progress', () => {
  render(<Medicacion />);
  expect(screen.getByText('4 de 5')).toBeTruthy();
});

test('signos shows the four vitals', () => {
  render(<Signos />);
  expect(screen.getByText('128/82')).toBeTruthy();
  expect(screen.getByText('Saturación O₂')).toBeTruthy();
});

test('relevo shows the anomaly entry', () => {
  render(<Relevo />);
  expect(screen.getByText('Anomalía leve')).toBeTruthy();
});
