import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ value, label, valueColor }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.bgSecondary }]}>
      <Text style={[styles.value, { color: valueColor || theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '600' },
  label: { fontSize: 10, marginTop: 2, textAlign: 'center' },
});
