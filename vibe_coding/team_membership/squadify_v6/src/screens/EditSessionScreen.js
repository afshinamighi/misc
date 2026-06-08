import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAllMembers, getSessionById, getSessionAttendance, updateSession, updateSessionAttendance } from '../db/database';
import Avatar from '../components/Avatar';
import { formatCurrency, formatDateDisplay } from '../utils/format';

export default function EditSessionScreen({ route, navigation }) {
  const theme = useTheme();
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [members, setMembers] = useState([]);
  const [checked, setChecked] = useState({});
  const [fee, setFee] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, allMembers, attendance] = await Promise.all([
        getSessionById(sessionId),
        getAllMembers(),
        getSessionAttendance(sessionId),
      ]);
      setSession(s);
      setSessionName(s?.name || '');
      setDate(s?.date || '');
      setLocation(s?.location || '');
      setFee(parseFloat(s?.fee) || 5);
      // Sort alphabetically by first name for the attendance checklist
      const sorted = [...allMembers].sort((a, b) =>
        a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' })
      );
      setMembers(sorted);
      // Build checked map from existing attendance
      const checkedMap = {};
      attendance.forEach(a => { checkedMap[a.member_id] = a.present === 1; });
      // Members not yet in this session default to unchecked
      allMembers.forEach(m => { if (checkedMap[m.id] === undefined) checkedMap[m.id] = false; });
      setChecked(checkedMap);
      setLoading(false);
    })();
  }, [sessionId]);

  const toggleMember = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const presentCount = Object.values(checked).filter(Boolean).length;

  const handleSave = async () => {
    await updateSession(sessionId, { name: sessionName.trim(), date, location: location.trim() });
    const attendance = members.map(m => ({ memberId: m.id, present: !!checked[m.id] }));
    await updateSessionAttendance(sessionId, attendance, fee);
    navigation.goBack();
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];

  const renderMember = ({ item }) => {
    const isChecked = !!checked[item.id];
    const isNeg = parseFloat(item.balance) < 0;
    return (
      <TouchableOpacity
        style={[styles.checkRow, { borderColor: isChecked ? theme.teal : theme.border, backgroundColor: theme.cardBg }]}
        onPress={() => toggleMember(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, { borderColor: isChecked ? '#1a9e75' : theme.borderMed, backgroundColor: isChecked ? '#1a9e75' : theme.inputBg }]}>
          {isChecked && <Svg width={12} height={12} viewBox="0 0 12 12" fill="none"><Path d="M2.5 6l2.5 2.5L9.5 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
        </View>
        <Avatar firstName={item.first_name} lastName={item.last_name} memberId={item.id} size={30} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.memberName, { color: isNeg ? theme.negative : theme.text }]}>{item.first_name} {item.last_name}</Text>
          {!!item.sport && <Text style={[styles.memberSport, { color: theme.textSecondary }]}>{item.sport}</Text>}
        </View>
        <View style={[styles.pill, { backgroundColor: isChecked ? theme.posBg : theme.negBg }]}>
          <Text style={[styles.pillText, { color: isChecked ? theme.posText : theme.negText }]}>{isChecked ? 'Present' : 'Absent'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Sessions</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Edit session</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Sessions</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Edit session</Text>
        <Text style={styles.topSub}>
          {session?.name || formatDateDisplay(session?.date)} · Fee: {formatCurrency(fee)}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.fields}>
          <TextInput style={[inputStyle, { marginBottom: 8 }]} value={sessionName} onChangeText={setSessionName} placeholder="Session name (optional)" placeholderTextColor={theme.textTertiary} />
          <View style={styles.fieldRow}>
            <TextInput style={[inputStyle, { flex: 1 }]} value={date} onChangeText={setDate} placeholder="Date" placeholderTextColor={theme.textTertiary} />
            <TextInput style={[inputStyle, { flex: 1 }]} value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor={theme.textTertiary} />
          </View>
        </View>

        <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>ATTENDANCE — TAP TO TOGGLE</Text>

        <FlatList
          data={members}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderMember}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No members in squad.</Text>}
        />

        <View style={[styles.summaryCard, { backgroundColor: theme.bgSecondary, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Present</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{presentCount} of {members.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Fee per member</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(fee)}</Text>
          </View>
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            Balance changes are applied automatically when you save.
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.navy }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  backBtn: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  topSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  fields: { padding: 12 },
  fieldRow: { flexDirection: 'row', gap: 8 },
  input: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13 },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 12 },
  empty: { textAlign: 'center', marginTop: 16, fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 0.5, marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 13, fontWeight: '500' },
  memberSport: { fontSize: 10, marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 10, fontWeight: '500' },
  summaryCard: { margin: 12, borderRadius: 8, borderWidth: 0.5, padding: 10, gap: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: '600' },
  noteText: { fontSize: 10, marginTop: 4 },
  footer: { padding: 12, borderTopWidth: 0.5 },
  saveBtn: { borderRadius: 8, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
