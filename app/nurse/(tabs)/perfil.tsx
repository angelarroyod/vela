import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { nurse, patient } from '@/data';

export default function NursePerfil() {
  return (
    <Screen time="06:00" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.profile}>
          <Avatar initials={nurse.initials} size={60} rounded={20} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{nurse.name}</Text>
            <Text style={s.role}>Enfermera · turno de noche</Text>
          </View>
        </View>

        <Card style={{ padding: 16 }}>
          <Text style={s.cardLabel}>Turno</Text>
          <Text style={s.cardValue}>22:00 – 06:00</Text>
        </Card>

        <Card style={{ padding: 16 }}>
          <Text style={s.cardLabel}>Paciente asignada</Text>
          <View style={s.patientRow}>
            <View style={s.patientAvatar}>
              <Text style={s.patientAvatarTxt}>E</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.patientName}>{patient.shortName} Rivas</Text>
              <Text style={s.patientMeta}>{patient.age} años · {patient.room}</Text>
            </View>
            <StatusBadge label={patient.status} />
          </View>
        </Card>

        <Pressable style={s.signOut} accessibilityRole="button">
          <Text style={s.signOutTxt}>Cerrar sesión</Text>
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
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fontFamilyForWeight(700), fontSize: 19, color: colors.ink },
  role: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, marginTop: 2 },
  cardLabel: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink, marginBottom: 8 },
  cardValue: { fontFamily: fontFamilyForWeight(600), fontSize: 15, color: colors.bodyOnCard },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  patientAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.mint2, alignItems: 'center', justifyContent: 'center' },
  patientAvatarTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.primaryDeep },
  patientName: { fontFamily: fontFamilyForWeight(700), fontSize: 15, color: colors.ink },
  patientMeta: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  signOutTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
});
