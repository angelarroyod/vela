import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontFamilyForWeight } from '@/theme';

export function Pill({
  label,
  bg = colors.chipBg,
  color = colors.muted,
  border = colors.border,
}: {
  label: string;
  bg?: string;
  color?: string;
  border?: string;
}) {
  return (
    <View style={[s.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.txt, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { borderRadius: radius.pill, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 11, alignSelf: 'flex-start' },
  txt: { fontFamily: fontFamilyForWeight(600), fontSize: 12 },
});
