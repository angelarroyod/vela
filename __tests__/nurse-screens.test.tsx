import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Inicio from '../app/(app)/nurse/(tabs)/inicio';
import Medicacion from '../app/(app)/nurse/medicacion';
import Signos from '../app/(app)/nurse/(tabs)/signos';
import Relevo from '../app/(app)/nurse/(tabs)/relevo';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'nurse1' } } }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1', role: 'nurse' } }) }));
jest.mock('@/features/care/hooks', () => ({
  useMedications: () => [
    { id: 'a', name: 'Amlodipino', dose: '5 mg', reason: 'PA', time: '08:00', status: 'administered', sub: 'Administrada' },
    { id: 'b', name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides', time: '06:00', status: 'pending', sub: 'Próxima' },
  ],
  useTimeline: () => [{ title: 'Anomalía leve', time: '01:15', body: 'Tos seca', tone: 'anomaly' }],
}));

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

test('medicacion shows progress derived from live meds', () => {
  render(<Medicacion />);
  expect(screen.getByText('1 de 2')).toBeTruthy();
});

test('signos renders the vitals entry form', () => {
  render(<Signos />);
  expect(screen.getByText('Saturación O₂')).toBeTruthy();
  expect(screen.getByPlaceholderText('120/80')).toBeTruthy();
});

test('relevo shows the anomaly entry', () => {
  render(<Relevo />);
  expect(screen.getByText('Anomalía leve')).toBeTruthy();
});
