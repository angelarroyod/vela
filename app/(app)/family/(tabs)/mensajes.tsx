import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { colors, fontFamilyForWeight } from '@/theme';
import { nurse, type Message } from '@/data';
import { useAuth } from '@/features/auth/useAuth';
import { useMembership } from '@/features/auth/useMembership';
import { useMessages } from '@/features/care/hooks';
import { supabase } from '@/lib/supabase';

function Bubble({ msg }: { msg: Message }) {
  if (msg.fromSelf) {
    return (
      <View style={s.selfWrap}>
        <View style={s.selfBubble}>
          <Text style={s.selfTxt}>{msg.body}</Text>
        </View>
        <Text style={s.selfMeta}>{msg.time}</Text>
      </View>
    );
  }
  return (
    <View style={s.nurseWrap}>
      <View style={s.nurseBubble}>
        <Text style={s.nurseTxt}>{msg.body}</Text>
      </View>
      <Text style={s.nurseMeta}>{msg.time}</Text>
    </View>
  );
}

export default function FamilyMensajes() {
  const router = useRouter();
  const { session } = useAuth();
  const { membership } = useMembership();
  const messages = useMessages(membership?.patient_id, session?.user.id ?? '');
  const [draft, setDraft] = useState('');

  const send = async () => {
    if (!draft.trim() || !membership) return;
    const body = draft.trim();
    setDraft('');
    await supabase.from('messages').insert({ patient_id: membership.patient_id, sender_id: session?.user.id, body });
  };

  return (
    <Screen time="23:44" bg={colors.white}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="chevronLeft" size={20} color={colors.serifHead} strokeWidth={2} />
        </Pressable>
        <Avatar initials={nurse.initials} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{nurse.name}</Text>
          <View style={s.statusRow}>
            <View style={s.statusDot} />
            <Text style={s.statusTxt}>En turno ahora</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.list} contentContainerStyle={s.listContent}>
        <Text style={s.day}>HOY</Text>
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
      </ScrollView>

      <View style={s.composer}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.muted3}
          onSubmitEditing={send}
        />
        <Pressable style={s.send} onPress={send} accessibilityRole="button" accessibilityLabel="Enviar">
          <Icon name="send" size={20} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.chatBorder },
  name: { fontFamily: fontFamilyForWeight(700), fontSize: 15, color: colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: colors.primary },
  statusTxt: { fontFamily: fontFamilyForWeight(600), fontSize: 12, color: colors.primary },
  list: { flex: 1, backgroundColor: colors.chatBg },
  listContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  day: { textAlign: 'center', fontFamily: fontFamilyForWeight(600), fontSize: 11, color: colors.muted3 },
  selfWrap: { alignSelf: 'flex-end', maxWidth: '78%' },
  selfBubble: { backgroundColor: colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 6, borderBottomLeftRadius: 18, paddingVertical: 11, paddingHorizontal: 14 },
  selfTxt: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: '#fff', lineHeight: 20 },
  selfMeta: { textAlign: 'right', fontFamily: fontFamilyForWeight(600), fontSize: 10, color: colors.muted3, marginTop: 4 },
  nurseWrap: { alignSelf: 'flex-start', maxWidth: '80%' },
  nurseBubble: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 11, paddingHorizontal: 14 },
  nurseTxt: { fontFamily: fontFamilyForWeight(500), fontSize: 14, color: '#3A4742', lineHeight: 20 },
  nurseMeta: { fontFamily: fontFamilyForWeight(600), fontSize: 10, color: colors.muted3, marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.chatBorder, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 },
  input: { flex: 1, backgroundColor: colors.appBg, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, fontFamily: fontFamilyForWeight(500), fontSize: 14, color: colors.ink },
  send: { width: 44, height: 44, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
