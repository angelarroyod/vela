import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon, type IconName } from '@/components/Icon';
import { colors, font, fontFamilyForWeight } from '@/theme';
import { patient, nurse } from '@/data';

function Task({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  time,
  onPress,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  time: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.task}>
      <View style={[s.taskIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={20} color={iconColor} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.taskTitle}>{title}</Text>
        <Text style={s.taskSub}>{sub}</Text>
      </View>
      <Text style={s.taskTime}>{time}</Text>
    </Pressable>
  );
}

export default function NurseInicio() {
  const router = useRouter();
  return (
    <Screen time="23:14" bg={colors.appBg}>
      <ScrollView contentContainerStyle={s.content}>
        {/* topbar */}
        <View style={s.topbar}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Icon name="drop" size={15} color="#fff" />
            </View>
            <Text style={s.brandName}>Vela</Text>
          </View>
          <Avatar initials={nurse.initials} size={38} />
        </View>

        {/* greeting */}
        <View>
          <Text style={s.greeting}>Buenas noches, Carmen</Text>
          <Text style={s.shift}>{nurse.shift}</Text>
        </View>

        {/* patient card */}
        <Card style={{ padding: 18 }}>
          <View style={s.patientRow}>
            <View style={s.patientAvatar}>
              <Text style={s.patientAvatarTxt}>E</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.patientName}>{patient.fullName}</Text>
              <Text style={s.patientMeta}>{patient.age} años · {patient.room}</Text>
            </View>
            <StatusBadge label={patient.status} />
          </View>
          <View style={s.pills}>
            {patient.conditions.map((c) => (
              <Pill key={c} label={c} />
            ))}
          </View>
        </Card>

        {/* tareas */}
        <View>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Próximas tareas</Text>
            <Text style={s.sectionLink}>Ver todas</Text>
          </View>
          <View style={{ gap: 9 }}>
            <Task
              icon="pill"
              iconBg={colors.amberFill}
              iconColor={colors.amber}
              title="Medicación"
              sub="Losartán 50 mg"
              time="23:30"
              onPress={() => router.push('/nurse/medicacion')}
            />
            <Task
              icon="pulse"
              iconBg={colors.mint}
              iconColor={colors.primary}
              title="Signos vitales"
              sub="Control de rutina"
              time="00:00"
              onPress={() => router.push('/nurse/signos')}
            />
          </View>
        </View>

        {/* cta */}
        <View style={s.ctaWrap}>
          <PrimaryButton icon="plus" label="Registrar signos vitales" onPress={() => router.push('/nurse/signos')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 6, gap: 18, flexGrow: 1, paddingBottom: 10 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.ink },
  greeting: { fontFamily: font.serif, fontSize: 30, color: colors.ink, lineHeight: 33 },
  shift: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: colors.muted, marginTop: 6 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  patientAvatar: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.mint,
    borderWidth: 1, borderColor: colors.mint2, alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarTxt: { fontFamily: font.serif, fontSize: 24, color: colors.primaryDeep },
  patientName: { fontFamily: fontFamilyForWeight(700), fontSize: 17, color: colors.ink },
  patientMeta: { fontFamily: fontFamilyForWeight(500), fontSize: 13, color: colors.muted, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 7, marginTop: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  sectionLink: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.primary },
  task: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 15,
  },
  taskIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  taskSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2 },
  taskTime: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink },
  ctaWrap: { marginTop: 'auto', paddingTop: 6 },
});
