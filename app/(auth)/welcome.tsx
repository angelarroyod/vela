import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from '@/components/StatusBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/Icon';
import { colors, font, fontFamilyForWeight } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={s.screen}>
      <LinearGradient colors={[...colors.gradWelcome]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={s.header}>
        <View style={{ paddingTop: topPad }}>
          <StatusBar time="21:30" tint="light" />
        </View>
        <View style={s.hero}>
          <View style={s.logoTile}>
            <Icon name="drop" size={34} color="#fff" />
          </View>
          <Text style={s.wordmark}>Vela</Text>
          <Text style={s.tagline}>Cuidado que acompaña, de día y de noche.</Text>
        </View>
      </LinearGradient>

      <View style={s.body}>
        <Text style={s.lead}>Cuidado compartido entre quienes registran y quienes acompañan.</Text>
        <View style={s.actions}>
          <PrimaryButton label="Crear cuenta" onPress={() => router.push('/(auth)/signup')} />
          <Pressable style={s.loginRow} onPress={() => router.push('/(auth)/login')} accessibilityRole="button">
            <Text style={s.loginMuted}>¿Ya tienes cuenta? </Text>
            <Text style={s.loginLink}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { paddingBottom: 44 },
  hero: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 40 },
  logoTile: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  wordmark: { fontFamily: font.serif, fontSize: 46, color: '#fff', lineHeight: 48, marginTop: 18 },
  tagline: { fontFamily: fontFamilyForWeight(500), fontSize: 15, color: colors.onGreenText, marginTop: 10, maxWidth: 240, textAlign: 'center', lineHeight: 22 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  lead: { fontFamily: font.serif, fontSize: 24, color: colors.ink, lineHeight: 30 },
  actions: { marginTop: 'auto', paddingBottom: 32, gap: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginMuted: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2 },
  loginLink: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.primary },
});
