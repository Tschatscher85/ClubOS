import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AGBPage() {
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
          Allgemeine Geschäftsbedingungen der Vereinbase UG (haftungsbeschränkt)
        </h1>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">§ 1 Geltungsbereich</h2>
            <p>
              Diese AGB gelten für alle Verträge zwischen der Vereinbase UG (haftungsbeschränkt),
              In den Kirschwiesen 16, 73329 Kuchen (nachfolgend &quot;Vereinbase&quot;) und
              Sportvereinen sowie Organisationen (nachfolgend &quot;Kunde&quot;) über die Nutzung
              der Vereinbase SaaS-Plattform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 2 Vertragsgegenstand</h2>
            <p>
              Vereinbase stellt eine cloudbasierte Vereinsverwaltungssoftware als
              Software-as-a-Service bereit. Der Zugang erfolgt per Browser und optionaler
              Mobile App. Eine Installation ist nicht erforderlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 3 Registrierung</h2>
            <p>
              Die Registrierung ist ausschließlich für Vereine und Organisationen zulässig.
              Der Registrierende muss mindestens 18 Jahre alt und berechtigt sein, den Verein
              zu vertreten. Pro Verein ist ein Account (Tenant) zulässig. Der Kunde ist für
              die Sicherheit seiner Zugangsdaten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 4 Testphase und Zahlung</h2>
            <p>
              Die ersten 14 Tage sind kostenlos und unverbindlich. Eine Kreditkarte ist für
              die Testphase nicht erforderlich. Nach Ablauf der Testphase wird der gewählte
              Tarif monatlich oder jährlich per Stripe abgerechnet (Kreditkarte oder
              SEPA-Lastschrift). Alle Preise verstehen sich inkl. MwSt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 5 Laufzeit und Kündigung</h2>
            <p>
              Der Vertrag läuft monatlich und ist monatlich kündbar.
              Kündigung per E-Mail an:{' '}
              <a href="mailto:kuendigung@vereinbase.de" className="text-primary hover:underline">
                kuendigung@vereinbase.de
              </a>
            </p>
            <p>
              Nach Kündigung bleiben alle Daten noch 30 Tage abrufbar, danach werden
              sie unwiderruflich gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 6 Auftragsverarbeitung (DSGVO)</h2>
            <p>
              Vereinbase ist Auftragsverarbeiter gemäß Art. 28 DSGVO. Der
              Auftragsverarbeitungsvertrag (AVV) ist Bestandteil dieser AGB und wird mit
              der Registrierung automatisch akzeptiert. Der Kunde bleibt Verantwortlicher
              für die Daten seiner Mitglieder. Ein separater AVV muss nicht abgeschlossen werden.
            </p>
            <p>
              Den vollständigen AVV finden Sie unter:{' '}
              <Link href="/avv" className="text-primary hover:underline">
                vereinbase.de/avv
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 7 Verfügbarkeit</h2>
            <p>
              Vereinbase strebt eine monatliche Verfügbarkeit von 99,5 % an. Geplante
              Wartungsarbeiten werden mindestens 24 Stunden vorher per E-Mail und in der
              App angekündigt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 8 Haftung</h2>
            <p>
              Vereinbase haftet nur bei Vorsatz und grober Fahrlässigkeit. Für den Verlust
              von Daten haftet Vereinbase nur, soweit ein Backup nicht möglich war.
              Vereinbase erstellt tägliche Backups.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 9 Änderungen der AGB</h2>
            <p>
              Änderungen werden 30 Tage vor Inkrafttreten per E-Mail mitgeteilt. Widerspricht
              der Kunde nicht innerhalb von 30 Tagen, gelten die neuen AGB als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 10 Schlussbestimmungen</h2>
            <p>
              Es gilt deutsches Recht. Gerichtsstand ist Göppingen, soweit gesetzlich zulässig.
              Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
              Bestimmungen unberührt.
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
