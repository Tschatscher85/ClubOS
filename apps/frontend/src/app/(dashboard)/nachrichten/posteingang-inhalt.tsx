'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Mail,
  Send,
  Star,
  Trash2,
  Archive,
  Inbox,
  PenSquare,
  ArrowLeft,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

// -- Typen --

interface Email {
  id: string;
  von: string;
  vonName: string;
  an: string[];
  betreff: string;
  inhalt: string;
  gelesen: boolean;
  istWichtig: boolean;
  ordner: string;
  empfangenAm: string;
}

interface EmailListe {
  emails: Email[];
  gesamt: number;
  ungelesen: number;
  seite: number;
  seiten: number;
}

interface UngelesenAntwort {
  ungelesen: number;
}

type Ordner = 'POSTEINGANG' | 'GESENDET' | 'ENTWUERFE' | 'ARCHIV' | 'PAPIERKORB';

const ORDNER_LISTE: { key: Ordner; label: string; icon: typeof Inbox }[] = [
  { key: 'POSTEINGANG', label: 'Posteingang', icon: Inbox },
  { key: 'GESENDET', label: 'Gesendet', icon: Send },
  { key: 'ENTWUERFE', label: 'Entwuerfe', icon: PenSquare },
  { key: 'ARCHIV', label: 'Archiv', icon: Archive },
  { key: 'PAPIERKORB', label: 'Papierkorb', icon: Trash2 },
];

// -- Hilfsfunktionen --

