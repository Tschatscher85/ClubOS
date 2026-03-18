interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string | null;
  webseite?: string | null;
}

interface SponsorenSektionProps {
  id: string;
  titel?: string | null;
  inhalt?: string | null;
  sponsoren: Sponsor[];
  primaryColor: string;
}

export function SponsorenSektion({
  id,
  titel,
  inhalt,
  sponsoren,
  primaryColor,
}: SponsorenSektionProps) {
  if (!sponsoren || sponsoren.length === 0) return null;

  return (
    <section id={`sektion-${id}`} className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        {titel && (
          <h2
            className="mb-4 text-center text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {titel}
          </h2>
        )}
        {inhalt && (
          <p className="mb-10 text-center text-gray-600">{inhalt}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsoren.map((sponsor) => {
            const content = sponsor.logoUrl ? (
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="h-16 max-w-[160px] object-contain grayscale transition-all hover:grayscale-0"
              />
            ) : (
              <span className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700">
                {sponsor.name}
              </span>
            );

            if (sponsor.webseite) {
              return (
                <a
                  key={sponsor.id}
                  href={sponsor.webseite}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={sponsor.name}
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={sponsor.id} title={sponsor.name}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
