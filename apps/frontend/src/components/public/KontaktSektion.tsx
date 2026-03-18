interface KontaktSektionProps {
  id: string;
  titel?: string | null;
  inhalt?: string | null;
  email?: string | null;
  telefon?: string | null;
  adresse?: string | null;
  oeffnungszeiten?: string | null;
  primaryColor: string;
}

export function KontaktSektion({
  id,
  titel,
  inhalt,
  email,
  telefon,
  adresse,
  oeffnungszeiten,
  primaryColor,
}: KontaktSektionProps) {
  const hatKontaktdaten = email || telefon || adresse;
  if (!hatKontaktdaten && !inhalt) return null;

  return (
    <section id={`sektion-${id}`} className="bg-gray-50 py-16">
      <div className="mx-auto max-w-4xl px-4">
        {titel && (
          <h2
            className="mb-8 text-center text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {titel}
          </h2>
        )}
        {inhalt && (
          <p className="mb-8 text-center text-gray-600">{inhalt}</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adresse && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-900">Adresse</h3>
              <p className="whitespace-pre-line text-sm text-gray-600">
                {adresse}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(adresse)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                In Google Maps oeffnen
              </a>
            </div>
          )}
          {(email || telefon) && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-900">Erreichbarkeit</h3>
              {email && (
                <p className="text-sm text-gray-600">
                  E-Mail:{' '}
                  <a
                    href={`mailto:${email}`}
                    className="hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {email}
                  </a>
                </p>
              )}
              {telefon && (
                <p className="mt-1 text-sm text-gray-600">
                  Telefon:{' '}
                  <a
                    href={`tel:${telefon}`}
                    className="hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {telefon}
                  </a>
                </p>
              )}
            </div>
          )}
          {oeffnungszeiten && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-900">
                Oeffnungszeiten
              </h3>
              <p className="whitespace-pre-line text-sm text-gray-600">
                {oeffnungszeiten}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
