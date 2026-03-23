# Vereinbase — Beta-Launch Checkliste & Testanleitung

## Stand: 21.03.2026

---

## 1. SOFORT ERLEDIGEN (sudo-Befehle, 5 Minuten)

```bash
# Server startet nach Reboot automatisch:
sudo bash scripts/setup-pm2-systemd.sh

# Datenbank umbenennen (bereits erledigt):
# sudo bash scripts/db-umbenennen.sh (Script entfernt, Migration abgeschlossen)
```

---

## 2. E-MAIL EINRICHTEN (WICHTIG!)

### Aktueller Stand:
- **Kein SMTP konfiguriert!** Alle Mails werden nur in die Konsole geloggt (pm2 logs)
- Einladungen, Passwort-Reset, Login-Daten, Erinnerungen gehen NICHT raus

### Was du brauchst:
Ein SMTP-Konto. Optionen:
- **Eigener Mailserver** (z.B. Mailcow auf dem Server)
- **Brevo** (ehemals Sendinblue) — kostenlos bis 300 Mails/Tag
- **Google Workspace** (wenn du @vereinbase.de bei Google hast)
- **Hetzner Mail** (günstig, deutsch)

### So konfigurierst du es:
In `/home/tschatscher/vereinbase/apps/backend/.env` ergänzen:

```env
# SMTP Konfiguration (Ausgehende Mails)
SMTP_HOST=smtp.dein-provider.de
SMTP_PORT=587
SMTP_USER=info@vereinbase.de
SMTP_PASS=dein-passwort
SMTP_FROM=info@vereinbase.de
```

Danach: `npx pm2 restart vereinbase-backend`

### E-Mail-Adressen die existieren müssen:
| Adresse | Verwendung | Steht in |
|---------|-----------|----------|
| info@vereinbase.de | Kontakt, Impressum | Impressum, Landing Page |
| datenschutz@vereinbase.de | DSGVO-Anfragen | Datenschutz, AVV |
| kuendigung@vereinbase.de | Kündigung per Mail | AGB |

### IMAP (Posteingang):
IMAP-Poller ist implementiert (alle 5 Min). Konfiguration pro Benutzer unter:
**Einstellungen → E-Mail** (jeder Trainer/Admin kann sein SMTP/IMAP-Konto hinterlegen)

Oder global in .env:
```env
IMAP_HOST=imap.dein-provider.de
IMAP_PORT=993
IMAP_USER=info@vereinbase.de
IMAP_PASS=dein-passwort
```

---

## 3. VEREIN ANLEGEN UND TESTEN — Schritt für Schritt

### Schritt 1: Neuen Verein registrieren
1. Gehe auf `vereinbase.de/registrieren`
2. Eingeben:
   - **Vereinsname**: z.B. "TSV Kuchen"
   - **URL-Slug**: z.B. "tsv-kuchen" (wird zu tsv-kuchen.vereinbase.de)
   - **E-Mail**: deine Test-E-Mail
   - **Passwort**: mindestens 8 Zeichen
3. Klick "Registrieren"
4. Du bist jetzt ADMIN des neuen Vereins

### Schritt 2: Onboarding durchlaufen
1. **Logo hochladen** (optional)
2. **Vereinsfarbe wählen** (z.B. Rot für TSV)
3. **Sportarten auswählen** (z.B. Fußball, Handball)
4. **Erstes Team anlegen** (z.B. "E-Jugend", Altersklasse "U10")
5. **Mitglieder einladen** (E-Mails eingeben — funktioniert erst wenn SMTP konfiguriert)

### Schritt 3: Vereinsdaten vervollständigen
Gehe zu **Einstellungen → Vereinsdaten**:
- VR-Nummer, Satzung, Adresse
- Vorstandsmitglieder (1. Vorsitzender, Kassenwart, etc.)
- IBAN für SEPA
- Versicherungen

