import { View, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme';

export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    ...shadow.card,
  },
});
