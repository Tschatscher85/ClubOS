# Vereinbase — Beta-Launch Checkliste & Testanleitung

## Stand: 24.03.2026

---

## 1. SERVER-STATUS

### Erledigt:
- [x] PM2 Autostart nach Reboot (`sudo bash scripts/setup-pm2-systemd.sh`)
- [x] DB umbenannt: `vereinbase_dev` (User: `vereinbase`)
- [x] DB-Berechtigungen gefixt (Tabellen-Owner von `clubos` auf `vereinbase` uebertragen)
- [x] DNS: `vereinbase.de` → A-Record gesetzt, SSL via Caddy
- [x] nginx in Docker: leitet vereinbase.de auf Port 3000
- [x] SMTP konfiguriert (Strato, smtp.strato.de:465, info@vereinbase.de)
- [x] E-Mail-Adressen eingerichtet (info@, datenschutz@, kuendigung@vereinbase.de)
- [x] SMTP/IMAP in Admin Web-UI konfigurierbar (PlattformConfig, kein .env noetig)
- [x] Test-Mail funktioniert
- [x] E-Mail-Verifizierung sendet echte Mails per SMTP
- [x] Login + Redirect funktioniert (Race Condition gefixt am 24.03.)

### Aktuelles Setup:
| Komponente | Status | Details |
|------------|--------|---------|
| Frontend | PM2 (Port 3000) | `pm2 restart vereinbase-frontend` |
| Backend | PM2 (Port 3001) | `pm2 restart vereinbase-backend` |
| PostgreSQL | Lokal | DB: vereinbase_dev, User: vereinbase |
| Redis | Lokal | BullMQ Jobs (Mail, Push, Erinnerungen) |
| nginx | Docker | Reverse Proxy, vereinbase.de → 3000 |
| Domain | vereinbase.de | SSL via Caddy |
| SMTP | Strato | smtp.strato.de:465, info@vereinbase.de |
| Backup | Cron 03:00 | 30 Tage + monatlich |

---

## 2. E-MAIL SETUP

### Was funktioniert:
- Ausgehende Mails: SMTP ueber Strato (info@vereinbase.de)
- IMAP-Poller: Alle 5 Min (pro Benutzer konfigurierbar unter Einstellungen → E-Mail)
- E-Mail-Verifizierung bei Registrierung
- Passwort-Reset per E-Mail
- Einladungen per Workflow

### E-Mail-Adressen:
| Adresse | Verwendung | Steht in |
|---------|-----------|----------|
| info@vereinbase.de | Kontakt, Absender | Impressum, E-Mails |
| datenschutz@vereinbase.de | DSGVO-Anfragen | Datenschutz, AVV |
| kuendigung@vereinbase.de | Kuendigung per Mail | AGB |

### Alle E-Mail-Typen:
| Anlass | Wann | An wen |
|--------|------|--------|
| E-Mail-Verifizierung | Nach Registrierung | Admin |
| Login-Daten | Bei Mitglied-Aktivierung (E-Mail = Login) | Mitglied |
| Einladung | Manuell (Workflows) | Neues Mitglied |
| Passwort vergessen | Selbst-Service | User |
| Erinnerung (24h/2h) | Automatisch (BullMQ) | Team-Mitglieder |
| Geburtstag | Taeglich 08:00 (CronJob) | Mitglied + Trainer |
| Notfall-Broadcast | Manuell (Trainer) | Ganzes Team |
| Geburtstags-E-Mail | Taeglich 08:00 | Mitglied (HTML mit Logo) |

### Verein richtet eigene E-Mail ein:
1. Admin → **Einstellungen → E-Mail**
2. SMTP-Server eingeben (z.B. smtp.gmail.com, smtp.web.de)
3. "Test-Mail senden" klicken
4. Ab jetzt gehen alle Vereins-Mails ueber das eigene Konto raus

---

## 3. VEREIN ANLEGEN UND TESTEN — Schritt fuer Schritt

### Schritt 1: Neuen Verein registrieren
1. Gehe auf `vereinbase.de/registrieren`
2. Eingeben:
   - **Vereinsname**: z.B. "TSV Kuchen"
   - **URL-Slug**: z.B. "tsv-kuchen"
   - **E-Mail**: Admin-E-Mail
   - **Passwort**: mindestens 8 Zeichen
3. Klick "Registrieren"
4. Du bist jetzt ADMIN mit 8 Standard-Rollenvorlagen

### Schritt 2: Onboarding durchlaufen
1. **Logo hochladen** (optional)
2. **Vereinsfarbe waehlen** (z.B. Rot)
3. **Abteilungen anlegen** (z.B. Fussball, Handball — Abteilung = Sportart)
4. **Mitglieder einladen** (E-Mails eingeben)

### Schritt 3: Vereinsdaten vervollstaendigen
Gehe zu **Einstellungen → Vereinsdaten**:
- VR-Nummer, Satzung, Adresse
- Vorstandsmitglieder (1. Vorsitzender, Kassenwart, etc.)
- IBAN fuer SEPA
- Versicherungen

### Schritt 4: Abteilungen & Teams anlegen
1. **Abteilung erstellen** unter Einstellungen → Sportbetrieb (z.B. "Fussball")
2. **Teams anlegen** → Abteilung zuordnen → Altersklasse waehlen
3. Trainer wird spaeter ueber Vereinsrollen zugeordnet

