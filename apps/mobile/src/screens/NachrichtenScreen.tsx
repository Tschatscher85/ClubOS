import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import api from '../lib/api';

interface Nachricht {
  id: string;
  content: string;
  type: string;
  isEmergency: boolean;
  createdAt: string;
  senderId: string;
}

export function NachrichtenScreen() {
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [ladend, setLadend] = useState(false);
  const [reaktionen, setReaktionen] = useState<Record<string, string>>({});

  const laden = async () => {
    setLadend(true);
    try {
      const res = await api.get('/nachrichten');
      setNachrichten(res.data);
    } catch {
      // Ignorieren
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => { laden(); }, []);

  const reagieren = async (nachrichtId: string, reaktion: string) => {
    try {
      await api.post(`/nachrichten/${nachrichtId}/reaktion`, { reaktion });
      setReaktionen((prev) => ({ ...prev, [nachrichtId]: reaktion }));
    } catch {
      // Ignorieren
    }
  };

  const datumFormatieren = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={ladend} onRefresh={laden} />}
    >
      <Text style={styles.titel}>Nachrichten</Text>

      {nachrichten.length === 0 && !ladend && (
        <Text style={styles.leer}>Keine Nachrichten.</Text>
      )}

      {nachrichten.map((n) => (
        <View
          key={n.id}
          style={[styles.karte, n.isEmergency && styles.notfall]}
        >
          {n.isEmergency && (
            <Text style={styles.notfallBadge}>DRINGEND</Text>
          )}
          <Text style={styles.inhalt}>{n.content}</Text>
          <Text style={styles.datum}>{datumFormatieren(n.createdAt)}</Text>

          <View style={styles.reaktionRow}>
            {['JA', 'NEIN', 'VIELLEICHT'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.reaktionBtn,
                  reaktionen[n.id] === r && styles.reaktionAktiv,
                ]}
                onPress={() => reagieren(n.id, r)}
              >
                <Text
                  style={[
                    styles.reaktionText,
                    reaktionen[n.id] === r && styles.reaktionTextAktiv,
                  ]}
                >
                  {r === 'JA' ? 'Ja' : r === 'NEIN' ? 'Nein' : 'Vielleicht'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  titel: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  leer: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  karte: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  notfall: { borderWidth: 2, borderColor: '#dc2626' },
  notfallBadge: {
    color: '#dc2626', fontSize: 11, fontWeight: '700',
    backgroundColor: '#fef2f2', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 8,
  },
  inhalt: { fontSize: 15, color: '#1e293b', lineHeight: 22 },
  datum: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  reaktionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reaktionBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  reaktionAktiv: { borderColor: '#1a56db', backgroundColor: '#dbeafe' },
  reaktionText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  reaktionTextAktiv: { color: '#1a56db' },
});