### Schritt 4: Abteilungen & Teams anlegen
Gehe zu **Einstellungen → Sportbetrieb**:
1. **Abteilung erstellen**: z.B. "Fußball"
2. **Sportarten aktivieren**: Fußball, Handball, etc.
3. **Teams anlegen**: z.B. "Bambini", "E-Jugend 1", "Senioren"
   - Abteilung zuordnen
   - Sportart wählen
   - Altersklasse wählen
   - Trainer wird später zugeordnet

### Schritt 5: Mitglieder anlegen
Gehe zu **Mitglieder & Personal**:
1. Klick "Neues Mitglied anlegen"
2. Name, Geburtsdatum, Sportart, Team-Zuordnung
3. Bei Minderjährigen: Eltern-E-Mail + Foto-/Fahrgemeinschaft-Einverständnis
4. Status auf "Aktiv" setzen → Login wird automatisch erstellt

### Schritt 6: Vorstand & Trainer einrichten
1. Mitglied anlegen (z.B. "Thomas Müller")
2. Im Team als "TRAINER" zuordnen
3. Unter **Einstellungen → Benutzer**: Rolle auf "TRAINER" setzen
4. Für Vorstand: Rolle auf "ADMIN" setzen

### Schritt 7: Workflows für Einladungen
Gehe zu **Workflows**:
1. Workflow "Neues Mitglied Fußball" erstellen
2. PDFs auswählen: Mitgliedsantrag → Datenschutz → Einverständnis (Reihenfolge!)
3. Sportart: Fußball
4. E-Mail-Text anpassen

### Schritt 8: Erste Veranstaltung
Gehe zu **Kalender → Veranstaltungen**:
1. "Neue Veranstaltung" klicken
2. Typ: Training, Datum, Team, Halle
3. Erinnerung wird automatisch 24h + 2h vorher gesendet (wenn SMTP aktiv)

---

## 4. WIE GEHEN MAILS RAUS?

### Übersicht aller E-Mail-Typen:

| Anlass | Wann | An wen | Funktioniert ohne SMTP? |
|--------|------|--------|------------------------|
| Einladung | Manuell (Workflows) | Neues Mitglied | Nein (nur Console-Log) |
| Login-Daten | Bei Mitglied-Aktivierung | Mitglied | Nein |
| Passwort vergessen | Selbst-Service | User | Nein |
| E-Mail-Verifizierung | Nach Registrierung | Admin | Nein |
| Erinnerung (24h/2h) | Automatisch (BullMQ) | Team-Mitglieder | Nein |
| Geburtstag | Täglich 08:00 (CronJob) | Mitglied + Trainer | Nein |
| Notfall-Broadcast | Manuell (Trainer) | Ganzes Team | Nein |
| Zahlungswarnung | Stripe Webhook | Admin | Nein |

### Workaround OHNE SMTP (zum Testen):
```bash
# Mails werden in die Konsole geloggt:
npx pm2 logs vereinbase-backend

# Dort siehst du z.B.:
# [Mail] SMTP nicht konfiguriert. Einladung an max@test.de: https://vereinbase.de/einladung/abc123
# [Mail] Login-Daten an trainer@test.de: Passwort=TempPass123
```

Du kannst die Links/Passwörter aus den Logs kopieren und manuell verwenden.

### Wie der Verein seine E-Mail-Adresse eingibt:
1. Admin geht zu **Einstellungen → E-Mail**
2. SMTP-Server eingeben (z.B. smtp.gmail.com, smtp.web.de, etc.)
3. Benutzername + Passwort
4. Absendername + Signatur
5. "Test-Mail senden" klicken
6. Ab jetzt gehen alle Mails über das Vereins-Konto raus

---

## 5. IMAP POSTEINGANG

### Status:
- IMAP-Poller ist implementiert (alle 5 Min polling)
- Pro Benutzer konfigurierbar unter **Einstellungen → E-Mail**
- Oder global via .env (IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS)
- Posteingang-Seite: **Nachrichten → Posteingang** (nur für Trainer/Admin)

