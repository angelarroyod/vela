import { Icon, type IconName } from './Icon';
import { colors } from '@/theme';

export function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <Icon name={name} size={23} color={focused ? colors.primary : colors.muted3} strokeWidth={1.9} />;
}
