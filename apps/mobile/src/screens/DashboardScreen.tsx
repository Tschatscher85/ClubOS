import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Statistik {
  gesamt: number;
  aktiv: number;
  ausstehend: number;
  teams: number;
}

export function DashboardScreen() {
  const { benutzer, tenant } = useAuthStore();
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [ladend, setLadend] = useState(false);

  const laden = async () => {
    setLadend(true);
    try {
      const res = await api.get('/mitglieder/statistik');
      setStatistik(res.data);
    } catch {
      // Ignorieren
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => { laden(); }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={ladend} onRefresh={laden} />}
    >
      <Text style={styles.vereinsname}>{tenant?.name || 'Vereinbase'}</Text>
      <Text style={styles.willkommen}>
        Willkommen, {benutzer?.email}
      </Text>

      <View style={styles.kartenRow}>
        <View style={[styles.karte, { backgroundColor: '#dbeafe' }]}>
          <Text style={styles.karteZahl}>{statistik?.gesamt ?? '-'}</Text>
          <Text style={styles.karteLabel}>Mitglieder</Text>
        </View>
        <View style={[styles.karte, { backgroundColor: '#dcfce7' }]}>
          <Text style={styles.karteZahl}>{statistik?.aktiv ?? '-'}</Text>
          <Text style={styles.karteLabel}>Aktiv</Text>
        </View>
      </View>
      <View style={styles.kartenRow}>
        <View style={[styles.karte, { backgroundColor: '#fef3c7' }]}>
          <Text style={styles.karteZahl}>{statistik?.ausstehend ?? '-'}</Text>
          <Text style={styles.karteLabel}>Ausstehend</Text>
        </View>
        <View style={[styles.karte, { backgroundColor: '#f3e8ff' }]}>
          <Text style={styles.karteZahl}>{statistik?.teams ?? '-'}</Text>
          <Text style={styles.karteLabel}>Teams</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  vereinsname: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  willkommen: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  kartenRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  karte: {
    flex: 1, borderRadius: 12, padding: 20, alignItems: 'center',
  },
  karteZahl: { fontSize: 32, fontWeight: '700', color: '#1e293b' },
  karteLabel: { fontSize: 13, color: '#475569', marginTop: 4 },
});
