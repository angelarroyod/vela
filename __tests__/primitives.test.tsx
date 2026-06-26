import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';

test('StatusBadge shows label', () => {
  render(<StatusBadge label="Estable" />);
  expect(screen.getByText('Estable')).toBeTruthy();
});

test('Avatar shows initials', () => {
  render(<Avatar initials="CM" />);
  expect(screen.getByText('CM')).toBeTruthy();
});

test('PrimaryButton fires onPress', () => {
  const fn = jest.fn();
  render(<PrimaryButton label="Guardar" onPress={fn} />);
  fireEvent.press(screen.getByText('Guardar'));
  expect(fn).toHaveBeenCalled();
});
