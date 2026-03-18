import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from './stores/authStore';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { KalenderScreen } from './screens/KalenderScreen';
import { NachrichtenScreen } from './screens/NachrichtenScreen';
import { ProfilScreen } from './screens/ProfilScreen';

const Tab = createBottomTabNavigator();

function HauptNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: { paddingBottom: 4, height: 56 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Start' }}
      />
      <Tab.Screen
        name="Kalender"
        component={KalenderScreen}
        options={{ tabBarLabel: 'Termine' }}
      />
      <Tab.Screen
        name="Nachrichten"
        component={NachrichtenScreen}
        options={{ tabBarLabel: 'Nachrichten' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { token, istLadend, tokenLaden } = useAuthStore();

  useEffect(() => {
    tokenLaden();
  }, []);

  if (istLadend) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {token ? <HauptNavigation /> : <LoginScreen />}
    </NavigationContainer>
  );
}
