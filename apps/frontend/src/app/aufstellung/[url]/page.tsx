'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== Typen ====================

interface MitgliedInfo {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  rolle: string;
  member: MitgliedInfo;
}

interface AufstellungOeffentlich {
  id: string;
  name: string;
  formation: string;
  positionen: Record<string, string>;
  erstelltAm: string;
  team: {
    name: string;
    sport: string;
    ageGroup: string;
    teamMembers: TeamMitglied[];
  };
}

// ==================== Formation-Definitionen ====================

interface PositionDefinition {
  key: string;
  label: string;
  kurzLabel: string;
  row: number;
  col: number;
}

const FORMATIONEN: Record<string, { label: string; positionen: PositionDefinition[] }> = {
  '4-3-3': {
    label: '4-3-3',
    positionen: [
      { key: 'LF', label: 'Linker Fluegel', kurzLabel: 'LF', row: 0, col: 0 },
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'RF', label: 'Rechter Fluegel', kurzLabel: 'RF', row: 0, col: 4 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM', label: 'Zentrales Mittelfeld', kurzLabel: 'ZM', row: 1, col: 2 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 2, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '4-4-2': {
    label: '4-4-2',
    positionen: [
      { key: 'LS', label: 'Linker Stuermer', kurzLabel: 'LS', row: 0, col: 1 },
      { key: 'RS', label: 'Rechter Stuermer', kurzLabel: 'RS', row: 0, col: 3 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 2, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positionen: [
      { key: 'LS', label: 'Linker Stuermer', kurzLabel: 'LS', row: 0, col: 1 },
      { key: 'RS', label: 'Rechter Stuermer', kurzLabel: 'RS', row: 0, col: 3 },
      { key: 'LA', label: 'Linkes Aussen', kurzLabel: 'LA', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 2 },
      { key: 'ZM3', label: 'Zentrales Mittelfeld 3', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RA', label: 'Rechtes Aussen', kurzLabel: 'RA', row: 1, col: 4 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 0 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 2 },
      { key: 'IV3', label: 'Innenverteidiger 3', kurzLabel: 'IV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positionen: [
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'LA', label: 'Links Offensiv', kurzLabel: 'LA', row: 1, col: 0 },
      { key: 'ZOM', label: 'Zentraler Offensiver', kurzLabel: 'ZOM', row: 1, col: 2 },
      { key: 'RA', label: 'Rechts Offensiv', kurzLabel: 'RA', row: 1, col: 4 },
      { key: 'ZDM1', label: 'Defensives Mittelfeld 1', kurzLabel: 'ZDM', row: 2, col: 1 },
      { key: 'ZDM2', label: 'Defensives Mittelfeld 2', kurzLabel: 'ZDM', row: 2, col: 3 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 3, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 3, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 3, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 3, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 4, col: 2 },
    ],
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    positionen: [
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'ZDM', label: 'Defensives Mittelfeld', kurzLabel: 'ZDM', row: 2, col: 2 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 3, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 3, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 3, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 3, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 4, col: 2 },
    ],
  },
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== Seite ====================

export default function AufstellungOeffentlichPage() {
  const params = useParams();
  const url = params.url as string;

  const [aufstellung, setAufstellung] = useState<AufstellungOeffentlich | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    async function laden() {
      try {
        const response = await fetch(`${API_BASE_URL}/aufstellungen/p/${url}`);
        if (!response.ok) throw new Error('Nicht gefunden');
        const daten = await response.json();
        setAufstellung(daten);
      } catch {
        setFehler(true);
      } finally {
        setLadend(false);
      }
    }
    laden();
  }, [url]);

  if (ladend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-500">Aufstellung wird geladen...</div>
      </div>
    );
  }

  if (fehler || !aufstellung) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Aufstellung nicht gefunden
          </h1>
          <p className="text-gray-500">
            Der Link ist ungueltig oder die Aufstellung wurde geloescht.
          </p>
        </div>
      </div>
    );
  }

  const formationDef = FORMATIONEN[aufstellung.formation];
  const maxRow = formationDef ? Math.max(...formationDef.positionen.map((p) => p.row)) : 3;
  const rows = maxRow + 1;

  const spielerMap = new Map(
    aufstellung.team.teamMembers.map((s) => [s.memberId, s]),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {aufstellung.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {aufstellung.team.name} &middot; {aufstellung.formation} &middot; {formatDatum(aufstellung.erstelltAm)}
          </p>
        </div>

        {/* Spielfeld */}
        {formationDef && (
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-lg"
            style={{
              background: 'linear-gradient(to bottom, #1a8c2e, #15701f)',
              minHeight: rows * 110 + 40,
            }}
          >
            {/* Spielfeld-Linien */}
            <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
            <div className="absolute left-4 right-4 top-1/2 -translate-y-px h-0.5 bg-white/30" />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute left-1/2 -translate-x-1/2 top-4 w-48 h-16 border-2 border-t-0 border-white/20 rounded-b-lg" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-48 h-16 border-2 border-b-0 border-white/20 rounded-t-lg" />

            <div
              className="relative p-6"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${rows}, 100px)`,
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
            >
              {formationDef.positionen.map((pos) => {
                const gewaehlterSpielerId = aufstellung.positionen[pos.key] || '';
                const gewaehlterSpieler = gewaehlterSpielerId
                  ? spielerMap.get(gewaehlterSpielerId)
                  : undefined;

                return (
                  <div
                    key={pos.key}
                    style={{
                      gridRow: pos.row + 1,
                      gridColumn: pos.col + 1,
                    }}
                    className="flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                          gewaehlterSpieler
                            ? 'bg-white text-green-800'
                            : 'bg-white/20 text-white border-2 border-dashed border-white/50'
                        }`}
                      >
                        {pos.kurzLabel}
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-white font-medium drop-shadow">
                          {gewaehlterSpieler
                            ? `${gewaehlterSpieler.member.firstName.charAt(0)}. ${gewaehlterSpieler.member.lastName}`
                            : '-'}
                        </span>
                        {gewaehlterSpieler && (
                          <span className="block text-[10px] text-white/70">
                            #{gewaehlterSpieler.member.memberNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          Erstellt mit Vereinbase
        </div>
      </div>
    </div>
  );
}
