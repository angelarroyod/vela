import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
  Link: () => null,
}));

import Welcome from '../app/index';
import NInicio from '../app/nurse/(tabs)/inicio';
import NSignos from '../app/nurse/(tabs)/signos';
import NRelevo from '../app/nurse/(tabs)/relevo';
import NPerfil from '../app/nurse/(tabs)/perfil';
import NMed from '../app/nurse/medicacion';
import FInicio from '../app/family/(tabs)/inicio';
import FAct from '../app/family/(tabs)/actividad';
import FMsg from '../app/family/(tabs)/mensajes';
import FPerfil from '../app/family/(tabs)/perfil';

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
