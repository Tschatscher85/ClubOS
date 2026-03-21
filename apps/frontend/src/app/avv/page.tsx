import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AVVPage() {
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
        <h1 className="text-3xl font-bold mb-8">
          Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Gilt für alle Vereine, automatisch akzeptiert bei Registrierung.
        </p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Vertragsparteien</h2>
            <p>
              <strong>Auftraggeber (Verantwortlicher):</strong> Der jeweilige Verein
            </p>
            <p>
              <strong>Auftragnehmer (Auftragsverarbeiter):</strong><br />
              Vereinbase UG (haftungsbeschränkt)<br />
              In den Kirschwiesen 16, 73329 Kuchen<br />
              info@vereinbase.de
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Gegenstand und Dauer</h2>
            <p>
              <strong>Gegenstand:</strong> Betrieb der Vereinbase Vereinsverwaltungssoftware<br />
              <strong>Dauer:</strong> Entspricht der Vertragslaufzeit
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Art der verarbeiteten Daten</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mitgliederdaten (Name, Geburtsdatum, Adresse, Kontakt)</li>
              <li>Kommunikationsdaten (Nachrichten, E-Mails)</li>
              <li>Finanzdaten (Beiträge, SEPA-Mandate)</li>
              <li>Nutzungsdaten (Login, Aktivität)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Zweck</h2>
            <p>Bereitstellung und Betrieb der Vereinsverwaltungssoftware.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Speicherort</h2>
            <p>Ausschließlich Server in Deutschland (EU).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Weisungsrecht</h2>
            <p>
              Der Verantwortliche (Verein) erteilt Weisungen per E-Mail an{' '}
              <a href="mailto:datenschutz@vereinbase.de" className="text-primary hover:underline">
                datenschutz@vereinbase.de
              </a>.
              Vereinbase handelt ausschließlich auf Weisung des Verantwortlichen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Technische und organisatorische Maßnahmen (TOMs)
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Verschlüsselung der Datenübertragung (TLS 1.3)</li>
              <li>Verschlüsselung der gespeicherten Daten</li>
              <li>Zugriffskontrolle (Row-Level Security, Schema-per-Tenant)</li>
              <li>Jeder Verein hat einen vollständig getrennten Datenbereich</li>
              <li>Tägliche verschlüsselte Backups (30 Tage Aufbewahrung)</li>
              <li>Sentry-Monitoring (nur technische Fehlerdaten, keine Personendaten)</li>
              <li>Alle Mitarbeiter zur Vertraulichkeit verpflichtet</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Unterauftragnehmer</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Stripe Inc.</strong> (Zahlungsabwicklung):{' '}
                <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  stripe.com/de/privacy
                </a>
              </li>
              <li>
                <strong>Anthropic / OpenAI</strong> (KI, nur wenn Verein aktiviert hat)
              </li>
              <li>
                <strong>Sentry</strong> (Fehlermonitoring, anonymisiert)
              </li>
            </ul>
            <p>
              Der Verantwortliche stimmt diesen Unterauftragnehmern mit der Registrierung zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Löschung nach Vertragsende</h2>
            <p>
              Vollständige Löschung aller Daten auf Anfrage innerhalb von 30 Tagen.
              Gesetzlich aufbewahrungspflichtige Daten (10 Jahre) ausgenommen.
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
