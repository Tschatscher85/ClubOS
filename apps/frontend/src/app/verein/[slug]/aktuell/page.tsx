import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AktuellClient } from './aktuell-client';

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

interface AktuellDaten {
  verein: VereinInfo;
  aushaenge: AushangItem[];
}

// ==================== Daten laden ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function aushaengeLaden(slug: string): Promise<AktuellDaten | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/homepage/public/${slug}/aktuell`, {
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
  const daten = await aushaengeLaden(slug);

  if (!daten) {
    return { title: 'Verein nicht gefunden' };
  }

  return {
    title: `Aktuelles - ${daten.verein.name}`,
    description: `Aktuelle Meldungen und Aushaenge von ${daten.verein.name}`,
  };
}

// ==================== Seite ====================

export default async function AktuellPage({ params }: PageProps) {
  const { slug } = await params;
  const daten = await aushaengeLaden(slug);

  if (!daten) {
    notFound();
  }

  return (
    <AktuellClient
      verein={daten.verein}
      aushaenge={daten.aushaenge}
    />
  );
}
