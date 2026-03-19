// Konfigurierbare Event-Typ-Farben (gespeichert in localStorage)

export interface EventFarben {
  TRAINING: string;
  MATCH: string;
  TOURNAMENT: string;
  TRIP: string;
  MEETING: string;
  EVENT: string;
  VOLUNTEER: string;
}

export const STANDARD_FARBEN: EventFarben = {
  TRAINING: '#22c55e',     // gruen
  MATCH: '#2563eb',        // blau
  TOURNAMENT: '#9333ea',   // lila
  TRIP: '#f97316',         // orange
  MEETING: '#6b7280',      // grau
  EVENT: '#ec4899',        // pink
  VOLUNTEER: '#14b8a6',    // teal
};

export const EVENT_TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
  EVENT: 'Veranstaltung',
  VOLUNTEER: 'Helfereinsatz',
};

const STORAGE_KEY = 'clubos-event-farben';

export function getEventFarben(): EventFarben {
  if (typeof window === 'undefined') return STANDARD_FARBEN;
  try {
    const gespeichert = localStorage.getItem(STORAGE_KEY);
    if (gespeichert) {
      return { ...STANDARD_FARBEN, ...JSON.parse(gespeichert) };
    }
  } catch {}
  return STANDARD_FARBEN;
}

export function setEventFarben(farben: Partial<EventFarben>): void {
  if (typeof window === 'undefined') return;
  const aktuell = getEventFarben();
  const neu = { ...aktuell, ...farben };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(neu));
  // Custom event fuer Live-Update
  window.dispatchEvent(new CustomEvent('event-farben-changed', { detail: neu }));
}

export function getEventFarbe(typ: string): string {
  const farben = getEventFarben();
  return farben[typ as keyof EventFarben] || STANDARD_FARBEN.MEETING;
}

// Tailwind-Klasse zu Hex-Farbe fuer Inline-Styles
export function eventFarbeCss(typ: string): string {
  return getEventFarbe(typ);
}
