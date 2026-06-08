import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAllSettings, setSetting, getAllMembers } from '../db/database';
import { exportCSV, getDBSize } from '../utils/csv';
import { formatBytes, nowISO } from '../utils/format';

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [settings, setSettings] = useState({});
  const [dbSize, setDbSize] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sportsList, setSportsList] = useState([]);
  const [newSport, setNewSport] = useState('');

  const load = useCallback(async () => {
    const [s, size] = await Promise.all([getAllSettings(), getDBSize()]);
    setSettings(s);
    setDbSize(size);
    if (s.sports_list) setSportsList(s.sports_list.split(',').map(x => x.trim()).filter(Boolean));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startEdit = (key, currentValue) => { setEditingKey(key); setEditValue(String(currentValue || '')); };
  const saveEdit = async () => {
    if (!editingKey) return;
    await setSetting(editingKey, editValue.trim());
    setEditingKey(null); setEditValue('');
    await load();
  };
  const cancelEdit = () => { setEditingKey(null); setEditValue(''); };

  const addSport = async () => {
    const s = newSport.trim();
    if (!s) return;
    if (sportsList.includes(s)) { Alert.alert('Duplicate', 'This sport is already in the list.'); return; }
    const updated = [...sportsList, s];
    await setSetting('sports_list', updated.join(','));
    setSportsList(updated);
    setNewSport('');
  };

  const removeSport = async (sport) => {
    Alert.alert('Remove sport', `Remove "${sport}" from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = sportsList.filter(s => s !== sport);
          await setSetting('sports_list', updated.join(','));
          setSportsList(updated);
        }
      }
    ]);
  };

  const handleImport = async () => {
    try {
      // Open the device file picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      // Copy the picked file into the app's cache directory first.
      // This is the most reliable method on Android — direct URI reads
      // from the document picker often fail due to Android permission scoping.
      const dest = FileSystemLegacy.cacheDirectory + 'squadify_import.csv';
      await FileSystemLegacy.copyAsync({ from: asset.uri, to: dest });

      // Now read from the cache copy using the plain 'utf8' string
      // (FileSystem.EncodingType is undefined in SDK 54 — use plain string)
      const text = await FileSystemLegacy.readAsStringAsync(dest, { encoding: 'utf8' });

      if (!text || text.trim().length === 0) {
        Alert.alert('Empty file', 'The selected file appears to be empty. Please check the file and try again.');
        return;
      }

      navigation.navigate('ImportPreview', { csvText: text, fileName: asset.name });

    } catch (e) {
      Alert.alert(
        'Import failed',
        `Could not read the file.\n\nReason: ${e.message || 'Unknown error'}\n\nMake sure the file is a plain CSV text file and try again.`
      );
    }
  };

  const handleExport = async () => {
    try {
      const members = await getAllMembers();
      if (members.length === 0) { Alert.alert('No data', 'There are no members to export.'); return; }
      await exportCSV(members);
      await setSetting('last_backup', nowISO());
      await load();
    } catch (e) {
      Alert.alert('Export failed', e.message || 'Could not export the file.');
    }
  };

  const t = theme;

  const EditRow = ({ label, keyName }) => (
    editingKey === keyName ? (
      <View style={[styles.frow, { borderBottomColor: t.separator }]}>
        <Text style={[styles.fl, { color: t.text, marginRight: 8 }]}>{label}</Text>
        <TextInput style={[styles.inlineInput, { color: t.text, borderColor: t.borderMed, backgroundColor: t.inputBg }]} value={editValue} onChangeText={setEditValue} autoFocus onSubmitEditing={saveEdit} />
        <TouchableOpacity onPress={saveEdit} style={styles.inlineBtn}><Text style={[styles.inlineBtnText, { color: t.teal }]}>Save</Text></TouchableOpacity>
        <TouchableOpacity onPress={cancelEdit}><Text style={[styles.inlineBtnText, { color: t.textSecondary }]}>Cancel</Text></TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={[styles.frow, { borderBottomColor: t.separator }]} onPress={() => startEdit(keyName, settings[keyName])} activeOpacity={0.6}>
        <Text style={[styles.fl, { color: t.text, flex: 1 }]}>{label}</Text>
        <Text style={[styles.fv, { color: t.teal }]}>{settings[keyName] || '—'}</Text>
      </TouchableOpacity>
    )
  );

  const StatRow = ({ label, sub, value }) => (
    <View style={[styles.frow, { borderBottomColor: t.separator }]}>
      <View style={{ flex: 1 }}><Text style={[styles.fl, { color: t.text }]}>{label}</Text>{!!sub && <Text style={[styles.fsub, { color: t.textSecondary }]}>{sub}</Text>}</View>
      <Text style={[styles.fv, { color: t.textSecondary }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: t.navy }]}>
        <Text style={styles.topTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>SESSION</Text>
          <EditRow label="Session fee" keyName="fee" />
          <StatRow label="Currency" value="Euro (€)" />
        </View>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>TEAM</Text>
          <EditRow label="Team name" keyName="team_name" />
          <EditRow label="Season" keyName="season" />
        </View>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>SPORTS</Text>
          <View style={styles.cardBody}>
            <Text style={[styles.cardNote, { color: t.textSecondary }]}>Members can be assigned to one of these sports.</Text>
            {sportsList.map(sport => (
              <View key={sport} style={[styles.sportRow, { borderColor: t.border }]}>
                <Text style={[styles.sportName, { color: t.text }]}>{sport}</Text>
                <TouchableOpacity onPress={() => removeSport(sport)}>
                  <Text style={[styles.removeBtn, { color: t.negative }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addSportRow}>
              <TextInput
                style={[styles.addSportInput, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
                value={newSport}
                onChangeText={setNewSport}
                placeholder="Add new sport..."
                placeholderTextColor={t.textTertiary}
                onSubmitEditing={addSport}
              />
              <TouchableOpacity style={[styles.addSportBtn, { backgroundColor: t.navy }]} onPress={addSport}>
                <Text style={styles.addSportBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>IMPORT MEMBERS</Text>
          <View style={styles.cardBody}>
            <View style={[styles.dropZone, { borderColor: t.borderMed, backgroundColor: t.bgSecondary }]}>
              <Text style={[styles.dropTitle, { color: t.text }]}>Import CSV file</Text>
              <Text style={[styles.dropSub, { color: t.textSecondary }]}>Required columns: first_name, last_name, balance</Text>
              <View style={[styles.codeBlock, { backgroundColor: t.bgTertiary }]}>
                <Text style={[styles.codeText, { color: t.textSecondary }]}>{'Jan,de Vries,15.00\nSara,Bakker,0.00\nRob,Kok,-8.00'}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.importBtn, { backgroundColor: t.navy }]} onPress={handleImport} activeOpacity={0.8}>
              <Text style={styles.importBtnText}>Choose CSV file...</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>EXPORT</Text>
          <StatRow label="Format" value="CSV" />
          <View style={styles.cardBody}>
            <TouchableOpacity style={[styles.exportBtn, { borderColor: '#5DCAA5' }]} onPress={handleExport} activeOpacity={0.8}>
              <Text style={[styles.exportBtnText, { color: '#0F6E56' }]}>Export member balances now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Text style={[styles.cardHead, { color: t.textSecondary, borderBottomColor: t.separator }]}>DATA</Text>
          <StatRow label="Database" sub="SQLite · local" value={formatBytes(dbSize)} />
          <StatRow label="Last export" value={settings.last_backup ? new Date(settings.last_backup).toLocaleString() : 'Never'} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scroll: { padding: 12, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 10, borderWidth: 0.5, overflow: 'hidden' },
  cardHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5 },
  cardBody: { padding: 10 },
  cardNote: { fontSize: 12, marginBottom: 10 },
  frow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  fl: { fontSize: 13 },
  fsub: { fontSize: 10, marginTop: 2 },
  fv: { fontSize: 13, fontWeight: '500' },
  inlineInput: { flex: 1, borderWidth: 0.5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, fontSize: 13, marginRight: 6 },
  inlineBtn: { marginLeft: 4 },
  inlineBtnText: { fontSize: 13, fontWeight: '500' },
  sportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, marginBottom: 4 },
  sportName: { fontSize: 13 },
  removeBtn: { fontSize: 12, fontWeight: '500' },
  addSportRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  addSportInput: { flex: 1, borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  addSportBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' },
  addSportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dropZone: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 14, marginBottom: 10 },
  dropTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dropSub: { fontSize: 11 },
  codeBlock: { borderRadius: 6, padding: 8, marginTop: 8 },
  codeText: { fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },
  importBtn: { borderRadius: 8, padding: 11, alignItems: 'center' },
  importBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  exportBtn: { borderWidth: 1, borderRadius: 8, padding: 11, alignItems: 'center' },
  exportBtnText: { fontSize: 13, fontWeight: '600' },
});
