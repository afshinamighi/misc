import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAllMembers, getAllSettings } from '../db/database';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';
import { formatCurrency } from '../utils/format';

export default function SquadScreen({ navigation }) {
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState({ team_name: 'My Team', fee: '5.00' });

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([getAllMembers(), getAllSettings()]);
    setMembers(m);
    setSettings(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const poolBalance = members.reduce((sum, m) => sum + (parseFloat(m.balance) || 0), 0);
  const inDebt = members.filter(m => parseFloat(m.balance) < 0).length;

  const renderMember = ({ item }) => {
    const isNeg = parseFloat(item.balance) < 0;
    return (
      <TouchableOpacity
        style={[styles.row, { borderColor: theme.border, backgroundColor: theme.cardBg }]}
        onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
        activeOpacity={0.7}
      >
        <Avatar firstName={item.first_name} lastName={item.last_name} memberId={item.id} size={36} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: isNeg ? theme.negative : theme.text }]}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {item.sport || 'No sport assigned'}
          </Text>
        </View>
        <Text style={[styles.balance, { color: isNeg ? theme.negative : theme.positive }]}>
          {formatCurrency(item.balance)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <Text style={styles.topTitle}>Squad</Text>
        <Text style={styles.topSub}>{settings.team_name} · {members.length} members</Text>
      </View>
      <View style={styles.statsRow}>
        <StatCard value={formatCurrency(poolBalance)} label="Pool balance" valueColor={poolBalance < 0 ? theme.negative : theme.positive} />
        <StatCard value={String(inDebt)} label="In debt" valueColor={inDebt > 0 ? theme.negative : theme.text} />
        <StatCard value={`€${parseFloat(settings.fee || 5).toFixed(2)}`} label="Session fee" />
      </View>
      <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>MEMBERS</Text>
      <FlatList
        data={members}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderMember}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No members yet. Add your first member below.</Text>
        }
      />
      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.navy }]} onPress={() => navigation.navigate('AddMember')} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add member</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  topSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, padding: 12 },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 0.5, marginBottom: 6 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500' },
  sub: { fontSize: 11, marginTop: 1 },
  balance: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 14 },
  footer: { padding: 12, borderTopWidth: 0.5 },
  addBtn: { borderRadius: 8, padding: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
