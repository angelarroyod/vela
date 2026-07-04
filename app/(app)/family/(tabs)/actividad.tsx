import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { type FeedEntry } from '@/data';
import { useMembership } from '@/features/auth/useMembership';
import { useCareEvents } from '@/features/care/hooks';

function FeedCard({ entry }: { entry: FeedEntry }) {
  const anomaly = entry.tone === 'anomaly';
  return (
    <View style={[s.card, anomaly && { backgroundColor: colors.anomalyBg, borderColor: colors.anomalyBorder }]}>
      <View style={s.cardHead}>
        {anomaly ? (
          <View style={s.anomalyAvatar}>
            <Icon name="warningCircle" size={16} color={colors.amberStroke} strokeWidth={2.2} />
          </View>
        ) : (
          <Avatar initials={entry.initials} size={32} />
        )}
        <View style={{ flex: 1 }}>
          <Text>
            <Text style={[s.who, anomaly && { color: colors.amberText }]}>{entry.who}</Text>{' '}
            <Text style={[s.action, anomaly && { color: colors.amberMuted }]}>{entry.action}</Text>
          </Text>
        </View>
        <Text style={[s.time, anomaly && { color: colors.amberTs2 }]}>{entry.time}</Text>
      </View>
      {entry.chips ? (
        <View style={s.chips}>
          {entry.chips.map((c) => (
            <View key={c} style={s.chip}>
              <Text style={s.chipTxt}>{c}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {entry.body ? <Text style={[s.body, anomaly && { color: colors.amberBody }]}>{entry.body}</Text> : null}
    </View>
  );
}

export default function FamilyActividad() {
  const { membership } = useMembership();
  const feed = useCareEvents(membership?.patient_id);
  return (
    <Screen time="23:43" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Actividad</Text>
        <Text style={s.sub}>Hoy</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {feed.length === 0 ? (
          <Text style={s.empty}>Sin novedades aún.</Text>
        ) : (
          feed.map((e, i) => <FeedCard key={i} entry={e} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 12 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 20, color: colors.ink },
  sub: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, marginTop: 2 },
  content: { paddingHorizontal: 22, gap: 11, paddingBottom: 16 },
  empty: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.muted2, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 15 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anomalyAvatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.anomalyAvatar, alignItems: 'center', justifyContent: 'center' },
  who: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink },
  action: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2 },
  time: { fontFamily: fontFamilyForWeight(600), fontSize: 11, color: colors.muted3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  chip: { backgroundColor: colors.mint3, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  chipTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 11, color: colors.primaryDeep },
  body: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.bodyOnCard, lineHeight: 21, marginTop: 9 },
});
