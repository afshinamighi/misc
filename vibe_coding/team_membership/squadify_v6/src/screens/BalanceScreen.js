import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAllMembers, adjustMemberBalance, getSetting } from '../db/database';
import Avatar from '../components/Avatar';
import { formatCurrency } from '../utils/format';

export default function BalanceScreen() {
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [fee, setFee] = useState(5);

  const load = useCallback(async () => {
    const [m, f] = await Promise.all([getAllMembers(), getSetting('fee')]);
    setMembers(m);
    setFiltered(m);
    setFee(parseFloat(f) || 5);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSearch = text => {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(members.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)));
  };

  const applyAdjustment = async (memberId, delta) => {
    if (isNaN(delta) || delta === 0) { Alert.alert('Invalid amount', 'Enter a valid amount.'); return; }
    await adjustMemberBalance(memberId, delta);
    await load();
    setAmount('');
    setSelectedId(null);
  };

  const handleBulkAdd = () => {
    if (!selectedId) { Alert.alert('No member selected', 'Tap a member row to select them first.'); return; }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { Alert.alert('Invalid amount', 'Enter a positive amount.'); return; }
    applyAdjustment(selectedId, val);
  };

  const handleBulkDed = () => {
    if (!selectedId) { Alert.alert('No member selected', 'Tap a member row to select them first.'); return; }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { Alert.alert('Invalid amount', 'Enter a positive amount.'); return; }
    applyAdjustment(selectedId, -val);
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];
  const selectedMember = members.find(m => m.id === selectedId);

  const renderMember = ({ item }) => {
    const isNeg = parseFloat(item.balance) < 0;
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        style={[styles.memberRow, { borderColor: isSelected ? theme.teal : theme.border, backgroundColor: theme.cardBg }, isSelected && { borderWidth: 1.5 }]}
        onPress={() => setSelectedId(isSelected ? null : item.id)}
        activeOpacity={0.7}
      >
        <Avatar firstName={item.first_name} lastName={item.last_name} memberId={item.id} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: isNeg ? theme.negative : theme.text }]} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
          {!!item.sport && <Text style={[styles.sport, { color: theme.textSecondary }]}>{item.sport}</Text>}
        </View>
        <Text style={[styles.balance, { color: isNeg ? theme.negative : theme.positive }]}>{formatCurrency(item.balance)}</Text>
        <View style={styles.adjBtns}>
          <TouchableOpacity style={[styles.adjBtn, { borderColor: theme.borderMed, backgroundColor: theme.bgSecondary }]} onPress={() => applyAdjustment(item.id, fee)}>
            <Text style={[styles.adjBtnText, { color: theme.positive }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjBtn, { borderColor: theme.borderMed, backgroundColor: theme.bgSecondary }]} onPress={() => applyAdjustment(item.id, -fee)}>
            <Text style={[styles.adjBtnText, { color: theme.negative }]}>−</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <Text style={styles.topTitle}>Balance</Text>
        <Text style={styles.topSub}>Manual adjustments</Text>
      </View>
      <View style={styles.controls}>
        <TextInput style={[inputStyle, { marginBottom: 8 }]} value={search} onChangeText={handleSearch} placeholder="Search member..." placeholderTextColor={theme.textTertiary} />
        {selectedMember && <Text style={[styles.selectedLabel, { color: theme.teal }]}>Selected: {selectedMember.first_name} {selectedMember.last_name}</Text>}
        <View style={styles.amountRow}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={amount} onChangeText={setAmount} placeholder="Amount (€)" placeholderTextColor={theme.textTertiary} keyboardType="numeric" />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#E1F5EE' }]} onPress={handleBulkAdd}>
            <Text style={[styles.addBtnText, { color: '#085041' }]}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#FCEBEB' }]} onPress={handleBulkDed}>
            <Text style={[styles.addBtnText, { color: '#791F1F' }]}>− Ded.</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>ALL MEMBERS</Text>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderMember}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No members found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  topSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  controls: { padding: 12 },
  input: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13 },
  selectedLabel: { fontSize: 11, fontWeight: '500', marginBottom: 6 },
  amountRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 16 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 13 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, borderWidth: 0.5, marginBottom: 6 },
  name: { fontSize: 13, fontWeight: '500' },
  sport: { fontSize: 10, marginTop: 1 },
  balance: { fontSize: 13, fontWeight: '600', marginRight: 6 },
  adjBtns: { flexDirection: 'row', gap: 4 },
  adjBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  adjBtnText: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
});
