'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  ShieldAlert,
  Pencil,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// --- Typen ---

interface Aenderungsantrag {
  id: string;
  feld: string;
  alterWert: string | null;
  neuerWert: string;
  status: 'PENDING' | 'GENEHMIGT' | 'ABGELEHNT';
  erstelltAm: string;
}

interface MeinProfil {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  iban: string | null;
  notfallKontakt: string | null;
  notfallTelefon: string | null;
  sport: string[];
  status: string;
  joinDate: string;
  aenderungsantraege: Aenderungsantrag[];
}

// --- Konstanten ---

const FELD_CONFIG: {
  feld: string;
  label: string;
  icon: typeof Phone;
  placeholder: string;
}[] = [
  { feld: 'phone', label: 'Telefon', icon: Phone, placeholder: 'z.B. +49 170 1234567' },
  { feld: 'address', label: 'Adresse', icon: MapPin, placeholder: 'Straße, PLZ Ort' },
  { feld: 'iban', label: 'IBAN', icon: CreditCard, placeholder: 'DE89 3704 0044 0532 0130 00' },
  { feld: 'notfallKontakt', label: 'Notfallkontakt (Name)', icon: ShieldAlert, placeholder: 'Vor- und Nachname' },
  { feld: 'notfallTelefon', label: 'Notfallkontakt (Telefon)', icon: Phone, placeholder: 'z.B. +49 170 9876543' },
];

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Ausstehend', variant: 'secondary' },
  GENEHMIGT: { label: 'Genehmigt', variant: 'default' },
  ABGELEHNT: { label: 'Abgelehnt', variant: 'destructive' },
};

const FELD_LABEL: Record<string, string> = {
  phone: 'Telefon',
  address: 'Adresse',
  iban: 'IBAN',
  notfallKontakt: 'Notfallkontakt',
  notfallTelefon: 'Notfall-Telefon',
};

// --- Komponente ---

function ProfilFeld({
  feld,
  label,
  icon: Icon,
  placeholder,
  aktuellerWert,
  hatOffenenAntrag,
  onAbsenden,
}: {
  feld: string;
  label: string;
  icon: typeof Phone;
  placeholder: string;
  aktuellerWert: string | null;
  hatOffenenAntrag: boolean;
  onAbsenden: (feld: string, neuerWert: string) => Promise<void>;
}) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [neuerWert, setNeuerWert] = useState('');
  const [laed, setLaed] = useState(false);

  const absenden = async () => {
    if (!neuerWert.trim()) return;
    setLaed(true);
    try {
      await onAbsenden(feld, neuerWert.trim());
      setBearbeiten(false);
      setNeuerWert('');
    } finally {
      setLaed(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {bearbeiten ? (
          <div className="flex gap-2 mt-1">
            <Input
              value={neuerWert}
              onChange={(e) => setNeuerWert(e.target.value)}
              placeholder={placeholder}
              className="h-9"
              onKeyDown={(e) => e.key === 'Enter' && absenden()}
              autoFocus
            />
            <Button
              size="sm"
              onClick={absenden}
              disabled={laed || !neuerWert.trim()}
            >
              {laed ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setBearbeiten(false); setNeuerWert(''); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm">
              {aktuellerWert || <span className="text-muted-foreground italic">Nicht angegeben</span>}
            </p>
            {hatOffenenAntrag ? (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Antrag offen
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setBearbeiten(true)}
              >
                <Pencil className="h-3 w-3 mr-1" /> Ändern
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeinProfilSeite() {
  const [profil, setProfil] = useState<MeinProfil | null>(null);
  const [laed, setLaed] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);

  const profilLaden = useCallback(async () => {
    try {
      setFehler(null);
      const daten = await apiClient.get<MeinProfil>('/mitglieder/mein-profil');
      setProfil(daten);
    } catch (err) {
      setFehler(
        err instanceof Error
          ? err.message
          : 'Profil konnte nicht geladen werden.',
      );
    } finally {
      setLaed(false);
    }
  }, []);

  useEffect(() => {
    profilLaden();
  }, [profilLaden]);

  const antragAbsenden = async (feld: string, neuerWert: string) => {
    try {
      setErfolg(null);
      await apiClient.post('/mitglieder/aenderungsantrag', { feld, neuerWert });
      setErfolg('Änderungsantrag eingereicht. Der Vorstand wird benachrichtigt.');
      await profilLaden();
      // Erfolgsmeldung nach 5 Sekunden ausblenden
      setTimeout(() => setErfolg(null), 5000);
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'Antrag konnte nicht erstellt werden.',
      );
      setTimeout(() => setFehler(null), 5000);
      throw err;
    }
  };

  if (laed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fehler && !profil) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">{fehler}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profil) return null;

  const offeneAntraege = profil.aenderungsantraege.filter(
    (a) => a.status === 'PENDING',
  );
  const offeneFeldNamen = new Set(offeneAntraege.map((a) => a.feld));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mein Profil</h1>
        <p className="text-muted-foreground mt-1">
          Hier können Sie Ihre persönlichen Daten einsehen und Änderungen beantragen.
        </p>
      </div>

      {/* Erfolgsmeldung */}
      {erfolg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {erfolg}
        </div>
      )}

      {/* Fehlermeldung */}
      {fehler && profil && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <XCircle className="h-5 w-5 shrink-0" />
          {fehler}
        </div>
      )}

      {/* Stammdaten (nur lesbar) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Stammdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Mitgliedsnummer</p>
              <p className="font-medium">{profil.memberNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{profil.firstName} {profil.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-Mail</p>
              <p className="font-medium">{profil.email || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Geburtsdatum</p>
              <p className="font-medium">
                {profil.birthDate
                  ? new Date(profil.birthDate).toLocaleDateString('de-DE')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Mitglied seit</p>
              <p className="font-medium">
                {new Date(profil.joinDate).toLocaleDateString('de-DE')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={profil.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {profil.status === 'ACTIVE' ? 'Aktiv' : profil.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Änderbare Felder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pencil className="h-5 w-5" />
            Kontaktdaten ändern
          </CardTitle>
        </CardHeader>
        <CardContent>
          {FELD_CONFIG.map((config) => (
            <ProfilFeld
              key={config.feld}
              feld={config.feld}
              label={config.label}
              icon={config.icon}
              placeholder={config.placeholder}
              aktuellerWert={(profil as unknown as Record<string, unknown>)[config.feld] as string | null}
              hatOffenenAntrag={offeneFeldNamen.has(config.feld)}
              onAbsenden={antragAbsenden}
            />
          ))}
          <p className="text-xs text-muted-foreground mt-4">
            Änderungen müssen vom Vorstand genehmigt werden, bevor sie wirksam werden.
          </p>
        </CardContent>
      </Card>

      {/* Offene Anträge */}
      {offeneAntraege.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Offene Änderungsanträge
              <Badge variant="secondary">{offeneAntraege.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offeneAntraege.map((antrag) => (
                <div
                  key={antrag.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {FELD_LABEL[antrag.feld] || antrag.feld}
                    </p>
                    <p className="text-muted-foreground">
                      {antrag.alterWert || '(leer)'} &rarr; {antrag.neuerWert}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={STATUS_BADGE[antrag.status]?.variant || 'secondary'}>
                      {STATUS_BADGE[antrag.status]?.label || antrag.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(antrag.erstelltAm).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
