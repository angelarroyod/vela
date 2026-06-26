import { View, StyleSheet, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneFrame } from './PhoneFrame';
import { StatusBar } from './StatusBar';

export function Screen({
  time,
  tint = 'dark',
  bg,
  children,
}: {
  time: string;
  tint?: 'light' | 'dark';
  bg?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // On device, push the faux status bar below the real OS status bar / notch.
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  return (
    <PhoneFrame bg={bg}>
      <View style={{ paddingTop: topPad }}>
        <StatusBar time={time} tint={tint} />
      </View>
      <View style={s.body}>{children}</View>
    </PhoneFrame>
  );
}

const s = StyleSheet.create({ body: { flex: 1 } });
