interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location: string;
  team?: { name: string; sport: string } | null;
}

interface TermineSektionProps {
  id: string;
  titel?: string | null;
  inhalt?: string | null;
  events: Event[];
  primaryColor: string;
}

const TYP_LABELS: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

function formatDatum(dateString: string): string {
  const datum = new Date(dateString);
  return datum.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatUhrzeit(dateString: string): string {
  const datum = new Date(dateString);
  return datum.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TermineSektion({
  id,
  titel,
  inhalt,
  events,
  primaryColor,
}: TermineSektionProps) {
  if (!events || events.length === 0) return null;

  return (
    <section id={`sektion-${id}`} className="py-16">
      <div className="mx-auto max-w-4xl px-4">
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
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Datum-Box */}
              <div
                className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-lg font-bold leading-none">
                  {new Date(event.date).getDate()}
                </span>
                <span className="text-[10px] uppercase">
                  {new Date(event.date).toLocaleDateString('de-DE', {
                    month: 'short',
                  })}
                </span>
              </div>
              {/* Details */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500">
                  {formatDatum(event.date)} um {formatUhrzeit(event.date)}
                  {event.location && ` — ${event.location}`}
                </p>
              </div>
              {/* Typ-Badge */}
              <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 sm:inline-block">
                {TYP_LABELS[event.type] || event.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
