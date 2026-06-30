import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { vitals, patient } from '@/data';

function NormalBadge() {
  return (
    <View style={s.normal}>
      <View style={s.normalDot} />
      <Text style={s.normalTxt}>Normal</Text>
    </View>
  );
}

function VitalCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={s.vital}>
      <Text style={s.vitalLabel}>{label}</Text>
      <View style={s.vitalValueRow}>
        <Text style={s.vitalValue}>{value}</Text>
        {unit ? <Text style={s.vitalUnit}>{unit}</Text> : null}
      </View>
      <NormalBadge />
    </View>
  );
}

export default function NurseSignos() {
  return (
    <Screen time="00:02" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Signos vitales</Text>
        <Text style={s.sub}>{patient.shortName} · control de las 00:00</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.grid}>
          <VitalCard label="Presión arterial" value={vitals.bp} unit="mmHg" />
          <VitalCard label="Frecuencia cardíaca" value={String(vitals.hr)} unit="lpm" />
          <VitalCard label="Temperatura" value={vitals.tempC.toFixed(1)} unit="°C" />
          <VitalCard label="Saturación O₂" value={String(vitals.spo2)} unit="%" />
        </View>

        <View style={s.toggleRow}>
          <View style={s.toggleIcon}>
            <Icon name="warningTri" size={19} color={colors.amber} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitle}>¿Alguna anomalía?</Text>
            <Text style={s.toggleSub}>Avísale a la familia si algo cambia</Text>
          </View>
          <View style={s.switch}>
            <View style={s.knob} />
          </View>
        </View>

        <View style={s.note}>
          <Text style={s.noteTitle}>Nota del control</Text>
          <Text style={s.noteBody}>{vitals.note}</Text>
        </View>

        <View style={s.saveWrap}>
          <PrimaryButton icon="check" label="Guardar registro" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.ink },
  sub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  content: { paddingHorizontal: 22, gap: 13, flexGrow: 1, paddingBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  vital: {
    width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 20, padding: 15,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  vitalLabel: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.muted2 },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  vitalValue: { fontFamily: fontFamilyForWeight(800), fontSize: 26, color: colors.ink },
  vitalUnit: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: colors.muted2 },
  normal: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, alignSelf: 'flex-start',
    backgroundColor: colors.mint, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999,
  },
  normalDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: colors.primary },
  normalTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 10, color: colors.primaryDeep },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16,
  },
  toggleIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.amberFill, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  toggleSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2 },
  switch: { width: 46, height: 27, borderRadius: 999, backgroundColor: '#E4EAE6', justifyContent: 'center', paddingHorizontal: 3 },
  knob: { width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff' },
  note: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  noteTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink, marginBottom: 7 },
  noteBody: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.bodyOnCard, lineHeight: 21 },
  saveWrap: { marginTop: 'auto', paddingTop: 4 },
});
