import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow, fontFamilyForWeight } from '@/theme';
import { Icon, type IconName } from './Icon';

export function PrimaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable onPress={onPress} style={s.btn} accessibilityRole="button">
      {icon ? <Icon name={icon} size={20} color="#fff" strokeWidth={2} /> : null}
      <Text style={s.txt}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadow.button,
  },
  txt: { fontFamily: fontFamilyForWeight(700), fontSize: 16, color: '#fff' },
});
