import { View, StyleSheet, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radius, shadow } from '@/theme';

// On web the frame renders as a 390x844 rounded "phone" mockup (matches the
// design canvas). On a real device the app fills the screen like a normal app.
export function PhoneFrame({ bg = colors.appBg, children }: { bg?: string; children: ReactNode }) {
  return <View style={[s.base, Platform.OS === 'web' ? s.web : s.native, { backgroundColor: bg }]}>{children}</View>;
}

const s = StyleSheet.create({
  base: { overflow: 'hidden' },
  web: {
    width: 390,
    height: 844,
    borderRadius: radius.phone,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    marginVertical: 24,
    ...shadow.phone,
  },
  native: { flex: 1 },
});
