import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';

test('AppleButton renders nothing off iOS', () => {
  // Force a non-iOS platform before the module computes its enabled flag.
  Platform.OS = 'android';
  const { AppleButton } = require('@/features/auth/appleAuth');
  const { toJSON } = render(<AppleButton />);
  expect(toJSON()).toBeNull();
});
