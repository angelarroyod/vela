import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon, type IconName } from '@/components/Icon';
import { supabase } from '@/lib/supabase';
import { normalizeInviteCode } from '@/features/auth/invite';
import { colors, fontFamilyForWeight } from '@/theme';

type Step = 'role' | 'nurse' | 'family';

function RoleRow({ title, subtitle, icon, iconBg, iconColor, onPress }: {
  title: string; subtitle: string; icon: IconName; iconBg: string; iconColor: string; onPress: () => void;
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

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [room, setRoom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createPatient = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc('create_patient_with_nurse', {
      p_name: name.trim(), p_age: age ? Number(age) : null, p_room: room.trim() || null,
    });
    setBusy(false);
    if (error) setError(error.message); else router.replace('/(app)/nurse/inicio');
  };

  const redeem = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc('redeem_invite', { p_code: normalizeInviteCode(code) });
    setBusy(false);
    if (error) setError('Código inválido o expirado'); else router.replace('/(app)/family/inicio');
  };

  return (
    <Screen time="9:41" bg={colors.white}>
      <View style={s.body}>
        {step === 'role' && (
          <>
            <Text style={s.title}>¿Cómo usarás Vela?</Text>
            <RoleRow title="Soy enfermera/o" subtitle="Registro signos y novedades del turno" icon="pulse" iconBg={colors.mint} iconColor={colors.primaryDeep} onPress={() => setStep('nurse')} />
            <RoleRow title="Soy familiar" subtitle="Sigo el estado de mi ser querido" icon="heart" iconBg={colors.amberFill2} iconColor={colors.amberRole} onPress={() => setStep('family')} />
          </>
        )}

        {step === 'nurse' && (
          <>
            <Text style={s.title}>Datos del paciente</Text>
            <TextInput style={s.input} placeholder="Nombre del paciente" value={name} onChangeText={setName} placeholderTextColor={colors.muted3} />
            <TextInput style={s.input} placeholder="Edad" keyboardType="number-pad" value={age} onChangeText={setAge} placeholderTextColor={colors.muted3} />
            <TextInput style={s.input} placeholder="Habitación (opcional)" value={room} onChangeText={setRoom} placeholderTextColor={colors.muted3} />
            {error ? <Text style={s.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Creando…' : 'Continuar'} onPress={createPatient} />
          </>
        )}

        {step === 'family' && (
          <>
            <Text style={s.title}>Código de invitación</Text>
            <Text style={s.help}>Pídele a la enfermera el código de 6 caracteres.</Text>
            <TextInput style={[s.input, s.code]} placeholder="ABC123" autoCapitalize="characters" value={code} onChangeText={setCode} placeholderTextColor={colors.muted3} />
            {error ? <Text style={s.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Uniéndote…' : 'Unirme'} onPress={redeem} />
          </>
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 24, gap: 13 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 22, color: colors.ink, marginBottom: 6 },
  help: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, marginTop: -6 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16 },
  roleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 16, color: colors.ink },
  roleSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fontFamilyForWeight(500), fontSize: 15, color: colors.ink },
  code: { letterSpacing: 4, textAlign: 'center', fontFamily: fontFamilyForWeight(700), fontSize: 20 },
  error: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: '#B4452F' },
});