### Schritt 5: Mitglieder anlegen
1. **Mitglieder & Personal** → "Neues Mitglied anlegen"
2. Name, Geburtsdatum, Sportart, Team-Zuordnung
3. E-Mail = Login: Mitglied bekommt automatisch Zugang
4. Bei Minderjaehrigen: Eltern-E-Mail + Einverstaendnisse
5. Vereinsrollen zuweisen (z.B. Spieler, Trainer, Vorstand)
6. Team-Rolle wird automatisch abgeleitet

### Schritt 6: Workflows fuer Einladungen
1. **Workflows** → Neuer Workflow
2. PDFs auswaehlen: Mitgliedsantrag → Datenschutz → Einverstaendnis (Reihenfolge!)
3. Sportart und Altersgruppe festlegen
4. E-Mail-Text anpassen

### Schritt 7: Erste Veranstaltung
1. **Kalender** → "Neue Veranstaltung"
2. Typ: Training, Datum, Team, Halle
3. Erinnerung automatisch 24h + 2h vorher (Push + E-Mail)
4. QR-Check-In fuer schnelle Anwesenheitserfassung

---

## 4. BETA-LAUNCH CHECKLISTE

### Vor dem ersten Pilotverein:
- [x] PM2 Autostart eingerichtet
- [x] DB umbenannt und Berechtigungen gefixt
- [x] SMTP konfiguriert und getestet
- [x] E-Mail-Adressen eingerichtet
- [x] Login + Dashboard-Redirect funktioniert
- [x] E-Mail-Verifizierung funktioniert
- [ ] **Stripe Billing einbauen** (Checkout, Webhook, PlanGuard)
- [ ] **HRB-Nummer + USt-IdNr** nach Notartermin in Impressum eintragen
- [ ] **JWT-Secrets aendern** (aktuell Platzhalter!)
- [ ] Selbst einen Test-Verein registrieren und durchspielen
- [ ] Als PARENT einloggen → nur Kalender, Nachrichten, Pinnwand, Eltern-Portal?
- [ ] Als MEMBER einloggen → kein Ehrenamt, keine Verwaltung?
- [ ] Team ohne Trainer anlegen → funktioniert?

### Pilotverein onboarden:
- [ ] Verein registriert sich selbst auf vereinbase.de
- [ ] 30 Min gemeinsames Setup-Call (Onboarding durchlaufen)
- [ ] Erste Abteilungen + Teams anlegen
- [ ] 5-10 Mitglieder einladen (Workflow testen)
- [ ] Ersten Trainingsplan im Kalender anlegen
- [ ] Feedback nach 1 Woche sammeln

### Nach 2 Wochen Pilotphase:
- [ ] Stripe aktivieren (damit Vereine nach Testphase zahlen)
- [ ] Feedback umsetzen
- [ ] 2-3 weitere Vereine onboarden

---

## 5. SCHNELLTEST-ACCOUNTS

```
URL: vereinbase.de

admin@vereinbase.de     → SUPERADMIN (Plattform)
vorstand@vereinbase.de  → ADMIN (Vereins-Vorstand)
trainer@vereinbase.de   → TRAINER
spieler@vereinbase.de   → MEMBER (Spieler)
eltern@vereinbase.de    → PARENT (Elternteil)

Passwort: Siehe Seed-Datei (apps/backend/prisma/seed.ts)
Tenant: FC Kunchen 1920 e.V. (Slug: fckunchen)
```

### So testest du alle Rollen:
1. Einloggen als `vorstand@vereinbase.de` → alles sichtbar
2. Einloggen als `trainer@vereinbase.de` → Mitglieder, Teams, Kalender, kein Ehrenamt
3. Einloggen als `spieler@vereinbase.de` → nur Kalender, Nachrichten, Pinnwand, Galerie
4. Einloggen als `eltern@vereinbase.de` → nur Kalender, Nachrichten, Pinnwand, Eltern-Portal
5. Neuen Account als HALLENWART anlegen → nur Belegungsplan

---

## 6. HAEUFIGE FRAGEN

**"Login funktioniert nicht / nach Login passiert nichts?"**
→ Am 24.03. gefixt: Race Condition im Zustand-Hydration behoben. Frontend neu bauen: `npx turbo build --filter=@vereinbase/frontend && pm2 restart vereinbase-frontend`
→ DB-Berechtigungsfehler ("permission denied"): Tabellen-Owner war noch `clubos` statt `vereinbase`. Gefixt mit GRANT-Befehlen.

**"Ich sehe keine Mails?"**
→ SMTP ist konfiguriert (Strato). Falls trotzdem keine Mails: `pm2 logs vereinbase-backend` zeigt alle Mail-Versuche.

**"Server nicht erreichbar" Banner?"**
→ Health-Check geht gegen /api/health. Wenn du ueber VPN/extern zugreifst, kann das fehlschlagen. Lokal auf 192.168.0.151 funktioniert es.

**"Wie erstelle ich einen HALLENWART?"**
→ Mitglied anlegen → Vereinsrollen-Tab → Vereinsrolle "HALLENWART" zuweisen. Sieht nur Belegungsplan.

**"Wo sehe ich Passwoerter fuer neue Mitglieder?"**
→ E-Mail = Login: Mitglied bekommt Login-Link per E-Mail. Passwort setzen ueber Passwort-Vergessen-Flow.

**"Team anlegen geht nicht?"**
→ Erst eine Abteilung anlegen (Einstellungen → Sportbetrieb), dann Team erstellen mit Abteilungs-Zuordnung.
