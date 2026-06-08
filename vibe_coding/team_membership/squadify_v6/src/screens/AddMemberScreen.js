import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { insertMember, getSetting } from '../db/database';

export default function AddMemberScreen({ navigation }) {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [sport, setSport] = useState('');
  const [balance, setBalance] = useState('0');
  const [sportsList, setSportsList] = useState(['Volleyball', 'Football', 'Badminton']);

  useEffect(() => {
    getSetting('sports_list').then(val => {
      if (val) setSportsList(val.split(',').map(s => s.trim()).filter(Boolean));
    });
  }, []);

  const handleSave = async () => {
    if (!firstName.trim()) { Alert.alert('Required', 'First name is required.'); return; }
    // Last name is optional — defaults to "." if left empty
    const resolvedLastName = lastName.trim() || '.';
    await insertMember({ first_name: firstName.trim(), last_name: resolvedLastName, position: position.trim(), sport, balance: parseFloat(balance) || 0 });
    navigation.goBack();
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];
  const labelStyle = [styles.label, { color: theme.textSecondary }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <View style={styles.topRow}>
          <Text style={styles.topTitle}>Add member</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={labelStyle}>First name *</Text>
          <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName} placeholder="e.g. Jan" placeholderTextColor={theme.textTertiary} autoFocus />

          <Text style={[labelStyle, { marginTop: 14 }]}>Last name (optional)</Text>
          <TextInput style={inputStyle} value={lastName} onChangeText={setLastName} placeholder="e.g. de Vries" placeholderTextColor={theme.textTertiary} />

          <Text style={[labelStyle, { marginTop: 14 }]}>Position (optional)</Text>
          <TextInput style={inputStyle} value={position} onChangeText={setPosition} placeholder="e.g. Goalkeeper" placeholderTextColor={theme.textTertiary} />

          <Text style={[labelStyle, { marginTop: 14 }]}>Sport</Text>
          <View style={styles.sportRow}>
            <TouchableOpacity
              style={[styles.sportBtn, { borderColor: theme.borderMed, backgroundColor: sport === '' ? theme.navy : theme.inputBg }]}
              onPress={() => setSport('')}
            >
              <Text style={[styles.sportBtnText, { color: sport === '' ? '#fff' : theme.textSecondary }]}>None</Text>
            </TouchableOpacity>
            {sportsList.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sportBtn, { borderColor: theme.borderMed, backgroundColor: sport === s ? theme.teal : theme.inputBg }]}
                onPress={() => setSport(s)}
              >
                <Text style={[styles.sportBtnText, { color: sport === s ? '#fff' : theme.text }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[labelStyle, { marginTop: 14 }]}>Opening balance (€)</Text>
          <TextInput style={inputStyle} value={balance} onChangeText={setBalance} placeholder="0" placeholderTextColor={theme.textTertiary} keyboardType="numeric" />

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.borderMed }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.navy }]} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save member</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  closeBtn: { color: 'rgba(255,255,255,0.7)', fontSize: 18, padding: 4 },
  form: { padding: 16 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '500' },
  input: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 0.5 },
  sportBtnText: { fontSize: 13, fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  cancelBtn: { flex: 1, borderWidth: 0.5, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '500' },
  saveBtn: { flex: 1.5, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