function datumFormatieren(iso: string): string {
  const d = new Date(iso);
  const jetzt = new Date();
  const diff = jetzt.getTime() - d.getTime();
  const minuten = Math.floor(diff / 60000);
  const stunden = Math.floor(diff / 3600000);

  if (minuten < 1) return 'Gerade eben';
  if (minuten < 60) return `vor ${minuten} Min.`;
  if (stunden < 24) return `vor ${stunden} Std.`;

  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function datumVoll(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// -- Hauptkomponente --

export default function PosteingangInhalt() {
  // Zustand
  const [emails, setEmails] = useState<Email[]>([]);
  const [gesamt, setGesamt] = useState(0);
  const [ungelesenAnzahl, setUngelesenAnzahl] = useState(0);
  const [seite, setSeite] = useState(1);
  const [seiten, setSeiten] = useState(1);
  const [aktuellerOrdner, setAktuellerOrdner] = useState<Ordner>('POSTEINGANG');
  const [gewaehlteEmail, setGewaehlteEmail] = useState<Email | null>(null);
  const [ladend, setLadend] = useState(true);
  const [suchtext, setSuchtext] = useState('');
  const [verfassenOffen, setVerfassenOffen] = useState(false);
  const [mobilAnsicht, setMobilAnsicht] = useState<'ordner' | 'liste' | 'detail'>('liste');

  // Verfassen-Formular
  const [neueAn, setNeueAn] = useState('');
  const [neueBetreff, setNeueBetreff] = useState('');
  const [neueInhalt, setNeueInhalt] = useState('');
  const [sendend, setSendend] = useState(false);

  // Auto-Refresh
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- API-Aufrufe --

  const emailsLaden = useCallback(async (ordner: Ordner, s: number) => {
    setLadend(true);
    try {
      if (ordner === 'ENTWUERFE') {
        const daten = await apiClient.get<Email[]>('/posteingang/entwuerfe');
        setEmails(daten);
        setGesamt(daten.length);
        setSeiten(1);
      } else {
        const daten = await apiClient.get<EmailListe>(
          `/posteingang?ordner=${ordner}&seite=${s}`,
        );
        setEmails(daten.emails);
        setGesamt(daten.gesamt);
        setUngelesenAnzahl(daten.ungelesen);
        setSeite(daten.seite);
        setSeiten(daten.seiten);
      }
    } catch (error) {
      console.error('Fehler beim Laden der E-Mails:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  const ungelesenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<UngelesenAntwort>('/posteingang/ungelesen');
      setUngelesenAnzahl(daten.ungelesen);
    } catch {
      // Fehler still ignorieren
    }
  }, []);

  const emailOeffnen = useCallback(async (email: Email) => {
    try {
      const detail = await apiClient.get<Email>(`/posteingang/${email.id}`);
      setGewaehlteEmail(detail);
      setMobilAnsicht('detail');
      // Aktualisiere Gelesen-Status in der Liste
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, gelesen: true } : e)),
      );
    } catch (error) {
      console.error('Fehler beim Oeffnen der E-Mail:', error);
    }
  }, []);

  const wichtigToggle = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/posteingang/${id}/wichtig`, {});
      setEmails((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, istWichtig: !e.istWichtig } : e,
        ),
      );
      setGewaehlteEmail((prev) =>
        prev && prev.id === id ? { ...prev, istWichtig: !prev.istWichtig } : prev,
      );
    } catch (error) {
      console.error('Fehler:', error);
    }
  }, []);

  const archivieren = useCallback(
    async (id: string) => {
      try {
        await apiClient.put(`/posteingang/${id}/verschieben`, { ordner: 'ARCHIV' });
        setGewaehlteEmail(null);
        emailsLaden(aktuellerOrdner, seite);
      } catch (error) {
        console.error('Fehler:', error);
      }
    },
    [aktuellerOrdner, seite, emailsLaden],
  );

  const loeschen = useCallback(
    async (id: string) => {
      if (!confirm('E-Mail in den Papierkorb verschieben?')) return;
      try {
        await apiClient.delete(`/posteingang/${id}`);
        setGewaehlteEmail(null);
        emailsLaden(aktuellerOrdner, seite);
      } catch (error) {
        console.error('Fehler:', error);
      }
    },
    [aktuellerOrdner, seite, emailsLaden],
  );

  const emailSenden = useCallback(async () => {
    if (!neueAn || !neueBetreff || !neueInhalt) return;
    setSendend(true);
    try {
      const empfaenger = neueAn.split(',').map((e) => e.trim()).filter(Boolean);
      await apiClient.post('/posteingang/senden', {
        an: empfaenger,
        betreff: neueBetreff,
        inhalt: neueInhalt,
      });
      setVerfassenOffen(false);
      setNeueAn('');
      setNeueBetreff('');
      setNeueInhalt('');
      emailsLaden(aktuellerOrdner, seite);
    } catch (error) {
      console.error('Fehler beim Senden:', error);
    } finally {
      setSendend(false);
    }
  }, [neueAn, neueBetreff, neueInhalt, aktuellerOrdner, seite, emailsLaden]);

  const entwurfSpeichern = useCallback(async () => {
    try {
      const empfaenger = neueAn.split(',').map((e) => e.trim()).filter(Boolean);
      await apiClient.post('/posteingang/entwurf', {
        an: empfaenger,
        betreff: neueBetreff,
        inhalt: neueInhalt,
      });
      setVerfassenOffen(false);
      setNeueAn('');
      setNeueBetreff('');
      setNeueInhalt('');
    } catch (error) {
      console.error('Fehler beim Speichern des Entwurfs:', error);
    }
  }, [neueAn, neueBetreff, neueInhalt]);

  // -- Effekte --

  useEffect(() => {
    emailsLaden(aktuellerOrdner, seite);
  }, [aktuellerOrdner, seite, emailsLaden]);

  useEffect(() => {
    ungelesenLaden();
    refreshInterval.current = setInterval(ungelesenLaden, 30000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [ungelesenLaden]);

  // -- Ordner wechseln --

  const ordnerWechseln = (ordner: Ordner) => {
    setAktuellerOrdner(ordner);
    setSeite(1);
    setGewaehlteEmail(null);
    setMobilAnsicht('liste');
  };

  // -- Gefilterte E-Mails --

  const gefilterteEmails = suchtext
    ? emails.filter(
        (e) =>
          e.betreff.toLowerCase().includes(suchtext.toLowerCase()) ||
          e.vonName.toLowerCase().includes(suchtext.toLowerCase()) ||
          e.von.toLowerCase().includes(suchtext.toLowerCase()),
      )
    : emails;

  // -- Render: Ordner-Sidebar --

  const ordnerSidebar = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          className="w-full"
          onClick={() => setVerfassenOffen(true)}
        >
          <PenSquare className="h-4 w-4 mr-2" />
          Neue E-Mail
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {ORDNER_LISTE.map((o) => {
          const Icon = o.icon;
          const istAktiv = aktuellerOrdner === o.key;
          return (
            <button
              key={o.key}
              onClick={() => ordnerWechseln(o.key)}
              className={`
                flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors
                ${istAktiv ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{o.label}</span>
              {o.key === 'POSTEINGANG' && ungelesenAnzahl > 0 && (
                <Badge variant={istAktiv ? 'secondary' : 'default'} className="text-xs">
                  {ungelesenAnzahl}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  // -- Render: E-Mail-Liste --

  const emailListe = (
    <div className="flex flex-col h-full">
      {/* Suchleiste */}
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="E-Mails durchsuchen..."
            value={suchtext}
            onChange={(e) => setSuchtext(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => emailsLaden(aktuellerOrdner, seite)}
          title="Aktualisieren"
        >
          <RefreshCw className={`h-4 w-4 ${ladend ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Ordner-Info Mobil */}
      <div className="px-3 py-2 border-b flex items-center justify-between lg:hidden">
        <button
          onClick={() => setMobilAnsicht('ordner')}
          className="text-sm text-muted-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Ordner
        </button>
        <span className="text-sm font-medium">
          {ORDNER_LISTE.find((o) => o.key === aktuellerOrdner)?.label}
        </span>
        <span className="text-xs text-muted-foreground">{gesamt} E-Mails</span>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {ladend ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground text-sm">
              E-Mails werden geladen...
            </div>
          </div>
        ) : gefilterteEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Mail className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Keine E-Mails in diesem Ordner</p>
          </div>
        ) : (
          gefilterteEmails.map((email) => (
            <button
              key={email.id}
              onClick={() => emailOeffnen(email)}
              className={`
                w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/50
                ${gewaehlteEmail?.id === email.id ? 'bg-muted' : ''}
                ${!email.gelesen ? 'bg-primary/5' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm truncate ${!email.gelesen ? 'font-bold' : ''}`}
                    >
                      {email.vonName || email.von}
                    </span>
                    {email.istWichtig && (
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-sm truncate ${!email.gelesen ? 'font-semibold' : 'text-muted-foreground'}`}
                  >
                    {email.betreff}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {email.inhalt?.substring(0, 80)}...
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {datumFormatieren(email.empfangenAm)}
                  </span>
                  {!email.gelesen && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {seiten > 1 && (
        <div className="p-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={seite <= 1}
            onClick={() => setSeite((s) => s - 1)}
          >
            Zurueck
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {seite} von {seiten}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={seite >= seiten}
            onClick={() => setSeite((s) => s + 1)}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  );

  // -- Render: E-Mail-Detail --

  const emailDetail = gewaehlteEmail ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={() => {
            setGewaehlteEmail(null);
            setMobilAnsicht('liste');
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="lg:hidden">Zurück</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => wichtigToggle(gewaehlteEmail.id)}
            title={gewaehlteEmail.istWichtig ? 'Nicht mehr wichtig' : 'Als wichtig markieren'}
          >
            <Star
              className={`h-4 w-4 ${
                gewaehlteEmail.istWichtig
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => archivieren(gewaehlteEmail.id)}
            title="Archivieren"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loeschen(gewaehlteEmail.id)}
            title="Loeschen"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xl font-bold">{gewaehlteEmail.betreff}</h2>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              {gewaehlteEmail.vonName || gewaehlteEmail.von}
            </p>
            <p className="text-xs text-muted-foreground">{gewaehlteEmail.von}</p>
            <p className="text-xs text-muted-foreground mt-1">
              An: {gewaehlteEmail.an?.join(', ')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {datumVoll(gewaehlteEmail.empfangenAm)}
          </p>
        </div>

        <hr />

        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {gewaehlteEmail.inhalt}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <Mail className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-sm">Waehlen Sie eine E-Mail aus</p>
    </div>
  );

  // -- Render: Verfassen-Dialog --

  const verfassenDialog = (
    <Dialog open={verfassenOffen} onOpenChange={setVerfassenOffen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenSquare className="h-5 w-5" />
            Neue E-Mail verfassen
          </DialogTitle>
          <DialogDescription>
            Senden Sie eine E-Mail an ein oder mehrere Empfaenger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-an">An</Label>
            <Input
              id="email-an"
              placeholder="empfaenger@example.de (mehrere mit Komma trennen)"
              value={neueAn}
              onChange={(e) => setNeueAn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-betreff">Betreff</Label>
            <Input
              id="email-betreff"
              placeholder="Betreff der E-Mail"
              value={neueBetreff}
              onChange={(e) => setNeueBetreff(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-inhalt">Nachricht</Label>
            <Textarea
              id="email-inhalt"
              placeholder="Ihre Nachricht..."
              value={neueInhalt}
              onChange={(e) => setNeueInhalt(e.target.value)}
              rows={8}
            />
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={entwurfSpeichern}
              disabled={!neueBetreff && !neueInhalt}
            >
              Als Entwurf speichern
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setVerfassenOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={emailSenden}
                disabled={!neueAn || !neueBetreff || !neueInhalt || sendend}
              >
                {sendend ? (
                  'Wird gesendet...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // -- Render: Desktop-Layout --

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Posteingang</h1>
          <p className="text-muted-foreground">
            {ungelesenAnzahl > 0
              ? `${ungelesenAnzahl} ungelesene E-Mail${ungelesenAnzahl !== 1 ? 's' : ''}`
              : 'Keine ungelesenen E-Mails'}
          </p>
        </div>
      </div>

      {/* Desktop: 3-Spalten-Layout */}
      <div className="hidden lg:grid lg:grid-cols-[220px_1fr_1fr] border rounded-lg bg-card overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Ordner-Sidebar */}
        <div className="border-r">
          {ordnerSidebar}
        </div>

        {/* E-Mail-Liste */}
        <div className="border-r">
          {emailListe}
        </div>

        {/* Detail-Ansicht */}
        <div>
          {emailDetail}
        </div>
      </div>

      {/* Mobil: Gestapelte Ansichten */}
      <div className="lg:hidden border rounded-lg bg-card overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {mobilAnsicht === 'ordner' && (
          <div className="h-full">
            {ordnerSidebar}
          </div>
        )}

        {mobilAnsicht === 'liste' && (
          <div className="h-full">
            {emailListe}
          </div>
        )}

        {mobilAnsicht === 'detail' && (
          <div className="h-full">
            {emailDetail}
          </div>
        )}
      </div>

      {/* Mobil: Ordner-Button wenn in Liste */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <Button
          className="rounded-full shadow-lg"
          size="icon"
          onClick={() => setVerfassenOffen(true)}
        >
          <PenSquare className="h-5 w-5" />
        </Button>
      </div>

      {verfassenDialog}
    </div>
  );
}
