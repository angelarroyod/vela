import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';

export default function Legal() {
  const router = useRouter();
  return (
    <Screen time="9:41" bg={colors.appBg}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back} accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="chevronLeft" size={20} color={colors.serifHead} strokeWidth={2} />
        </Pressable>
        <Text style={s.title}>Privacidad y aviso médico</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Card style={{ padding: 16 }}>
          <Text style={s.h}>Privacidad</Text>
          <Text style={s.p}>
            Vela guarda tu cuenta y la información del cuidado — datos del paciente, signos vitales, medicación,
            novedades y mensajes — para mostrarlos al equipo de cuidado autorizado.
          </Text>
          <Text style={s.p}>
            Tus datos de salud nunca se venden ni se usan para publicidad. Solo los ve quien pertenece al cuidado del
            paciente.
          </Text>
          <Text style={s.p}>
            Puedes eliminar tu cuenta y tus datos en cualquier momento desde Configuración → Eliminar cuenta.
          </Text>
        </Card>

        <Card style={{ padding: 16 }}>
          <Text style={s.h}>Aviso médico</Text>
          <Text style={s.p}>
            Vela es una herramienta para registrar y compartir el cuidado. Vela no es un dispositivo médico y no
            diagnostica, trata ni sustituye el criterio de un profesional de la salud.
          </Text>
          <Text style={s.p}>Ante una emergencia, contacta a los servicios de urgencia.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.ink, flex: 1 },
  content: { paddingHorizontal: 22, gap: 13, paddingBottom: 16 },
  h: { fontFamily: fontFamilyForWeight(700), fontSize: 15, color: colors.ink, marginBottom: 8 },
  p: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.bodyOnCard, lineHeight: 21, marginBottom: 8 },
});
