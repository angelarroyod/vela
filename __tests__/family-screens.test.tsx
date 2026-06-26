import { render, screen } from '@testing-library/react-native';
import Estado from '../app/family/(tabs)/inicio';
import Actividad from '../app/family/(tabs)/actividad';
import Mensajes from '../app/family/(tabs)/mensajes';
import Perfil from '../app/family/(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));

test('family estado shows reassurance headline and a vital', () => {
  render(<Estado />);
  expect(screen.getByText('Elena está estable y descansando')).toBeTruthy();
  expect(screen.getByText('128/82')).toBeTruthy();
});

test('family actividad shows a feed action', () => {
  render(<Actividad />);
  expect(screen.getByText('registró signos vitales')).toBeTruthy();
});

test('family mensajes shows a message and composer placeholder', () => {
  render(<Mensajes />);
  expect(screen.getByText('Carmen Morales')).toBeTruthy();
  expect(screen.getByText('Escribe un mensaje…')).toBeTruthy();
});

test('family perfil lists care team and allergy', () => {
  render(<Perfil />);
  expect(screen.getByText('Equipo de cuidado')).toBeTruthy();
  expect(screen.getByText('Alergia · Penicilina')).toBeTruthy();
});
