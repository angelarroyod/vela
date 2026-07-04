import { render, screen } from '@testing-library/react-native';
import Estado from '../app/(app)/family/(tabs)/inicio';
import Actividad from '../app/(app)/family/(tabs)/actividad';
import Mensajes from '../app/(app)/family/(tabs)/mensajes';
import Perfil from '../app/(app)/family/(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/care/hooks', () => ({
  useVitals: () => [],
  useCareEvents: () => [{ who: 'Carmen', initials: 'CM', action: 'registró signos vitales', time: '00:02', tone: 'normal' }],
  useMessages: () => [],
}));

test('family estado shows the reassurance headline', () => {
  render(<Estado />);
  expect(screen.getByText('Elena está estable y descansando')).toBeTruthy();
});

test('family actividad shows a feed action', () => {
  render(<Actividad />);
  expect(screen.getByText('registró signos vitales')).toBeTruthy();
});

test('family mensajes shows the nurse and composer', () => {
  render(<Mensajes />);
  expect(screen.getByText('Carmen Morales')).toBeTruthy();
  expect(screen.getByPlaceholderText('Escribe un mensaje…')).toBeTruthy();
});

test('family perfil lists care team and allergy', () => {
  render(<Perfil />);
  expect(screen.getByText('Equipo de cuidado')).toBeTruthy();
  expect(screen.getByText('Alergia · Penicilina')).toBeTruthy();
});
