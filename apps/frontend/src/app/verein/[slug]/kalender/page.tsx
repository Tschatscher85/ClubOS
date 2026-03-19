import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OeffentlicherKalender } from './kalender-client';

// ==================== Typen ====================

interface KalenderEvent {
  id: string;
  titel: string;
  typ: string;
  datum: string;
  endDatum: string | null;
  ort: string;
  hallenName: string | null;
  teamName: string | null;
}

interface VereinInfo {
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

interface KalenderDaten {
  verein: VereinInfo;
  monat: { start: string; ende: string };
  events: KalenderEvent[];
}

// ==================== Daten laden ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function kalenderLaden(slug: string, monat?: string): Promise<KalenderDaten | null> {
  try {
    const params = monat ? `?monat=${monat}` : '';
    const response = await fetch(`${API_BASE_URL}/homepage/public/${slug}/kalender${params}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// ==================== Metadata (SEO) ====================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const daten = await kalenderLaden(slug);

  if (!daten) {
    return { title: 'Verein nicht gefunden' };
  }

  return {
    title: `Kalender - ${daten.verein.name}`,
    description: `Vereinskalender von ${daten.verein.name} - Termine, Spiele, Training und mehr`,
  };
}

// ==================== Seite ====================

export default async function VereinsKalenderPage({ params }: PageProps) {
  const { slug } = await params;
  const daten = await kalenderLaden(slug);

  if (!daten) {
    notFound();
  }

  return (
    <OeffentlicherKalender
      verein={daten.verein}
      initialEvents={daten.events}
      initialMonat={daten.monat}
    />
  );
}
