'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Shield,
  Trophy,
  Calendar,
  Dumbbell,
  Building,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

// ==================== Typen ====================

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  gruendungsjahr: number | null;
}

interface Statistiken {
  mitglieder: number;
  teams: number;
  sportarten: number;
  eventsImJahr: number;
  turniereImJahr: number;
  gruendungsjahr: number | null;
}

interface StatKarte {
  label: string;
  wert: string | number;
  icon: React.ElementType;
  beschreibung: string;
}

// ==================== Seite ====================

export default function StatistikenPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [statistiken, setStatistiken] = useState<Statistiken | null>(null);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    const laden_ = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/homepage/public/${slug}/statistiken`,
        );
        if (!res.ok) throw new Error('Nicht gefunden');
        const data = await res.json();
        setTenant(data.tenant);
        setStatistiken(data.statistiken);
      } catch {
        setFehler(true);
      } finally {
        setLaden(false);
      }
    };
    laden_();
  }, [slug]);

  if (laden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    );
  }

  if (fehler || !tenant || !statistiken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Verein nicht gefunden
          </h1>
          <p className="text-gray-500">
            Die Statistiken konnten nicht geladen werden.
          </p>
        </div>
      </div>
    );
  }

  const primaerFarbe = tenant.primaryColor || '#1a56db';

  const karten: StatKarte[] = [
    {
      label: 'Mitglieder',
      wert: statistiken.mitglieder,
      icon: Users,
      beschreibung: 'Aktive Vereinsmitglieder',
    },
    {
      label: 'Teams',
      wert: statistiken.teams,
      icon: Shield,
      beschreibung: 'Mannschaften & Gruppen',
    },
    {
      label: 'Sportarten',
      wert: statistiken.sportarten,
      icon: Dumbbell,
      beschreibung: 'Verschiedene Sportarten',
    },
    {
      label: 'Veranstaltungen',
      wert: statistiken.eventsImJahr,
      icon: Calendar,
      beschreibung: `In ${new Date().getFullYear()}`,
    },
    {
      label: 'Turniere',
      wert: statistiken.turniereImJahr,
      icon: Trophy,
      beschreibung: `In ${new Date().getFullYear()}`,
    },
  ];

  if (statistiken.gruendungsjahr) {
    karten.push({
      label: 'Gruendungsjahr',
      wert: statistiken.gruendungsjahr,
      icon: Building,
      beschreibung: `Seit ${new Date().getFullYear() - statistiken.gruendungsjahr} Jahren`,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="py-20 px-4"
        style={{ backgroundColor: primaerFarbe }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          {tenant.logo && (
            <img
              src={`${API_BASE_URL}${tenant.logo}`}
              alt={tenant.name}
              className="h-20 w-20 mx-auto mb-6 rounded-full bg-white/20 object-contain p-1"
            />
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            {tenant.name}
          </h1>
          <p className="text-xl text-white/80">Unser Verein in Zahlen</p>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="max-w-5xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {karten.map((karte) => {
            const Icon = karte.icon;
            return (
              <div
                key={karte.label}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center hover:shadow-xl transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primaerFarbe}15` }}
                >
                  <Icon
                    className="h-7 w-7"
                    style={{ color: primaerFarbe }}
                  />
                </div>
                <div
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ color: primaerFarbe }}
                >
                  {karte.wert}
                </div>
                <div className="text-base font-semibold text-gray-800 mb-1">
                  {karte.label}
                </div>
                <div className="text-sm text-gray-500">
                  {karte.beschreibung}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vereinshomepage Link */}
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <a
          href={`/verein/${tenant.slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaerFarbe }}
        >
          Zur Vereinshomepage
        </a>
      </div>

      {/* Footer */}
      <div className="text-center py-10 mt-8 text-gray-400 text-sm">
        Powered by{' '}
        <a
          href="https://vereinbase.de"
          className="font-medium hover:text-gray-600"
        >
          Vereinbase
        </a>
      </div>
    </div>
  );
}
