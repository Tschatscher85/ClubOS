import Link from 'next/link';

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Vereinbase
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">§ 1 Geltungsbereich</h2>
            <p>
              (1) Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der
              SaaS-Plattform &quot;Vereinbase&quot; (nachfolgend &quot;Plattform&quot;),
              betrieben von der Vereinbase UG (haftungsbeschränkt), ein Unternehmen
              der Jaeger Holding UG (nachfolgend &quot;Anbieter&quot;).
            </p>
            <p>
              (2) Die Plattform richtet sich an Sportvereine und deren Mitglieder
              in Deutschland.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 2 Vertragsgegenstand</h2>
            <p>
              (1) Der Anbieter stellt dem Kunden (Verein) eine webbasierte
              Vereinsverwaltungssoftware als Software-as-a-Service (SaaS) zur Verfügung.
            </p>
            <p>
              (2) Der Funktionsumfang richtet sich nach dem gewählten Tarif.
              Der aktuelle Funktionsumfang ist auf der Website einsehbar.
            </p>
            <p>
              (3) Der Anbieter erbringt seine Leistungen mit einer Verfügbarkeit
              von mindestens 99% im Jahresmittel (ausgenommen angekündigte Wartungsfenster).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 3 Registrierung und Vertragsschluss</h2>
            <p>
              (1) Die Nutzung der Plattform setzt eine Registrierung voraus.
              Mit Abschluss der Registrierung kommt ein Nutzungsvertrag zustande.
            </p>
            <p>
              (2) Der Kunde versichert, dass die bei der Registrierung angegebenen
              Daten vollständig und korrekt sind. Änderungen sind unverzüglich mitzuteilen.
            </p>
            <p>
              (3) Jeder Verein erhält einen eigenen Mandantenbereich (Tenant).
              Der registrierende Nutzer wird automatisch als Administrator eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 4 Testphase</h2>
            <p>
              (1) Neue Kunden erhalten eine kostenlose Testphase von 14 Tagen
              mit vollem Funktionsumfang.
            </p>
            <p>
              (2) Nach Ablauf der Testphase ist ein kostenpflichtiger Tarif zu wählen.
              Ohne Tarifwahl wird der Zugang eingeschränkt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 5 Vergütung und Zahlung</h2>
            <p>
              (1) Die Vergütung richtet sich nach dem gewählten Tarif.
              Die Abrechnung erfolgt monatlich im Voraus.
            </p>
            <p>
              (2) Die Zahlung erfolgt per Kreditkarte oder SEPA-Lastschrift
              über den Zahlungsdienstleister Stripe.
            </p>
            <p>
              (3) Bei Zahlungsverzug von mehr als 14 Tagen ist der Anbieter
              berechtigt, den Zugang vorübergehend zu sperren. Nach drei
              fehlgeschlagenen Zahlungsversuchen wird der Account automatisch
              gesperrt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 6 Laufzeit und Kündigung</h2>
            <p>
              (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann
              von beiden Seiten jederzeit zum Ende des laufenden Abrechnungszeitraums
              gekündigt werden.
            </p>
            <p>
              (2) Die Kündigung kann über die Kontoeinstellungen oder per E-Mail
              an support@vereinbase.de erfolgen.
            </p>
            <p>
              (3) Nach Kündigung bleiben die Daten für 30 Tage verfügbar.
              In diesem Zeitraum kann ein Datenexport durchgeführt werden.
              Danach werden alle Daten unwiderruflich gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 7 Datenschutz und Datensicherheit</h2>
            <p>
              (1) Der Anbieter verarbeitet personenbezogene Daten im Auftrag des
              Kunden gemäß Art. 28 DSGVO. Ein gesonderter Auftragsverarbeitungsvertrag
              (AVV) wird bei Vertragsschluss geschlossen.
            </p>
            <p>
              (2) Alle Daten werden ausschließlich auf Servern in Deutschland
              gespeichert und verarbeitet.
            </p>
            <p>
              (3) Die Datentrennung zwischen Vereinen erfolgt durch Multi-Tenant-Architektur
              mit Row-Level Security auf Datenbankebene.
            </p>
            <p>
              (4) Weitere Details entnehmen Sie bitte unserer{' '}
              <Link href="/datenschutz" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 8 Pflichten des Kunden</h2>
            <p>
              (1) Der Kunde ist für die Inhalte verantwortlich, die über seinen
              Mandantenbereich verarbeitet werden.
            </p>
            <p>
              (2) Der Kunde stellt sicher, dass die erforderlichen Einwilligungen
              seiner Mitglieder für die Datenverarbeitung vorliegen.
            </p>
            <p>
              (3) Zugangsdaten sind vertraulich zu behandeln. Der Kunde haftet
              für alle Aktivitäten, die über seine Zugangsdaten erfolgen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 9 Haftung</h2>
            <p>
              (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
            </p>
            <p>
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
              wesentlicher Vertragspflichten (Kardinalpflichten), begrenzt auf den
              vorhersehbaren, vertragstypischen Schaden.
            </p>
            <p>
              (3) Die Haftung für Datenverlust ist auf den typischen
              Wiederherstellungsaufwand beschränkt, der bei regelmäßiger
              Datensicherung entstanden wäre. Der Anbieter führt tägliche
              Backups durch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 10 Änderungen der AGB</h2>
            <p>
              (1) Der Anbieter behält sich vor, diese AGB mit einer Ankündigungsfrist
              von 4 Wochen zu ändern.
            </p>
            <p>
              (2) Die Änderungen werden per E-Mail angekündigt. Widerspricht der
              Kunde nicht innerhalb von 4 Wochen, gelten die neuen AGB als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">§ 11 Schlussbestimmungen</h2>
            <p>
              (1) Es gilt das Recht der Bundesrepublik Deutschland.
            </p>
            <p>
              (2) Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.
            </p>
            <p>
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt
              die Wirksamkeit der übrigen Bestimmungen unberührt.
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
