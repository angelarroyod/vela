import { render } from '@testing-library/react-native';
import { Icon } from '@/components/Icon';

test('renders a known icon by name', () => {
  const { UNSAFE_root } = render(<Icon name="home" size={24} color="#5C8A77" />);
  expect(UNSAFE_root).toBeTruthy();
});

test('unknown icon renders nothing but does not throw', () => {
  // @ts-expect-error testing invalid name
  expect(() => render(<Icon name="nope" size={10} color="#000" />)).not.toThrow();
});
