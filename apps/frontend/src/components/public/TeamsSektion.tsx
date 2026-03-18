interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  abteilung?: { name: string } | null;
}

interface TeamsSektionProps {
  id: string;
  titel?: string | null;
  inhalt?: string | null;
  teams: Team[];
  primaryColor: string;
}

const SPORT_ICONS: Record<string, string> = {
  FUSSBALL: '\u26BD',
  HANDBALL: '\uD83E\uDD3E',
  BASKETBALL: '\uD83C\uDFC0',
  FOOTBALL: '\uD83C\uDFC8',
  TENNIS: '\uD83C\uDFBE',
  TURNEN: '\uD83E\uDD38',
  SCHWIMMEN: '\uD83C\uDFCA',
  LEICHTATHLETIK: '\uD83C\uDFC3',
  SONSTIGES: '\uD83C\uDFC5',
};

export function TeamsSektion({
  id,
  titel,
  inhalt,
  teams,
  primaryColor,
}: TeamsSektionProps) {
  if (!teams || teams.length === 0) return null;

  return (
    <section id={`sektion-${id}`} className="bg-gray-50 py-16">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">
                  {SPORT_ICONS[team.sport] || SPORT_ICONS.SONSTIGES}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-500">{team.ageGroup}</p>
                </div>
              </div>
              {team.abteilung && (
                <span
                  className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {team.abteilung.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
