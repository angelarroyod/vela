import { render, screen } from '@testing-library/react-native';
import Actividad from '../app/(app)/family/(tabs)/actividad';

jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
jest.mock('@/features/care/hooks', () => ({
  useCareEvents: () => [{ who: 'Carmen', initials: 'CM', action: 'registró signos vitales', time: '00:02', tone: 'normal' }],
  useVitals: () => [{ bp: '128/82', hr: 72, tempC: 36.7, spo2: 97, takenAt: '00:02', note: '' }],
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('actividad renders live feed entries', () => {
  render(<Actividad />);
  expect(screen.getByText('registró signos vitales')).toBeTruthy();
});
