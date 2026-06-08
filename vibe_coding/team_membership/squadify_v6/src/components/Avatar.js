import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { avatarColors } from '../context/ThemeContext';

export default function Avatar({ firstName = '', lastName = '', memberId = 0, size = 36 }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = avatarColors(memberId);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text, fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600' },
});
