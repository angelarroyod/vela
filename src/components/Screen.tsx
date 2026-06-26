import { View, StyleSheet, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from './StatusBar';
import { colors } from '@/theme';

// Full-screen wrapper used by every in-navigator screen: screen-colored
// background, a faux status bar (pushed below the notch on device), and a
// flex body. On a real device this fills the screen like a normal app.
export function Screen({
  time,
  tint = 'dark',
  bg = colors.appBg,
  children,
}: {
  time: string;
  tint?: 'light' | 'dark';
  bg?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <View style={{ paddingTop: topPad }}>
        <StatusBar time={time} tint={tint} />
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1 }, body: { flex: 1 } });
