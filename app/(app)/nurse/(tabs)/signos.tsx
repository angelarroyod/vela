import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { supabase } from '@/lib/supabase';
import { colors, fontFamilyForWeight } from '@/theme';
import { patient } from '@/data';

function VitalInput({
  label, value, onChangeText, placeholder, unit, keyboardType = 'numeric',
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder: string; unit?: string; keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={s.vital}>
      <Text style={s.vitalLabel}>{label}</Text>
      <View style={s.vitalValueRow}>
        <TextInput
          style={s.vitalInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted3}
          keyboardType={keyboardType}
        />
        {unit ? <Text style={s.vitalUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

export default function NurseSignos() {
  const { session } = useAuth();
  const { membership } = useMembership();
  const router = useRouter();
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [anomaly, setAnomaly] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!membership) return;
    setBusy(true);
    const [sys, dia] = bp.split('/').map((n) => parseInt(n, 10));
    await supabase.from('vitals').insert({
      patient_id: membership.patient_id, recorded_by: session?.user.id,
      bp_sys: sys, bp_dia: dia, hr: Number(hr), temp_c: Number(temp), spo2: Number(spo2),
      note, has_anomaly: anomaly,
    });
    await supabase.from('care_events').insert({
      patient_id: membership.patient_id, author_id: session?.user.id, type: 'vitals',
      title: 'Signos vitales', body: `PA ${bp} · FC ${hr} · ${temp}° · SpO₂ ${spo2}%`,
      severity: anomaly ? 'warning' : 'info',
    });
    setBusy(false);
    router.back();
  };

  return (
    <Screen time="00:02" bg={colors.appBg}>
      <View style={s.header}>
        <Text style={s.title}>Signos vitales</Text>
        <Text style={s.sub}>{patient.shortName} · nuevo control</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.grid}>
          <VitalInput label="Presión arterial" value={bp} onChangeText={setBp} placeholder="120/80" unit="mmHg" keyboardType="default" />
          <VitalInput label="Frecuencia cardíaca" value={hr} onChangeText={setHr} placeholder="72" unit="lpm" />
          <VitalInput label="Temperatura" value={temp} onChangeText={setTemp} placeholder="36.5" unit="°C" />
          <VitalInput label="Saturación O₂" value={spo2} onChangeText={setSpo2} placeholder="97" unit="%" />
        </View>

        <Pressable style={s.toggleRow} onPress={() => setAnomaly((a) => !a)} accessibilityRole="switch" accessibilityState={{ checked: anomaly }}>
          <View style={s.toggleIcon}>
            <Icon name="warningTri" size={19} color={colors.amber} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitle}>¿Alguna anomalía?</Text>
            <Text style={s.toggleSub}>Avísale a la familia si algo cambia</Text>
          </View>
          <View style={[s.switch, anomaly && { backgroundColor: colors.primary }]}>
            <View style={[s.knob, anomaly && { alignSelf: 'flex-end' }]} />
          </View>
        </Pressable>

        <View style={s.note}>
          <Text style={s.noteTitle}>Nota del control</Text>
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Cómo pasó el turno…"
            placeholderTextColor={colors.muted3}
            multiline
          />
        </View>

        <View style={s.saveWrap}>
          <PrimaryButton icon="check" label={busy ? 'Guardando…' : 'Guardar registro'} onPress={save} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14 },
  title: { fontFamily: fontFamilyForWeight(700), fontSize: 18, color: colors.ink },
  sub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2, marginTop: 2 },
  content: { paddingHorizontal: 22, gap: 13, flexGrow: 1, paddingBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  vital: {
    width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 20, padding: 15,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  vitalLabel: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.muted2 },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  vitalInput: { flex: 1, fontFamily: fontFamilyForWeight(800), fontSize: 26, color: colors.ink, padding: 0 },
  vitalUnit: { fontFamily: fontFamilyForWeight(600), fontSize: 13, color: colors.muted2 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16,
  },
  toggleIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.amberFill, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 14, color: colors.ink },
  toggleSub: { fontFamily: fontFamilyForWeight(500), fontSize: 12, color: colors.muted2 },
  switch: { width: 46, height: 27, borderRadius: 999, backgroundColor: '#E4EAE6', justifyContent: 'center', paddingHorizontal: 3 },
  knob: { width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff' },
  note: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  noteTitle: { fontFamily: fontFamilyForWeight(700), fontSize: 13, color: colors.ink, marginBottom: 7 },
  noteInput: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.bodyOnCard, lineHeight: 21, minHeight: 44 },
  saveWrap: { marginTop: 'auto', paddingTop: 4 },
});
