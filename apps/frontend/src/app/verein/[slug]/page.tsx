import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicNavigation } from '@/components/public/PublicNavigation';
import { HeroSektion } from '@/components/public/HeroSektion';
import { TextSektion } from '@/components/public/TextSektion';
import { TeamsSektion } from '@/components/public/TeamsSektion';
import { TermineSektion } from '@/components/public/TermineSektion';
import { KontaktSektion } from '@/components/public/KontaktSektion';
import { SponsorenSektion } from '@/components/public/SponsorenSektion';
import { PublicFooter } from '@/components/public/PublicFooter';

// ==================== Typen ====================

interface HomepageSektion {
  id: string;
  typ: string;
  titel: string | null;
  inhalt: string | null;
  bildUrl: string | null;
  reihenfolge: number;
  istSichtbar: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  webseite: string | null;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  abteilung?: { name: string; sport: string } | null;
}

interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  team: { name: string; sport: string } | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  email: string | null;
  telefon: string | null;
  anschrift: string | null;
  plz: string | null;
  ort: string | null;
  teams: Team[];
  sponsoren: Sponsor[];
}

interface HomepageData {
  id: string;
  tenantId: string;
  istAktiv: boolean;
  heroTitel: string | null;
  heroUntertitel: string | null;
  heroBildUrl: string | null;
  ueberUns: string | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  kontaktAdresse: string | null;
  oeffnungszeiten: string | null;
  impressum: string | null;
  datenschutz: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialYoutube: string | null;
  footerText: string | null;
  seoTitel: string | null;
  seoBeschreibung: string | null;
  mitgliederAnzahl: number | null;
  sektionen: HomepageSektion[];
  tenant: Tenant;
  events: EventItem[];
}

// ==================== Daten laden ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function homepageLaden(slug: string): Promise<HomepageData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/homepage/public/${slug}`, {
      next: { revalidate: 60 }, // ISR: alle 60 Sekunden neu validieren
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
  const daten = await homepageLaden(slug);

  if (!daten) {
    return {
      title: 'Verein nicht gefunden',
    };
  }

  const vereinsname = daten.tenant.name;
  const titel = daten.seoTitel || `${vereinsname} — Willkommen`;
  const beschreibung =
    daten.seoBeschreibung || `${vereinsname} — Ihr Sportverein`;

  return {
    title: titel,
    description: beschreibung,
    openGraph: {
      title: titel,
      description: beschreibung,
      type: 'website',
      ...(daten.heroBildUrl && { images: [{ url: daten.heroBildUrl }] }),
    },
  };
}

// ==================== Sektions-Renderer ====================

function SektionRenderer({
  sektion,
  homepage,
}: {
  sektion: HomepageSektion;
  homepage: HomepageData;
}) {
  const primaryColor = homepage.tenant.primaryColor;

  switch (sektion.typ) {
    case 'HERO':
      return (
        <HeroSektion
          titel={homepage.heroTitel || sektion.titel}
          untertitel={homepage.heroUntertitel}
          bildUrl={homepage.heroBildUrl || sektion.bildUrl}
          primaryColor={primaryColor}
          vereinsname={homepage.tenant.name}
          mitgliederAnzahl={homepage.mitgliederAnzahl}
          slug={homepage.tenant.slug}
        />
      );

    case 'UEBER_UNS':
      return (
        <TextSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={homepage.ueberUns || sektion.inhalt}
          primaryColor={primaryColor}
        />
      );

    case 'MANNSCHAFTEN':
      return (
        <TeamsSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={sektion.inhalt}
          teams={homepage.tenant.teams}
          primaryColor={primaryColor}
        />
      );

    case 'TERMINE':
      return (
        <TermineSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={sektion.inhalt}
          events={homepage.events}
          primaryColor={primaryColor}
        />
      );

    case 'KONTAKT':
      return (
        <KontaktSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={sektion.inhalt}
          email={homepage.kontaktEmail || homepage.tenant.email}
          telefon={homepage.kontaktTelefon || homepage.tenant.telefon}
          adresse={
            homepage.kontaktAdresse ||
            [homepage.tenant.anschrift, homepage.tenant.plz, homepage.tenant.ort]
              .filter(Boolean)
              .join(', ') ||
            null
          }
          oeffnungszeiten={homepage.oeffnungszeiten}
          primaryColor={primaryColor}
        />
      );

    case 'SPONSOREN':
      return (
        <SponsorenSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={sektion.inhalt}
          sponsoren={homepage.tenant.sponsoren}
          primaryColor={primaryColor}
        />
      );

    case 'FREITEXT':
    case 'NEUIGKEITEN':
    case 'ABTEILUNGEN':
    case 'MITGLIED_WERDEN':
      return (
        <TextSektion
          id={sektion.id}
          titel={sektion.titel}
          inhalt={sektion.inhalt}
          primaryColor={primaryColor}
        />
      );

    default:
      return null;
  }
}

// ==================== Seiten-Komponente ====================

export default async function VereinsHomepage({ params }: PageProps) {
  const { slug } = await params;
  const homepage = await homepageLaden(slug);

  if (!homepage) {
    notFound();
  }

  const { tenant, sektionen } = homepage;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNavigation
        vereinsname={tenant.name}
        logoUrl={tenant.logo}
        primaryColor={tenant.primaryColor}
        slug={tenant.slug}
        sektionen={sektionen}
      />

      {/* Sektionen dynamisch rendern */}
      <main>
        {sektionen.map((sektion) => (
          <SektionRenderer
            key={sektion.id}
            sektion={sektion}
            homepage={homepage}
          />
        ))}
      </main>

      {/* Footer */}
      <PublicFooter
        vereinsname={tenant.name}
        primaryColor={tenant.primaryColor}
        footerText={homepage.footerText}
        impressum={homepage.impressum}
        datenschutz={homepage.datenschutz}
        socialFacebook={homepage.socialFacebook}
        socialInstagram={homepage.socialInstagram}
        socialYoutube={homepage.socialYoutube}
      />
    </div>
  );
}
