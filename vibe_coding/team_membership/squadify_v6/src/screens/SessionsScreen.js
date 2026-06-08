import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAllSessions, getSessionStats, getOverallSessionStats, getAllSettings } from '../db/database';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDateDisplay } from '../utils/format';

export default function SessionsScreen({ navigation }) {
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [overallStats, setOverallStats] = useState({ totalSessions: 0, avgAttendance: 0, totalCollected: 0 });
  const [settings, setSettings] = useState({ season: 'Season 1' });

  const load = useCallback(async () => {
    const [s, o, cfg] = await Promise.all([getAllSessions(), getOverallSessionStats(), getAllSettings()]);
    setSessions(s);
    setOverallStats(o);
    setSettings(cfg);
    const statsMap = {};
    for (const session of s) { statsMap[session.id] = await getSessionStats(session.id); }
    setSessionStats(statsMap);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderSession = ({ item }) => {
    const stats = sessionStats[item.id] || { present: 0, absent: 0, deducted: 0 };
    const displayName = item.name || `Session · ${formatDateDisplay(item.date)}`;
    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => navigation.navigate('EditSession', { sessionId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.sessionTop}>
          <View style={styles.sessionLeft}>
            <Text style={[styles.sessionTitle, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.sessionMeta, { color: theme.textSecondary }]}>
              {formatDateDisplay(item.date)}{item.location ? ` · ${item.location}` : ''}
            </Text>
          </View>
          <View style={styles.rightCol}>
            <View style={[styles.savedBadge, { backgroundColor: theme.posBg }]}>
              <Text style={[styles.savedBadgeText, { color: theme.posText }]}>Saved</Text>
            </View>
            <Text style={[styles.editHint, { color: theme.teal }]}>Tap to edit</Text>
          </View>
        </View>
        <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
          <View style={styles.ss}>
            <Text style={[styles.ssNum, { color: theme.positive }]}>{stats.present}</Text>
            <Text style={[styles.ssLabel, { color: theme.textSecondary }]}>Present</Text>
          </View>
          <View style={[styles.ssDivider, { backgroundColor: theme.border }]} />
          <View style={styles.ss}>
            <Text style={[styles.ssNum, { color: stats.absent > 0 ? theme.negative : theme.text }]}>{stats.absent}</Text>
            <Text style={[styles.ssLabel, { color: theme.textSecondary }]}>Absent</Text>
          </View>
          <View style={[styles.ssDivider, { backgroundColor: theme.border }]} />
          <View style={styles.ss}>
            <Text style={[styles.ssNum, { color: theme.text }]}>{formatCurrency(stats.deducted)}</Text>
            <Text style={[styles.ssLabel, { color: theme.textSecondary }]}>Deducted</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: theme.navy }]}>
        <Text style={styles.topTitle}>Sessions</Text>
        <Text style={styles.topSub}>{settings.season} · {overallStats.totalSessions} sessions</Text>
      </View>
      <View style={styles.statsRow2}>
        <StatCard value={String(overallStats.totalSessions)} label="Total" />
        <StatCard value={`${overallStats.avgAttendance}%`} label="Avg. att." valueColor={theme.positive} />
        <StatCard value={formatCurrency(overallStats.totalCollected)} label="Collected" />
      </View>
      <Text style={[styles.sectionHead, { color: theme.textSecondary }]}>SESSIONS</Text>
      <FlatList
        data={sessions}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderSession}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No sessions yet. Create your first session below.</Text>}
      />
      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.navy }]} onPress={() => navigation.navigate('NewSession')} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ New session</Text>
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
  statsRow2: { flexDirection: 'row', gap: 8, padding: 12 },
  sectionHead: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 8 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 14 },
  sessionCard: { borderRadius: 10, borderWidth: 0.5, marginBottom: 10, overflow: 'hidden' },
  sessionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 12, paddingBottom: 10 },
  sessionLeft: { flex: 1 },
  sessionTitle: { fontSize: 13, fontWeight: '600' },
  sessionMeta: { fontSize: 11, marginTop: 3 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  savedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  savedBadgeText: { fontSize: 10, fontWeight: '500' },
  editHint: { fontSize: 10 },
  statsRow: { flexDirection: 'row', borderTopWidth: 0.5, paddingVertical: 10 },
  ss: { flex: 1, alignItems: 'center' },
  ssNum: { fontSize: 16, fontWeight: '600' },
  ssLabel: { fontSize: 9, marginTop: 2 },
  ssDivider: { width: 0.5, marginVertical: 4 },
  footer: { padding: 12, borderTopWidth: 0.5 },
  addBtn: { borderRadius: 8, padding: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
