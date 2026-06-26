import { render, screen } from '@testing-library/react-native';
import { StatusBar } from '@/components/StatusBar';

test('shows the provided time', () => {
  render(<StatusBar time="23:14" tint="dark" />);
  expect(screen.getByText('23:14')).toBeTruthy();
});
