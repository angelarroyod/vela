import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/useAuth';
import { colors, fontFamilyForWeight } from '@/theme';

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!consent) return;
    setBusy(true);
    setError(null);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (error) setError(error);
    else router.replace('/(auth)/onboarding');
  };

  return (
    <Screen time="9:41" bg={colors.white}>
      <View style={s.body}>
        <Text style={s.title}>Crea tu cuenta</Text>
        <TextInput style={s.input} placeholder="Nombre completo" value={fullName} onChangeText={setFullName} placeholderTextColor={colors.muted3} />
        <TextInput style={s.input} placeholder="correo@ejemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholderTextColor={colors.muted3} />
        <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={colors.muted3} />

        <Pressable style={s.consent} onPress={() => setConsent((c) => !c)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
          <View style={[s.box, consent && s.boxOn]}>{consent ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}</View>
          <Text style={s.consentTxt}>
            Acepto la política de privacidad y entiendo que Vela es una herramienta de registro de cuidados, no un dispositivo médico.
          </Text>
        </Pressable>

        {error ? <Text style={s.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'Creando…' : 'Crear cuenta'} onPress={submit} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 24, gap: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 26, color: colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fontFamilyForWeight(500), fontSize: 15, color: colors.ink,
  },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.muted3, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentTxt: { flex: 1, fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted, lineHeight: 18 },
  error: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: '#B4452F' },
});
