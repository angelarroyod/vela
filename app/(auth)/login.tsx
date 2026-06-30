import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { AppleButton } from '@/features/auth/appleAuth';
import { useAuth } from '@/features/auth/useAuth';
import { colors, fontFamilyForWeight } from '@/theme';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
    else router.replace('/');
  };

  return (
    <Screen time="9:41" bg={colors.white}>
      <View style={s.body}>
        <Text style={s.title}>Bienvenido de nuevo</Text>
        <TextInput
          style={s.input}
          placeholder="correo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={colors.muted3}
        />
        <TextInput
          style={s.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={colors.muted3}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'Entrando…' : 'Iniciar sesión'} onPress={submit} />
        <AppleButton />
        <Text style={s.alt} onPress={() => router.push('/(auth)/signup')}>
          ¿No tienes cuenta? <Text style={s.link}>Crear cuenta</Text>
        </Text>
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
  error: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: '#B4452F' },
  alt: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted2, textAlign: 'center', marginTop: 8 },
  link: { fontFamily: fontFamilyForWeight(700), color: colors.primary },
});
