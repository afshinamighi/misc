import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { parseCSV } from '../utils/csv';
import { upsertMemberByName } from '../db/database';
import { formatCurrency } from '../utils/format';

export default function ImportPreviewScreen({ route, navigation }) {
  const theme = useTheme();
  const { csvText, fileName } = route.params;
  const [rows, setRows] = useState([]);

  useEffect(() => { setRows(parseCSV(csvText)); }, [csvText]);

  const handleConfirm = async () => {
    if (rows.length === 0) { Alert.alert('No data', 'No valid rows found in the file.'); return; }
    try {
      for (const row of rows) await upsertMemberByName(row);
      Alert.alert('Import complete', `${rows.length} member(s) imported successfully.`, [
        { text: 'OK', onPress: () => navigation.navigate('SettingsMain') },
      ]);
    } catch (e) {
      Alert.alert('Import error', e.message || 'Something went wrong.');
    }
  };

  const renderRow = ({ item, index }) => {
    const isNeg = parseFloat(item.balance) < 0;
    return (
      <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
        <Avatar firstName={item.first_name} lastName={item.last_name} memberId={index} size={34} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: isNeg ? theme.negative : theme.text }]}>{item.first_name} {item.last_name}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Imported</Text>
        </View>
        <Text style={[styles.balance, { color: isNeg ? theme.negative : theme.positive }]}>{formatCurrency(item.balance)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Settings</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Import preview</Text>
        <Text style={styles.topSub}>{fileName} · {rows.length} rows found</Text>
      </View>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: theme.posBg }]}>
          <Text style={[styles.badgeText, { color: theme.posText }]}>{rows.length} valid rows</Text>
        </View>
        <Text style={[styles.badgeNote, { color: theme.textSecondary }]}>Existing members will be updated</Text>
      </View>
      <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>PREVIEW</Text>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={renderRow}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No valid rows found. Check the file format.</Text>}
      />
      <View style={[styles.infoCard, { backgroundColor: theme.bgSecondary, borderColor: theme.border }]}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Stored fields per member</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>id · first_name · last_name · sport · position · balance · created_at · updated_at</Text>
      </View>
      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.navy }]} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={styles.confirmBtnText}>Confirm import to database</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  backBtn: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  topSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeNote: { fontSize: 11 },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 8 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, borderWidth: 0.5, marginBottom: 6 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '500' },
  sub: { fontSize: 10, marginTop: 1 },
  balance: { fontSize: 13, fontWeight: '600' },
  infoCard: { margin: 12, borderRadius: 8, borderWidth: 0.5, padding: 10 },
  infoLabel: { fontSize: 10, marginBottom: 5 },
  infoValue: { fontSize: 11, lineHeight: 18 },
  footer: { padding: 12, borderTopWidth: 0.5 },
  confirmBtn: { borderRadius: 8, padding: 13, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
