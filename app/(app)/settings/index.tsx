import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { colors, fontFamilyForWeight } from '@/theme';

export default function Settings() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const doSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esto borrará tu cuenta y tus datos de forma permanente. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta.');
              return;
            }
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  return (
    <Screen time="9:41" bg={colors.appBg}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back} accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="chevronLeft" size={20} color={colors.serifHead} strokeWidth={2} />
        </Pressable>
        <Text style={s.title}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Card style={{ padding: 16 }}>
          <Text style={s.label}>Cuenta</Text>
          <Text style={s.email}>{session?.user.email ?? '—'}</Text>
        </Card>

        <Pressable style={s.row} onPress={doSignOut} accessibilityRole="button">
          <Text style={s.rowTxt}>Cerrar sesión</Text>
          <Icon name="chevronRight" size={18} color={colors.chevron} strokeWidth={2.4} />
        </Pressable>

        <Pressable style={s.deleteRow} onPress={confirmDelete} accessibilityRole="button">
          <Text style={s.deleteTxt}>Eliminar cuenta</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 20, color: colors.ink },
  content: { paddingHorizontal: 22, gap: 13, paddingBottom: 16 },
  label: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink, marginBottom: 6 },
  email: { fontFamily: fontFamilyForWeight(600), fontSize: 15, color: colors.bodyOnCard },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  rowTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  deleteRow: { alignItems: 'center', backgroundColor: '#FBEEEA', borderWidth: 1, borderColor: '#F0D5CC', borderRadius: 18, padding: 16, marginTop: 8 },
  deleteTxt: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: '#B4452F' },
});
