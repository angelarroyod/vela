import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ Stack: () => null }));

import RootLayout from '../app/_layout';

test('root layout renders without crashing once fonts loaded', () => {
  // useFonts is mocked to [true] in jest.setup.js
  expect(() => render(<RootLayout />)).not.toThrow();
});
