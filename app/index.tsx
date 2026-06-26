import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { StatusBar } from '@/components/StatusBar';
import { Icon, type IconName } from '@/components/Icon';
import { colors, font, fontFamilyForWeight } from '@/theme';

function RoleRow({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.role} accessibilityRole="button">
      <View style={[s.roleIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={24} color={iconColor} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.roleTitle}>{title}</Text>
        <Text style={s.roleSub}>{subtitle}</Text>
      </View>
      <Icon name="chevronRight" size={18} color={colors.chevron} strokeWidth={2.4} />
    </Pressable>
  );
}

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

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        <Text style={s.prompt}>¿Cómo usarás Vela?</Text>
        <RoleRow
          title="Soy enfermera/o"
          subtitle="Registro signos y novedades del turno"
          icon="pulse"
          iconBg={colors.mint}
          iconColor={colors.primaryDeep}
          onPress={() => router.push('/nurse/inicio')}
        />
        <RoleRow
          title="Soy familiar"
          subtitle="Sigo el estado de mi ser querido"
          icon="heart"
          iconBg={colors.amberFill2}
          iconColor={colors.amberRole}
          onPress={() => router.push('/family/inicio')}
        />
        <View style={s.footer}>
          <Text style={s.footerMuted}>¿Ya tienes cuenta? </Text>
          <Text style={s.footerLink}>Iniciar sesión</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { paddingBottom: 36 },
  hero: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 30 },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontFamily: font.serif, fontSize: 46, color: '#fff', lineHeight: 48, marginTop: 18 },
  tagline: {
    fontFamily: fontFamilyForWeight(500),
    fontSize: 15,
    color: colors.onGreenText,
    marginTop: 10,
    maxWidth: 240,
    textAlign: 'center',
    lineHeight: 22,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 26, gap: 13, flexGrow: 1 },
  prompt: { fontFamily: fontFamilyForWeight(700), fontSize: 15, color: colors.ink, paddingLeft: 2 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  roleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 16, color: colors.ink },
  roleSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  footer: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'center', paddingVertical: 30 },
  footerMuted: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2 },
  footerLink: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.primary },
});
