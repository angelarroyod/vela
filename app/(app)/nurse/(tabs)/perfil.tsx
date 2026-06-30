import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { nurse, patient } from '@/data';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { generateInviteCode } from '@/features/auth/invite';
import { supabase } from '@/lib/supabase';

export default function NursePerfil() {
  const { session } = useAuth();
  const { membership } = useMembership();
  const router = useRouter();

  const invite = async () => {
    if (!membership) {
      Alert.alert('Sin paciente', 'Aún no tienes un paciente asignado.');
      return;
    }
    const code = generateInviteCode();
    const { error } = await supabase.from('invites').insert({
      patient_id: membership.patient_id,
      role: 'family',
      code,
      invited_by: session?.user.id,
    });
    if (error) {
      Alert.alert('Error', 'No se pudo crear la invitación.');
      return;
    }
    await Share.share({ message: `Únete al cuidado de ${patient.shortName} en Vela. Código: ${code}` });
  };

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

        <Pressable style={s.invite} accessibilityRole="button" onPress={invite}>
          <View style={s.inviteIcon}>
            <Icon name="user" size={18} color={colors.primaryDeep} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.inviteTitle}>Invitar a la familia</Text>
            <Text style={s.inviteSub}>Comparte un código para que sigan a {patient.shortName}</Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.chevron} strokeWidth={2.4} />
        </Pressable>

        <Pressable style={s.signOut} accessibilityRole="button" onPress={() => router.push('/(app)/settings')}>
          <Text style={s.signOutTxt}>Configuración</Text>
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
  invite: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  inviteIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  inviteSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  signOutTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
});
