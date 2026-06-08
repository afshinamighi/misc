import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { getMemberById, getMemberHistory, deleteMember, updateMember, getSetting } from '../db/database';
import { formatCurrency, formatDateDisplay } from '../utils/format';

export default function MemberDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { memberId } = route.params;
  const [member, setMember] = useState(null);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [sport, setSport] = useState('');
  const [sportsList, setSportsList] = useState(['Volleyball', 'Football', 'Badminton']);

  const load = useCallback(async () => {
    const [m, h, sl] = await Promise.all([getMemberById(memberId), getMemberHistory(memberId), getSetting('sports_list')]);
    setMember(m);
    setHistory(h);
    if (m) { setFirstName(m.first_name); setLastName(m.last_name); setPosition(m.position || ''); setSport(m.sport || ''); }
    if (sl) setSportsList(sl.split(',').map(s => s.trim()).filter(Boolean));
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { Alert.alert('Required', 'First and last name are required.'); return; }
    await updateMember(memberId, { first_name: firstName.trim(), last_name: lastName.trim(), position: position.trim(), sport });
    setEditing(false);
    load();
  };

  const handleDelete = () => {
    Alert.alert('Remove member', `Remove ${member?.first_name} ${member?.last_name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteMember(memberId); navigation.goBack(); } },
    ]);
  };

  if (!member) return null;
  const isNeg = parseFloat(member.balance) < 0;
  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Squad</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
            <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.topTitle}>{member.first_name} {member.last_name}</Text>
        {!!member.sport && <Text style={styles.topSub}>{member.sport}{member.position ? ` · ${member.position}` : ''}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Avatar firstName={member.first_name} lastName={member.last_name} memberId={member.id} size={56} />
          <View style={styles.profileInfo}>
            <Text style={[styles.fullName, { color: isNeg ? theme.negative : theme.text }]}>{member.first_name} {member.last_name}</Text>
            {(member.sport || member.position) ? (
              <Text style={[styles.positionText, { color: theme.textSecondary }]}>
                {[member.sport, member.position].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={styles.balanceBox}>
            <Text style={[styles.balanceAmount, { color: isNeg ? theme.negative : theme.positive }]}>{formatCurrency(member.balance)}</Text>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Balance</Text>
          </View>
        </View>

        {editing && (
          <View style={[styles.editCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.editHeading, { color: theme.textSecondary }]}>EDIT MEMBER</Text>
            <Text style={[styles.label, { color: theme.textSecondary }]}>First name</Text>
            <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName} />
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>Last name</Text>
            <TextInput style={inputStyle} value={lastName} onChangeText={setLastName} />
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>Position</Text>
            <TextInput style={inputStyle} value={position} onChangeText={setPosition} placeholder="e.g. Goalkeeper" placeholderTextColor={theme.textTertiary} />
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>Sport</Text>
            <View style={styles.sportRow}>
              <TouchableOpacity style={[styles.sportBtn, { borderColor: theme.borderMed, backgroundColor: sport === '' ? theme.navy : theme.inputBg }]} onPress={() => setSport('')}>
                <Text style={[styles.sportBtnText, { color: sport === '' ? '#fff' : theme.textSecondary }]}>None</Text>
              </TouchableOpacity>
              {sportsList.map(s => (
                <TouchableOpacity key={s} style={[styles.sportBtn, { borderColor: theme.borderMed, backgroundColor: sport === s ? theme.teal : theme.inputBg }]} onPress={() => setSport(s)}>
                  <Text style={[styles.sportBtnText, { color: sport === s ? '#fff' : theme.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.navy, marginTop: 14 }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.borderMed, marginTop: 8 }]} onPress={() => setEditing(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>SESSION HISTORY</Text>
        {history.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No sessions recorded yet.</Text>
        ) : (
          history.map((h, i) => (
            <View key={i} style={[styles.historyRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.historyLeft}>
                <Text style={[styles.historyName, { color: theme.text }]}>{h.name || `Session · ${formatDateDisplay(h.date)}`}</Text>
                <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{formatDateDisplay(h.date)}{h.location ? ` · ${h.location}` : ''}</Text>
              </View>
              <View style={styles.historyRight}>
                {h.present ? (
                  <>
                    <Text style={[styles.deducted, { color: theme.negative }]}>-{formatCurrency(h.fee)}</Text>
                    <View style={[styles.pill, { backgroundColor: theme.posBg }]}><Text style={[styles.pillText, { color: theme.posText }]}>Present</Text></View>
                  </>
                ) : (
                  <View style={[styles.pill, { backgroundColor: theme.negBg }]}><Text style={[styles.pillText, { color: theme.negText }]}>Absent</Text></View>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: theme.negative }]} onPress={handleDelete} activeOpacity={0.7}>
          <Text style={[styles.deleteBtnText, { color: theme.negative }]}>Remove member</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  backBtn: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  editBtn: { color: '#1a9e75', fontSize: 14, fontWeight: '600' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  topSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  content: { padding: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 0.5, marginBottom: 16 },
  profileInfo: { flex: 1 },
  fullName: { fontSize: 15, fontWeight: '600' },
  positionText: { fontSize: 12, marginTop: 2 },
  balanceBox: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 18, fontWeight: '700' },
  balanceLabel: { fontSize: 10, marginTop: 2 },
  editCard: { borderRadius: 10, borderWidth: 0.5, padding: 14, marginBottom: 16 },
  editHeading: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 5, fontWeight: '500' },
  input: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 2 },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 0.5 },
  sportBtnText: { fontSize: 13, fontWeight: '500' },
  saveBtn: { borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { borderWidth: 0.5, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14 },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 2 },
  empty: { textAlign: 'center', marginTop: 16, fontSize: 13 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, borderWidth: 0.5, marginBottom: 6 },
  historyLeft: { flex: 1 },
  historyName: { fontSize: 13, fontWeight: '500' },
  historyDate: { fontSize: 11, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  deducted: { fontSize: 12, fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  pillText: { fontSize: 10, fontWeight: '500' },
  deleteBtn: { marginTop: 24, borderWidth: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500' },
});
