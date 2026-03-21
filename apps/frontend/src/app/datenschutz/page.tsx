import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Vereinbase
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung gemäß DSGVO</h1>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Verantwortlicher</h2>
            <p>
              Vereinbase UG (haftungsbeschränkt)<br />
              In den Kirschwiesen 16, 73329 Kuchen<br />
              E-Mail: datenschutz@vereinbase.de<br />
              Telefon: 0176 70378744
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Welche Daten wir verarbeiten</h2>
            <p>
              Bei Registrierung: Name, E-Mail, Passwort (bcrypt-verschlüsselt).<br />
              Bei Nutzung: IP-Adresse (Log-Daten werden regelmäßig gelöscht), Log-Daten.<br />
              Mitgliederdaten der Vereine: Name, Geburtsdatum, Adresse, Telefon —
              diese Daten gehören dem jeweiligen Verein, nicht Vereinbase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Zweck und Rechtsgrundlage</h2>
            <p>
              Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).<br />
              Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Server und Speicherort</h2>
            <p>
              Alle Daten werden ausschließlich auf eigener Infrastruktur in Deutschland
              gespeichert und verarbeitet. Keine Übermittlung in Drittländer außerhalb der EU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Drittanbieter</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Stripe</strong> (Zahlungsabwicklung, bei Aktivierung):{' '}
                <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  stripe.com/de/privacy
                </a>
              </li>
              <li>
                <strong>Anthropic / OpenAI</strong> (KI-Features): nur wenn vom Verein aktiviert,
                nur anonymisierte Anfragen, keine Mitgliederdaten.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Cookies</h2>
            <p>
              Wir verwenden ausschließlich technisch notwendige Cookies (Session, Auth-Token).
              Keine Tracking- oder Werbe-Cookies. Ein Cookie-Banner ist daher nicht erforderlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Deine Rechte (Art. 15–22 DSGVO)</h2>
            <p>
              Du hast das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung sowie Datenübertragbarkeit.
            </p>
            <p>
              Widerspruchsrecht: jederzeit per E-Mail an{' '}
              <a href="mailto:datenschutz@vereinbase.de" className="text-primary hover:underline">
                datenschutz@vereinbase.de
              </a>.
            </p>
            <p>
              Beschwerderecht bei der Aufsichtsbehörde:<br />
              Landesbeauftragter für den Datenschutz Baden-Württemberg<br />
              <a
                href="https://www.baden-wuerttemberg.datenschutz.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.baden-wuerttemberg.datenschutz.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Datenlöschung</h2>
            <p>
              Kontolöschung auf Anfrage innerhalb von 30 Tagen.<br />
              Buchhaltungsdaten: gesetzliche Aufbewahrungspflicht 10 Jahre (§ 147 AO).<br />
              DSGVO-Datenexport jederzeit abrufbar unter:
              Einstellungen → Datenschutz → Meine Daten exportieren.
            </p>
          </section>
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          Stand: März 2026
        </p>
      </main>
    </div>
  );
}
