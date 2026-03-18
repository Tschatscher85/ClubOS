interface HeroSektionProps {
  titel?: string | null;
  untertitel?: string | null;
  bildUrl?: string | null;
  primaryColor: string;
  vereinsname: string;
  mitgliederAnzahl?: number | null;
  slug: string;
}

export function HeroSektion({
  titel,
  untertitel,
  bildUrl,
  primaryColor,
  vereinsname,
  mitgliederAnzahl,
  slug,
}: HeroSektionProps) {
  return (
    <section
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden text-white"
      style={{
        background: bildUrl
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${bildUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}99 100%)`,
      }}
    >
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
          {titel || `Willkommen beim ${vereinsname}`}
        </h1>
        {untertitel && (
          <p className="mb-8 text-lg text-white/90 md:text-xl">{untertitel}</p>
        )}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={`/verein/${slug}/anmelden`}
            className="rounded-lg bg-white px-8 py-3 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ color: primaryColor }}
          >
            Mitglied werden
          </a>
          {mitgliederAnzahl && mitgliederAnzahl > 0 && (
            <span className="text-sm text-white/80">
              Bereits {mitgliederAnzahl} Mitglieder
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
