import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import api from '../lib/api';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  hallName?: string;
  team?: { name: string };
}

const TYP_FARBEN: Record<string, string> = {
  TRAINING: '#3b82f6',
  MATCH: '#ef4444',
  TOURNAMENT: '#f59e0b',
  TRIP: '#10b981',
  MEETING: '#8b5cf6',
};

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

export function KalenderScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ladend, setLadend] = useState(false);

  const laden = async () => {
    setLadend(true);
    try {
      const res = await api.get('/veranstaltungen/kommende');
      setEvents(res.data);
    } catch {
      // Ignorieren
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => { laden(); }, []);

  const datumFormatieren = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={ladend} onRefresh={laden} />}
    >
      <Text style={styles.titel}>Naechste Termine</Text>

      {events.length === 0 && !ladend && (
        <Text style={styles.leer}>Keine anstehenden Termine.</Text>
      )}

      {events.map((event) => (
        <TouchableOpacity key={event.id} style={styles.eventKarte}>
          <View style={[styles.typBadge, { backgroundColor: TYP_FARBEN[event.type] || '#6b7280' }]}>
            <Text style={styles.typText}>{TYP_LABEL[event.type] || event.type}</Text>
          </View>
          <Text style={styles.eventTitel}>{event.title}</Text>
          <Text style={styles.eventDatum}>{datumFormatieren(event.date)}</Text>
          <Text style={styles.eventOrt}>
            {event.hallName || event.location}
          </Text>
          {event.team && (
            <Text style={styles.eventTeam}>{event.team.name}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  titel: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  leer: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  eventKarte: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  typBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 8,
  },
  typText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  eventTitel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  eventDatum: { fontSize: 13, color: '#64748b', marginTop: 4 },
  eventOrt: { fontSize: 13, color: '#64748b', marginTop: 2 },
  eventTeam: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
