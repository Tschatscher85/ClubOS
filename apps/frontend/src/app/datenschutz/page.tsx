import Link from 'next/link';

export default function DatenschutzPage() {
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
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium mt-4 mb-1">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Verantwortliche Stelle</h2>
            <p>
              Vereinbase UG (haftungsbeschränkt)<br />
              ein Unternehmen der Jaeger Holding UG<br />
              [Straße und Hausnummer]<br />
              [PLZ Ort]<br />
              <br />
              E-Mail: support@vereinbase.de<br />
              Telefon: [Telefonnummer]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Datenerfassung auf unserer Website</h2>

            <h3 className="text-lg font-medium mt-4 mb-1">Wer ist verantwortlich für die Datenerfassung?</h3>
            <p>
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber
              (Vereinbase UG). Die Kontaktdaten finden Sie im Impressum.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">Wie erfassen wir Ihre Daten?</h3>
            <p>
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen
              (z.B. Registrierung, Mitgliedsantrag). Andere Daten werden automatisch beim
              Besuch der Website durch unsere IT-Systeme erfasst (technische Daten wie
              Browser, Betriebssystem, Uhrzeit des Seitenaufrufs).
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">Wofür nutzen wir Ihre Daten?</h3>
            <p>
              Die Daten werden erhoben, um eine fehlerfreie Bereitstellung der Vereinsverwaltungs-Software
              zu gewährleisten. Weitere Daten werden zur Vereinsverwaltung genutzt
              (Mitgliederverwaltung, Kalender, Kommunikation).
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger
              und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO).
              Sie haben außerdem ein Recht auf Berichtigung (Art. 16), Löschung (Art. 17),
              Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20 DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Hosting und Server</h2>
            <p>
              Diese Website wird auf Servern in Deutschland gehostet. Der Serverstandort
              befindet sich in einem deutschen Rechenzentrum. Es findet keine Datenübertragung
              in Drittstaaten statt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Allgemeine Hinweise und Pflichtinformationen</h2>

            <h3 className="text-lg font-medium mt-4 mb-1">Datenschutz</h3>
            <p>
              Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre
              personenbezogenen Daten vertraulich und entsprechend der gesetzlichen
              Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">SSL-/TLS-Verschlüsselung</h3>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
              vertraulicher Inhalte eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte
              Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von
              &quot;http://&quot; auf &quot;https://&quot; wechselt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Datenverarbeitung in der Vereinsverwaltung</h2>

            <h3 className="text-lg font-medium mt-4 mb-1">Welche Daten werden verarbeitet?</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stammdaten: Name, Vorname, Geburtsdatum, Adresse, Telefon, E-Mail</li>
              <li>Vereinsdaten: Mitgliedsnummer, Sportarten, Teamzugehörigkeit</li>
              <li>Veranstaltungsdaten: An-/Abmeldungen, Anwesenheit, Kommentare</li>
              <li>Finanzdaten: Beiträge, IBAN (wenn SEPA-Lastschrift), Rechnungen</li>
              <li>Kommunikation: Nachrichten, Umfragen, Aushänge</li>
              <li>Technische Daten: IP-Adresse, Browser, Zeitstempel</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-1">Rechtsgrundlage</h3>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              an der Vereinsverwaltung). Gesundheitsdaten (z.B. Verletzungsprotokolle)
              werden nur mit ausdrücklicher Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO
              verarbeitet.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">Speicherdauer</h3>
            <p>
              Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung
              entfällt. Bei Vereinsaustritt werden die Daten nach Ablauf gesetzlicher
              Aufbewahrungsfristen (i.d.R. 10 Jahre für Finanzdaten) gelöscht.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-1">Datenexport (Art. 20 DSGVO)</h3>
            <p>
              Jedes Mitglied kann jederzeit einen vollständigen Export seiner personenbezogenen
              Daten in maschinenlesbarem Format (JSON) anfordern. Dieser ist über das
              Mitgliederprofil oder durch Anfrage an den Vereinsvorstand verfügbar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Multi-Tenant Datentrennung</h2>
            <p>
              Vereinbase ist eine Multi-Tenant-Plattform. Die Daten jedes Vereins sind
              vollständig voneinander getrennt durch:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tenant-basierte Zugriffskontrolle auf Anwendungsebene</li>
              <li>PostgreSQL Row-Level Security (RLS) auf Datenbankebene</li>
              <li>JWT-basierte Authentifizierung mit Tenant-Bindung</li>
              <li>Automatisierte Isolationstests</li>
            </ul>
            <p>
              Ein Verein kann unter keinen Umständen auf die Daten eines anderen Vereins zugreifen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. KI-Funktionen</h2>
            <p>
              Vereinbase bietet optionale KI-gestützte Funktionen (Trainingsplan-Generierung,
              Spielberichte, FAQ-Antworten). Diese werden nur auf ausdrückliche Freischaltung
              durch den Vereinsvorstand aktiviert. Dabei werden Textdaten an den konfigurierten
              KI-Anbieter (Anthropic oder OpenAI) übermittelt. Personenbezogene Daten werden
              dabei nicht an den KI-Anbieter weitergegeben.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Push-Benachrichtigungen</h2>
            <p>
              Vereinbase nutzt Web-Push-Benachrichtigungen zur Erinnerung an Veranstaltungen
              und für wichtige Mitteilungen. Die Aktivierung erfolgt freiwillig durch den Nutzer.
              Push-Benachrichtigungen werden nicht zwischen 22:00 und 07:00 Uhr gesendet
              (Stille-Stunden), außer bei Notfall-Broadcasts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Cookies</h2>
            <p>
              Vereinbase verwendet ausschließlich technisch notwendige Cookies für die
              Authentifizierung (JWT-Token im localStorage). Es werden keine Tracking-Cookies,
              Analyse-Cookies oder Werbe-Cookies eingesetzt. Eine Einwilligung ist daher
              nicht erforderlich (§ 25 Abs. 2 TDDDG).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Ihre Rechte</h2>
            <p>Sie haben folgende Rechte:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15 DSGVO) — Welche Daten sind gespeichert?</li>
              <li><strong>Berichtigung</strong> (Art. 16 DSGVO) — Falsche Daten korrigieren</li>
              <li><strong>Löschung</strong> (Art. 17 DSGVO) — Daten löschen lassen</li>
              <li><strong>Einschränkung</strong> (Art. 18 DSGVO) — Verarbeitung einschränken</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Daten exportieren</li>
              <li><strong>Widerspruch</strong> (Art. 21 DSGVO) — Verarbeitung widersprechen</li>
              <li><strong>Beschwerde</strong> bei der zuständigen Aufsichtsbehörde</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung Ihrer Rechte wenden Sie sich an: support@vereinbase.de
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
