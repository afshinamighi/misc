import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { initDB } from './src/db/database';

import SquadScreen from './src/screens/SquadScreen';
import AddMemberScreen from './src/screens/AddMemberScreen';
import MemberDetailScreen from './src/screens/MemberDetailScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import NewSessionScreen from './src/screens/NewSessionScreen';
import EditSessionScreen from './src/screens/EditSessionScreen';
import BalanceScreen from './src/screens/BalanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ImportPreviewScreen from './src/screens/ImportPreviewScreen';

import { SquadIcon, SessionsIcon, BalanceIcon, SettingsIcon } from './src/components/TabBarIcon';

const Tab = createBottomTabNavigator();
const SquadStack = createNativeStackNavigator();
const SessionsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function SquadStackNav() {
  return (
    <SquadStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadStack.Screen name="SquadMain" component={SquadScreen} />
      <SquadStack.Screen name="AddMember" component={AddMemberScreen} />
      <SquadStack.Screen name="MemberDetail" component={MemberDetailScreen} />
    </SquadStack.Navigator>
  );
}

function SessionsStackNav() {
  return (
    <SessionsStack.Navigator screenOptions={{ headerShown: false }}>
      <SessionsStack.Screen name="SessionsMain" component={SessionsScreen} />
      <SessionsStack.Screen name="NewSession" component={NewSessionScreen} />
      <SessionsStack.Screen name="EditSession" component={EditSessionScreen} />
    </SessionsStack.Navigator>
  );
}

function SettingsStackNav() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="ImportPreview" component={ImportPreviewScreen} />
    </SettingsStack.Navigator>
  );
}

function AppTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: '#1a9e75',
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Squad"
        component={SquadStackNav}
        options={{ tabBarIcon: ({ color }) => <SquadIcon color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsStackNav}
        options={{ tabBarIcon: ({ color }) => <SessionsIcon color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Balance"
        component={BalanceScreen}
        options={{ tabBarIcon: ({ color }) => <BalanceIcon color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNav}
        options={{ tabBarIcon: ({ color }) => <SettingsIcon color={color} size={22} /> }}
      />
    </Tab.Navigator>
  );
}

function AppInner() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(e => { console.error('DB init failed:', e); setReady(true); });
  }, []);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: '#1a1a2e' }]}>
        <ActivityIndicator color="#1a9e75" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <AppTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
