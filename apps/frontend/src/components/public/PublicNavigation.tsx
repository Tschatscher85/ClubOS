'use client';

interface PublicNavigationProps {
  vereinsname: string;
  logoUrl?: string | null;
  primaryColor: string;
  slug: string;
  sektionen: Array<{ id: string; typ: string; titel?: string | null }>;
}

export function PublicNavigation({
  vereinsname,
  logoUrl,
  primaryColor,
  slug,
  sektionen,
}: PublicNavigationProps) {
  const scrollToSection = (sektionId: string) => {
    const element = document.getElementById(sektionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Nur Sektionen mit Titel anzeigen, HERO ausschliessen
  const navSektionen = sektionen.filter(
    (s) => s.titel && s.typ !== 'HERO',
  );

  return (
    <nav
      className="sticky top-0 z-50 shadow-md"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Links: Logo + Vereinsname */}
        <a href={`/verein/${slug}`} className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${vereinsname} Logo`}
              className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
            />
          )}
          <span className="text-lg font-bold text-white">{vereinsname}</span>
        </a>

        {/* Mitte: Sektions-Links */}
        <div className="hidden items-center gap-6 md:flex">
          {navSektionen.map((sektion) => (
            <button
              key={sektion.id}
              onClick={() => scrollToSection(`sektion-${sektion.id}`)}
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              {sektion.titel}
            </button>
          ))}
        </div>

        {/* Rechts: CTA-Button */}
        <a
          href={`/verein/${slug}/anmelden`}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ color: primaryColor }}
        >
          Mitglied werden
        </a>
      </div>
    </nav>
  );
}
