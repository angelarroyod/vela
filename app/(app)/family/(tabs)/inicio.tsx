import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { colors, font, fontFamilyForWeight } from '@/theme';
import { family, nurse } from '@/data';
import { useMembership } from '@/features/auth/useMembership';
import { useVitals } from '@/features/care/hooks';

function Glance({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={s.glance}>
      <Text style={s.glanceLabel}>{label}</Text>
      <Text style={s.glanceValue}>
        {value}
        {unit ? <Text style={s.glanceUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export default function FamilyEstado() {
  const { membership } = useMembership();
  const v = useVitals(membership?.patient_id)[0];
  return (
    <Screen time="23:42" bg={colors.appBg}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.head}>
          <View>
            <Text style={s.hi}>Hola, {family.short}</Text>
            <Text style={s.q}>¿Cómo está mamá?</Text>
          </View>
          <Avatar initials={family.initials} size={38} />
        </View>

        <LinearGradient colors={[...colors.gradFamilyHero]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={s.hero}>
          <View style={s.heroTag}>
            <View style={s.heroDot} />
            <Text style={s.heroTagTxt}>EN CASA · ATENDIDA AHORA</Text>
          </View>
          <Text style={s.heroTitle}>Elena está estable y descansando</Text>
          <View style={s.nurseChip}>
            <Avatar initials={nurse.initials} size={34} bg={colors.mint3} color={colors.primaryDeep} />
            <View style={{ flex: 1 }}>
              <Text style={s.nurseName}>Carmen está con ella</Text>
              <Text style={s.nurseRole}>Enfermera · turno de noche</Text>
            </View>
            <Text style={s.nurseAgo}>hace 4 min</Text>
          </View>
        </LinearGradient>

        <View>
          <Text style={s.vitalsTitle}>Últimos signos{v ? ` · ${v.takenAt}` : ''}</Text>
          <View style={s.grid}>
            <Glance label="Presión" value={v ? v.bp : '—'} />
            <Glance label="Pulso" value={v ? String(v.hr) : '—'} unit={v ? 'lpm' : undefined} />
            <Glance label="Temperatura" value={v ? v.tempC.toFixed(1) : '—'} unit={v ? '°C' : undefined} />
            <Glance label="Saturación" value={v ? String(v.spo2) : '—'} unit={v ? '%' : undefined} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 6, gap: 16, paddingBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hi: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2 },
  q: { fontFamily: font.serif, fontSize: 25, color: colors.ink, lineHeight: 28, marginTop: 1 },
  hero: { borderRadius: 26, padding: 22, ...{ shadowColor: '#487062', shadowOpacity: 0.32, shadowRadius: 34, shadowOffset: { width: 0, height: 16 }, elevation: 10 } },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: colors.heroDot },
  heroTagTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 12, color: colors.onGreenText, letterSpacing: 0.5 },
  heroTitle: { fontFamily: font.serif, fontSize: 32, color: '#fff', lineHeight: 36, marginTop: 12 },
  nurseChip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  nurseName: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: '#fff' },
  nurseRole: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.onGreenSub },
  nurseAgo: { fontFamily: fontFamilyForWeight(600), fontSize: 11, color: colors.onGreenSub },
  vitalsTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  glance: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14 },
  glanceLabel: { fontFamily: fontFamilyForWeight(600), fontSize: 11, color: colors.muted2 },
  glanceValue: { fontFamily: fontFamilyForWeight(800), fontSize: 19, color: colors.ink, marginTop: 4 },
  glanceUnit: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.muted2 },
});
