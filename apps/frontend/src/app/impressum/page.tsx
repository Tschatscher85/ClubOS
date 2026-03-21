import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PendingBadge } from '@/components/ui/pending-badge';

export default function ImpressumPage() {
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
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
            <p>
              Vereinbase UG (haftungsbeschränkt)<br />
              In den Kirschwiesen 16<br />
              73329 Kuchen
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Vertreten durch</h2>
            <p>Geschäftsführer: Sven Jaeger</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
            <p>
              Telefon: 0176 70378744<br />
              E-Mail: info@vereinbase.de
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Registereintrag</h2>
            <p>
              Eintragung im Handelsregister<br />
              Registergericht: Amtsgericht Ulm<br />
              Handelsregisternummer: <PendingBadge label="HRB XXXXX — nach Notartermin eintragen" />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
              <PendingBadge label="nach Finanzamt-Bescheid eintragen" />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Inhaltlich verantwortlich gemäß § 55 Abs. 2 RStV
            </h2>
            <p>
              Sven Jaeger<br />
              In den Kirschwiesen 16<br />
              73329 Kuchen
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>
              Wir sind nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
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
