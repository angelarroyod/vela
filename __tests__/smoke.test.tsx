import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
  Link: () => null,
}));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ session: null, signOut: jest.fn() }) }));
jest.mock('@/features/auth/useMembership', () => ({ useMembership: () => ({ membership: null, loading: false }) }));

import Welcome from '../app/(auth)/welcome';
import NInicio from '../app/(app)/nurse/(tabs)/inicio';
import NSignos from '../app/(app)/nurse/(tabs)/signos';
import NRelevo from '../app/(app)/nurse/(tabs)/relevo';
import NPerfil from '../app/(app)/nurse/(tabs)/perfil';
import NMed from '../app/(app)/nurse/medicacion';
import FInicio from '../app/(app)/family/(tabs)/inicio';
import FAct from '../app/(app)/family/(tabs)/actividad';
import FMsg from '../app/(app)/family/(tabs)/mensajes';
import FPerfil from '../app/(app)/family/(tabs)/perfil';

test.each([
  ['Welcome', Welcome],
  ['NurseInicio', NInicio],
  ['NurseSignos', NSignos],
  ['NurseRelevo', NRelevo],
  ['NursePerfil', NPerfil],
  ['NurseMedicacion', NMed],
  ['FamilyEstado', FInicio],
  ['FamilyActividad', FAct],
  ['FamilyMensajes', FMsg],
  ['FamilyPerfil', FPerfil],
])('%s renders without throwing', (_name, C) => {
  expect(() => render(<C />)).not.toThrow();
});
