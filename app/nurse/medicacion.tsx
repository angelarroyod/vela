import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { medications, medsProgress, type Medication } from '@/data';

function MedRow({ med }: { med: Medication }) {
  const pending = med.status === 'pending';
  return (
    <View
      style={[
        s.med,
        med.highlight && { backgroundColor: colors.mint3, borderColor: colors.onGreenSub },
        pending && { borderStyle: 'dashed', borderColor: colors.dashed },
      ]}
    >
      {pending ? (
        <View style={s.emptyRing} />
      ) : (
        <View style={s.checkCircle}>
          <Icon name="check" size={17} color="#fff" strokeWidth={2.6} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.medName}>
          {med.name} <Text style={s.medDose}>{med.dose}</Text>
        </Text>
        <Text style={s.medReason}>{med.reason}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.medTime}>{med.time}</Text>
        <Text style={[s.medSub, { color: pending ? colors.amber : colors.primary }]}>{med.sub}</Text>
      </View>
    </View>
  );
}

export default function NurseMedicacion() {
  const router = useRouter();
  const pct = Math.round((medsProgress.done / medsProgress.total) * 100);
  return (
    <Screen time="23:44" bg={colors.appBg}>
      <View style={s.header}>
        <Pressable style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="chevronLeft" size={20} color={colors.serifHead} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Medicación</Text>
          <Text style={s.sub}>Sra. Elena · martes 26 jun</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.progressCard}>
          <View style={s.progressHead}>
            <Text style={s.progressTitle}>Dosis de hoy</Text>
            <Text style={s.progressCount}>
              {medsProgress.done} de {medsProgress.total}
            </Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${pct}%` }]} />
          </View>
        </View>

        {medications.map((m) => (
          <MedRow key={m.name} med={m} />
        ))}

        <View style={s.footer}>
          <Icon name="bell" size={15} color={colors.muted3} strokeWidth={2} />
          <Text style={s.footerTxt}>Te avisaremos antes de la próxima dosis</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.ink },
  sub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  content: { paddingHorizontal: 22, gap: 10, flexGrow: 1, paddingBottom: 16 },
  progressCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  progressCount: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.primary },
  track: { height: 8, backgroundColor: colors.track, borderRadius: 999, marginTop: 11, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  med: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
  },
  checkCircle: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyRing: { width: 34, height: 34, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.pendingRing },
  medName: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  medDose: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: colors.muted2 },
  medReason: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 1 },
  medTime: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink },
  medSub: { fontFamily: fontFamilyForWeight(600), fontSize: 11, marginTop: 1 },
  footer: { marginTop: 'auto', paddingTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  footerTxt: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.muted3 },
});
