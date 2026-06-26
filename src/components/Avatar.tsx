import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilyForWeight } from '@/theme';

export function Avatar({
  initials,
  size = 38,
  bg = colors.mint2,
  color = colors.primaryDeep,
  rounded = 999,
}: {
  initials: string;
  size?: number;
  bg?: string;
  color?: string;
  rounded?: number;
}) {
  return (
    <View style={[s.center, { width: size, height: size, borderRadius: rounded, backgroundColor: bg }]}>
      <Text style={[s.txt, { color, fontSize: Math.round(size * 0.37) }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  txt: { fontFamily: fontFamilyForWeight(700) },
});
