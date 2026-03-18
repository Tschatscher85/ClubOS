import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/authStore';

const ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin / Vorstand',
  TRAINER: 'Trainer',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
};

export function ProfilScreen() {
  const { benutzer, tenant, abmelden } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {benutzer?.email?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>

      <Text style={styles.email}>{benutzer?.email}</Text>
      <Text style={styles.rolle}>
        {ROLLEN_LABEL[benutzer?.rolle || ''] || benutzer?.rolle}
      </Text>
      <Text style={styles.verein}>{tenant?.name}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={abmelden}>
        <Text style={styles.logoutText}>Abmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', paddingTop: 60 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a56db',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  email: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  rolle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  verein: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  logoutBtn: {
    marginTop: 40, backgroundColor: '#fee2e2', borderRadius: 8,
    paddingHorizontal: 32, paddingVertical: 12,
  },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 16 },
});
