import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { relevoTimeline, recommendation, type TimelineEntry } from '@/data';

function Entry({ entry, last }: { entry: TimelineEntry; last: boolean }) {
  const anomaly = entry.tone === 'anomaly';
  return (
    <View style={[s.entry, last && { paddingBottom: 0 }]}>
      <View style={[s.dot, { backgroundColor: anomaly ? colors.anomalyDot : colors.primary }]} />
      {anomaly ? (
        <View style={s.anomalyCard}>
          <View style={s.row}>
            <Text style={s.anomalyTitle}>{entry.title}</Text>
            <Text style={s.anomalyTime}>{entry.time}</Text>
          </View>
          <Text style={s.anomalyBody}>{entry.body}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={s.row}>
            <Text style={s.entryTitle}>{entry.title}</Text>
            <Text style={s.entryTime}>{entry.time}</Text>
          </View>
          <Text style={s.entryBody}>{entry.body}</Text>
        </View>
      )}
    </View>
  );
}

export default function NurseRelevo() {
  const router = useRouter();
  const handover = () => {
    Alert.alert('Entregar turno', '¿Entregar el turno al equipo de día?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Entregar', onPress: () => router.replace('/nurse/inicio') },
    ]);
  };
  return (
    <Screen time="05:48" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Relevo de turno</Text>
        <Text style={s.sub}>Resumen · 22:00 – 06:00</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.timeline}>
          <View style={s.line} />
          {relevoTimeline.map((e, i) => (
            <Entry key={e.title} entry={e} last={i === relevoTimeline.length - 1} />
          ))}
        </View>

        <View style={s.recCard}>
          <View style={s.recHead}>
            <Icon name="bulb" size={17} color={colors.primary} strokeWidth={2} />
            <Text style={s.recTitle}>Recomendación para el día</Text>
          </View>
          <Text style={s.recBody}>{recommendation}</Text>
        </View>

        <View style={s.ctaWrap}>
          <PrimaryButton label="Entregar turno al equipo de día" onPress={handover} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 20, color: colors.ink },
  sub: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, marginTop: 2 },
  content: { paddingHorizontal: 22, flexGrow: 1, paddingBottom: 14 },
  timeline: { position: 'relative', paddingLeft: 8 },
  line: { position: 'absolute', left: 14, top: 6, bottom: 6, width: 2, backgroundColor: colors.timeline },
  entry: { flexDirection: 'row', gap: 14, paddingBottom: 16 },
  dot: { width: 14, height: 14, borderRadius: 999, borderWidth: 3, borderColor: colors.appBg, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  entryTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  entryTime: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.muted2 },
  entryBody: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted, marginTop: 2 },
  anomalyCard: { flex: 1, backgroundColor: colors.anomalyBg, borderWidth: 1, borderColor: colors.anomalyBorder, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13 },
  anomalyTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.amberText },
  anomalyTime: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.amberTs },
  anomalyBody: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.amberBody, marginTop: 3, lineHeight: 19 },
  recCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  recHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.primaryDeep },
  recBody: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.bodyOnCard, lineHeight: 21 },
  ctaWrap: { marginTop: 'auto', paddingTop: 16 },
});
