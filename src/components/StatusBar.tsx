import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { fontFamilyForWeight } from '@/theme';

export function StatusBar({ time, tint = 'dark' }: { time: string; tint?: 'light' | 'dark' }) {
  const c = tint === 'light' ? '#fff' : '#28332E';
  return (
    <View style={s.row}>
      <Text style={[s.time, { color: c }]}>{time}</Text>
      <View style={s.icons}>
        <Icon name="signal" size={18} color={c} />
        <Icon name="wifi" size={17} color={c} />
        <Icon name="battery" size={26} color={c} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 34, paddingRight: 28 },
  time: { fontFamily: fontFamilyForWeight(700), fontSize: 15 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
