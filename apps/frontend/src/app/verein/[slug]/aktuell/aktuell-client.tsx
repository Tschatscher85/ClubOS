'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Info,
  Dumbbell,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ==================== Typen ====================

interface Team {
  id: string;
  name: string;
}

interface AushangItem {
  id: string;
  titel: string;
  inhalt: string;
  kategorie: 'INFO' | 'WICHTIG' | 'TRAINING' | 'AUSFALL';
  bildUrl: string | null;
  ablaufDatum: string | null;
  erstelltAm: string;
  team: Team | null;
}

interface VereinInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

interface AktuellClientProps {
  verein: VereinInfo;
  aushaenge: AushangItem[];
}

const KATEGORIE_KONFIG: Record<
  AushangItem['kategorie'],
  { label: string; borderColor: string; bgClass: string; textClass: string; icon: typeof Info }
> = {
  INFO: {
    label: 'Info',
    borderColor: 'border-l-gray-400',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-700',
    icon: Info,
  },
  WICHTIG: {
    label: 'Wichtig',
    borderColor: 'border-l-red-500',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    icon: AlertTriangle,
  },
  TRAINING: {
    label: 'Training',
    borderColor: 'border-l-blue-500',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    icon: Dumbbell,
  },
  AUSFALL: {
    label: 'Ausfall',
    borderColor: 'border-l-orange-500',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    icon: XCircle,
  },
};

// ==================== Komponente ====================

export function AktuellClient({ verein, aushaenge }: AktuellClientProps) {
  const [expandiert, setExpandiert] = useState<Record<string, boolean>>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // WICHTIG-Items zuerst, dann nach Datum sortiert
  const sortierteAushaenge = [...aushaenge].sort((a, b) => {
    if (a.kategorie === 'WICHTIG' && b.kategorie !== 'WICHTIG') return -1;
    if (a.kategorie !== 'WICHTIG' && b.kategorie === 'WICHTIG') return 1;
    return new Date(b.erstelltAm).getTime() - new Date(a.erstelltAm).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="border-b bg-white shadow-sm"
        style={{ borderBottomColor: verein.primaryColor }}
      >
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/verein/${verein.slug}`}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zur Homepage
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-3">
            {verein.logo && (
              <img
                src={`${API_BASE_URL}${verein.logo}`}
                alt={verein.name}
                className="h-14 w-14 rounded-lg object-contain"
              />
            )}
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: verein.primaryColor }}
              >
                Schwarzes Brett
              </h1>
              <p className="text-gray-500">{verein.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Inhalt */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {sortierteAushaenge.length === 0 ? (
          <div className="text-center py-16">
            <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Aktuell keine Meldungen vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortierteAushaenge.map((aushang) => {
              const konfig = KATEGORIE_KONFIG[aushang.kategorie];
              const KategorieIcon = konfig.icon;
              const istExpanded = expandiert[aushang.id] || false;
              const istWichtig = aushang.kategorie === 'WICHTIG';

              return (
                <div
                  key={aushang.id}
                  className={`rounded-lg border border-l-4 ${konfig.borderColor} ${
                    istWichtig ? 'bg-red-50 border-red-200' : 'bg-white'
                  } shadow-sm cursor-pointer transition-shadow hover:shadow-md`}
                  onClick={() =>
                    setExpandiert((prev) => ({
                      ...prev,
                      [aushang.id]: !prev[aushang.id],
                    }))
                  }
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <KategorieIcon
                            className="h-5 w-5 shrink-0"
                            style={{
                              color:
                                aushang.kategorie === 'WICHTIG'
                                  ? '#dc2626'
                                  : aushang.kategorie === 'AUSFALL'
                                    ? '#ea580c'
                                    : aushang.kategorie === 'TRAINING'
                                      ? '#2563eb'
                                      : '#6b7280',
                            }}
                          />
                          <h2 className="font-semibold text-lg">
                            {aushang.titel}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${konfig.bgClass} ${konfig.textClass}`}
                          >
                            {konfig.label}
                          </span>
                          {aushang.team && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-gray-600">
                              {aushang.team.name}
                            </span>
                          )}
                        </div>

                        {!istExpanded && (
                          <p className="text-gray-600 line-clamp-2">
                            {aushang.inhalt.replace(/<[^>]+>/g, '')}
                          </p>
                        )}

                        {istExpanded && (
                          <div className="space-y-3 mt-2">
                            <div
                              className="text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: aushang.inhalt,
                              }}
                            />
                            {aushang.bildUrl && (
                              <img
                                src={aushang.bildUrl}
                                alt={aushang.titel}
                                className="max-h-80 rounded-lg object-cover"
                              />
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          <span>
                            {new Date(aushang.erstelltAm).toLocaleDateString(
                              'de-DE',
                              {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              },
                            )}
                          </span>
                          {aushang.ablaufDatum && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Gueltig bis{' '}
                              {new Date(
                                aushang.ablaufDatum,
                              ).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {istExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="https://vereinbase.de"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: verein.primaryColor }}
            >
              Vereinbase
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
