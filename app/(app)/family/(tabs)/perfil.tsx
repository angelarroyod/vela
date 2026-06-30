import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { colors, font, fontFamilyForWeight } from '@/theme';
import { patient, careTeam, contacts } from '@/data';

export default function FamilyPerfil() {
  const router = useRouter();
  return (
    <Screen time="23:46" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {/* patient header */}
        <View style={s.patient}>
          <View style={s.patientAvatar}>
            <Text style={s.patientAvatarTxt}>E</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.patientName}>{patient.shortName} Rivas</Text>
            <Text style={s.patientMeta}>{patient.age} años · En casa</Text>
          </View>
          <StatusBadge label={patient.status} />
        </View>

        {/* care team */}
        <Card style={{ padding: 16 }}>
          <Text style={s.cardTitle}>Equipo de cuidado</Text>
          <View style={s.team}>
            {careTeam.map((m) => (
              <View key={m.initials} style={s.member}>
                <Avatar initials={m.initials} size={42} bg={m.bg} color={m.fg} />
                <Text style={s.memberName}>{m.name}</Text>
                <Text style={s.memberRole}>{m.role}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* conditions */}
        <Card style={{ padding: 16 }}>
          <Text style={s.cardTitle}>Condiciones</Text>
          <View style={s.pills}>
            {patient.conditionsFull.map((c) => (
              <Pill key={c} label={c} />
            ))}
            <Pill label={`Alergia · ${patient.allergy}`} bg={colors.anomalyBg} border={colors.anomalyBorder} color={colors.amberCond} />
          </View>
        </Card>

        {/* contacts */}
        <Card style={{ padding: 16 }}>
          <Text style={[s.cardTitle, { marginBottom: 12 }]}>Contactos de emergencia</Text>
          {contacts.map((c, i) => (
            <View key={c.name} style={[s.contact, i < contacts.length - 1 && s.contactDivider]}>
              <Avatar initials={c.initials} size={38} bg={c.bg} color={c.fg} />
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>{c.name}</Text>
                <Text style={s.contactSub}>{c.sub}</Text>
              </View>
              <View style={s.callBtn}>
                <Icon name="phone" size={18} color={colors.primaryDeep} strokeWidth={1.9} />
              </View>
            </View>
          ))}
        </Card>

        <Pressable style={s.settings} accessibilityRole="button" onPress={() => router.push('/(app)/settings')}>
          <Text style={s.settingsTxt}>Configuración</Text>
          <Icon name="chevronRight" size={18} color={colors.chevron} strokeWidth={2.4} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 20, color: colors.ink },
  content: { paddingHorizontal: 22, gap: 13, paddingBottom: 16 },
  patient: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  patientAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.mint2, alignItems: 'center', justifyContent: 'center' },
  patientAvatarTxt: { fontFamily: font.serif, fontSize: 28, color: colors.primaryDeep },
  patientName: { fontFamily: fontFamilyForWeight(700), fontSize: 19, color: colors.ink },
  patientMeta: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, marginTop: 2 },
  cardTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink, marginBottom: 13 },
  team: { flexDirection: 'row', justifyContent: 'space-between' },
  member: { flex: 1, alignItems: 'center', gap: 6 },
  memberName: { fontFamily: fontFamilyForWeight(700), fontSize: 12, color: colors.ink },
  memberRole: { fontFamily: fontFamilyForWeight(500), fontSize: 11, color: colors.muted2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12 },
  contactDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: 12 },
  contactName: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  contactSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2 },
  callBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  settings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  settingsTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
});
