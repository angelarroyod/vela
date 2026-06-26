import { render } from '@testing-library/react-native';
import { TabBarIcon } from '@/components/TabBarIcon';

test('renders focused color', () => {
  expect(() => render(<TabBarIcon name="home" focused />)).not.toThrow();
});

test('renders unfocused', () => {
  expect(() => render(<TabBarIcon name="user" focused={false} />)).not.toThrow();
});