### Konfiguration pro Benutzer:
1. Trainer/Admin geht zu **Einstellungen → E-Mail**
2. IMAP-Server eingeben (z.B. imap.gmail.com:993)
3. Benutzername + Passwort
4. Ab jetzt werden eingehende Mails im Posteingang angezeigt

---

## 6. BETA-LAUNCH CHECKLISTE

### Vor dem ersten Pilotverein:
- [ ] sudo bash scripts/setup-pm2-systemd.sh
- [ ] sudo bash scripts/db-umbenennen.sh
- [ ] SMTP in .env konfigurieren
- [ ] E-Mail-Adressen einrichten (info@, datenschutz@, kuendigung@)
- [ ] Selbst einen Test-Verein registrieren und durchspielen
- [ ] Als PARENT einloggen → nur Kalender, Nachrichten, Pinnwand, Eltern-Portal?
- [ ] Als MEMBER einloggen → kein Ehrenamt, keine Verwaltung?
- [ ] Team ohne Trainer anlegen → funktioniert?
- [ ] HRB-Nummer nach Notartermin eintragen (Impressum)

### Pilotverein onboarden:
- [ ] Verein registriert sich selbst auf vereinbase.de
- [ ] 30 Min gemeinsames Setup-Call (Onboarding durchlaufen)
- [ ] Erste Abteilungen + Teams anlegen
- [ ] 5-10 Mitglieder einladen (Workflow testen)
- [ ] Ersten Trainingsplan im Kalender anlegen
- [ ] Feedback nach 1 Woche sammeln

### Nach 2 Wochen Pilotphase:
- [ ] Stripe einbauen (damit Vereine nach Testphase zahlen)
- [ ] Feedback umsetzen
- [ ] 2-3 weitere Vereine onboarden

---

## 7. SCHNELLTEST-ACCOUNTS (bereits vorhanden)

```
URL: vereinbase.de (oder 192.168.0.151)

admin@vereinbase.de     / Survive1985#  → SUPERADMIN (Plattform)
vorstand@vereinbase.de  / Survive1985#  → ADMIN (Vereins-Vorstand)
trainer@vereinbase.de   / Survive1985#  → TRAINER
spieler@vereinbase.de   / Survive1985#  → MEMBER (Spieler)
eltern@vereinbase.de    / Survive1985#  → PARENT (Elternteil)
```

### So testest du alle Rollen:
1. Einloggen als `vorstand@vereinbase.de` → alles sichtbar
2. Einloggen als `trainer@vereinbase.de` → Mitglieder, Teams, Kalender, kein Ehrenamt
3. Einloggen als `spieler@vereinbase.de` → nur Kalender, Nachrichten, Pinnwand, Galerie
4. Einloggen als `eltern@vereinbase.de` → nur Kalender, Nachrichten, Pinnwand, Eltern-Portal
5. Neuen Account als HALLENWART anlegen → nur Belegungsplan

---

## 8. HÄUFIGE FRAGEN

**"Ich sehe keine Mails?"**
→ SMTP ist nicht konfiguriert. Siehe Abschnitt 2. Temporär: `npx pm2 logs` zeigt alle Mails in der Konsole.

**"Server nicht erreichbar" Banner?"**
→ Der Health-Check geht gegen /api/health. Wenn du über VPN/extern zugreifst, kann das fehlschlagen. Lokal auf 192.168.0.151 funktioniert es.

**"Team anlegen geht nicht?"**
→ Bug war gefixt am 21.03. — abteilungId fehlte im DTO. Jetzt funktioniert es auch ohne Trainer.

**"Wie erstelle ich einen HALLENWART?"**
→ Unter Einstellungen → Benutzer: Neuen Benutzer anlegen mit Rolle "HALLENWART". Dieser sieht nur den Belegungsplan.

**"Wo sehe ich Passwörter für neue Mitglieder?"**
→ Wenn SMTP konfiguriert: per Mail. Ohne SMTP: in `npx pm2 logs vereinbase-backend`.
