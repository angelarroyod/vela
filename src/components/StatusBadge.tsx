import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontFamilyForWeight } from '@/theme';

export function StatusBadge({
  label,
  dot = colors.primary,
  bg = colors.mint,
  color = colors.primaryDeep,
}: {
  label: string;
  dot?: string;
  bg?: string;
  color?: string;
}) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <Text style={[s.txt, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 11,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 99 },
  txt: { fontFamily: fontFamilyForWeight(700), fontSize: 12 },
});
