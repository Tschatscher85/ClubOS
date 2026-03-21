'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  Search,
  MapPin,
  Euro,
  Calendar,
  Users,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Dumbbell,
  Shirt,
  Trophy,
  Gavel,
  Swords,
  Package,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Inserat {
  id: string;
  tenantId: string;
  tenant: Tenant;
  erstelltVon: string;
  kategorie: InseratKategorie;
  typ: InseratTyp;
  titel: string;
  beschreibung: string;
  sportart: string | null;
  bildUrl: string | null;
  preis: number | null;
  plz: string;
  ort: string;
  kontaktEmail: string;
  kontaktTelefon: string | null;
  datum: string | null;
  altersgruppe: string | null;
  aktiv: boolean;
  ablaufDatum: string | null;
  erstelltAm: string;
  _count: { bewerbungen: number };
  bewerbungen?: Bewerbung[];
}

interface Bewerbung {
  id: string;
  inseratId: string;
  bewerberTenantId: string;
  bewerberUserId: string;
  bewerberName: string;
  nachricht: string;
  kontaktEmail: string;
  status: BewerbungStatus;
  erstelltAm: string;
  inserat?: {
    id: string;
    titel: string;
    kategorie: InseratKategorie;
    typ: InseratTyp;
  };
}

type InseratKategorie =
  | 'SPORTGERAETE'
  | 'TRIKOTS'
  | 'TRAINER'
  | 'FREUNDSCHAFTSSPIEL'
  | 'TURNIER'
  | 'SCHIEDSRICHTER'
  | 'SONSTIGES';

type InseratTyp = 'ANGEBOT' | 'GESUCH';
type BewerbungStatus = 'NEU' | 'KONTAKTIERT' | 'ABGELEHNT' | 'ERLEDIGT';

// ==================== Konstanten ====================

const KATEGORIE_KONFIG: Record<
  InseratKategorie,
  { label: string; farbe: string; badgeClass: string; icon: typeof Store }
> = {
  SPORTGERAETE: {
    label: 'Sportgeräte',
    farbe: 'green',
    badgeClass: 'bg-green-100 text-green-700',
    icon: Dumbbell,
  },
  TRIKOTS: {
    label: 'Trikots & Ausrüstung',
    farbe: 'blue',
    badgeClass: 'bg-blue-100 text-blue-700',
    icon: Shirt,
  },
  TRAINER: {
    label: 'Trainer',
    farbe: 'purple',
    badgeClass: 'bg-purple-100 text-purple-700',
    icon: Users,
  },
  FREUNDSCHAFTSSPIEL: {
    label: 'Freundschaftsspiel',
    farbe: 'orange',
    badgeClass: 'bg-orange-100 text-orange-700',
    icon: Swords,
  },
  TURNIER: {
    label: 'Turnier',
    farbe: 'red',
    badgeClass: 'bg-red-100 text-red-700',
    icon: Trophy,
  },
  SCHIEDSRICHTER: {
    label: 'Schiedsrichter',
    farbe: 'yellow',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    icon: Gavel,
  },
  SONSTIGES: {
    label: 'Sonstiges',
    farbe: 'gray',
    badgeClass: 'bg-gray-100 text-gray-700',
    icon: Package,
  },
};

const TYP_KONFIG: Record<InseratTyp, { label: string; badgeClass: string }> = {
  ANGEBOT: { label: 'Angebot', badgeClass: 'bg-emerald-100 text-emerald-700' },
  GESUCH: { label: 'Gesuch', badgeClass: 'bg-amber-100 text-amber-700' },
};

const STATUS_KONFIG: Record<BewerbungStatus, { label: string; badgeClass: string }> = {
  NEU: { label: 'Neu', badgeClass: 'bg-blue-100 text-blue-700' },
  KONTAKTIERT: { label: 'Kontaktiert', badgeClass: 'bg-green-100 text-green-700' },
  ABGELEHNT: { label: 'Abgelehnt', badgeClass: 'bg-red-100 text-red-700' },
  ERLEDIGT: { label: 'Erledigt', badgeClass: 'bg-gray-100 text-gray-700' },
};

const SPORTARTEN = [
  'FUSSBALL',
  'HANDBALL',
  'BASKETBALL',
  'VOLLEYBALL',
  'TENNIS',
  'TISCHTENNIS',
  'TURNEN',
  'SCHWIMMEN',
  'LEICHTATHLETIK',
  'HOCKEY',
  'BADMINTON',
  'RUGBY',
  'SONSTIGE',
];

const ALTERSGRUPPEN = [
  'Bambini',
  'U7',
  'U8',
  'U9',
  'U10',
  'U11',
  'U12',
  'U13',
  'U14',
  'U15',
  'U16',
  'U17',
  'U18',
  'U19',
  'U21',
  'Senioren',
  'Ü30',
  'Ü40',
  'Ü50',
];

// ==================== Hilfs-Funktionen ====================

function formatDatum(datum: string): string {
  return new Date(datum).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPreis(preis: number | null): string {
  if (preis === null || preis === undefined) return 'Kostenlos / VB';
  if (preis === 0) return 'Kostenlos';
  return `${preis.toFixed(2).replace('.', ',')} €`;
}

// ==================== Komponenten ====================

function InseratKarte({
  inserat,
  istEigenes,
  onBewerben,
  onBearbeiten,
  onLoeschen,
  onDetails,
}: {
  inserat: Inserat;
  istEigenes: boolean;
  onBewerben?: (inserat: Inserat) => void;
  onBearbeiten?: (inserat: Inserat) => void;
  onLoeschen?: (inserat: Inserat) => void;
  onDetails?: (inserat: Inserat) => void;
}) {
  const katKonfig = KATEGORIE_KONFIG[inserat.kategorie];
  const typKonfig = TYP_KONFIG[inserat.typ];
  const KatIcon = katKonfig.icon;

  const zeigeDatum = ['TRAINER', 'FREUNDSCHAFTSSPIEL', 'TURNIER', 'SCHIEDSRICHTER'].includes(
    inserat.kategorie,
  );
  const zeigePreis = ['SPORTGERAETE', 'TRIKOTS', 'SONSTIGES'].includes(inserat.kategorie);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className={katKonfig.badgeClass}>
                <KatIcon className="h-3 w-3 mr-1" />
                {katKonfig.label}
              </Badge>
              <Badge className={typKonfig.badgeClass}>{typKonfig.label}</Badge>
              {inserat.sportart && (
                <Badge variant="outline">{inserat.sportart}</Badge>
              )}
              {!inserat.aktiv && (
                <Badge className="bg-red-100 text-red-700">Inaktiv</Badge>
              )}
            </div>

            {/* Titel */}
            <h3 className="font-semibold text-base mb-1 truncate">{inserat.titel}</h3>

            {/* Beschreibung */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {inserat.beschreibung}
            </p>

            {/* Meta-Informationen */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {inserat.plz} {inserat.ort}
              </span>
              <span className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                {inserat.tenant.name}
              </span>
              {zeigePreis && (
                <span className="flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  {formatPreis(inserat.preis)}
                </span>
              )}
              {zeigeDatum && inserat.datum && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDatum(inserat.datum)}
                </span>
              )}
              {inserat.altersgruppe && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {inserat.altersgruppe}
                </span>
              )}
            </div>

            {/* Erstelldatum */}
            <p className="text-xs text-muted-foreground mt-2">
              Erstellt am {formatDatum(inserat.erstelltAm)}
            </p>
          </div>

          {/* Bild */}
          {inserat.bildUrl && (
            <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={inserat.bildUrl}
                alt={inserat.titel}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          {istEigenes ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDetails?.(inserat)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Details
                {inserat._count.bewerbungen > 0 && (
                  <Badge className="ml-1.5 bg-primary text-primary-foreground h-5 px-1.5 text-xs">
                    {inserat._count.bewerbungen}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBearbeiten?.(inserat)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onLoeschen?.(inserat)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Löschen
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onBewerben?.(inserat)}>
              <Send className="h-3.5 w-3.5 mr-1" />
              Anfragen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Hauptseite ====================

export default function MarktplatzSeite() {
  const benutzer = useBenutzer();

  // Daten
  const [alleInserate, setAlleInserate] = useState<Inserat[]>([]);
  const [meineInserate, setMeineInserate] = useState<Inserat[]>([]);
  const [bewerbungen, setBewerbungen] = useState<Bewerbung[]>([]);
  const [laden, setLaden] = useState(true);

  // Filter
  const [filterKategorie, setFilterKategorie] = useState<string>('');
  const [filterTyp, setFilterTyp] = useState<string>('');
  const [filterSportart, setFilterSportart] = useState<string>('');
  const [filterPlz, setFilterPlz] = useState<string>('');
  const [filterUmkreis, setFilterUmkreis] = useState<string>('50');
  const [filterSuche, setFilterSuche] = useState<string>('');

  // Dialoge
  const [erstellenDialog, setErstellenDialog] = useState(false);
  const [bewerbenDialog, setBewerbenDialog] = useState<Inserat | null>(null);
  const [detailDialog, setDetailDialog] = useState<Inserat | null>(null);
  const [bearbeitenInserat, setBearbeitenInserat] = useState<Inserat | null>(null);

  // Formular-State fuer Erstellen/Bearbeiten
  const [formKategorie, setFormKategorie] = useState<InseratKategorie>('SPORTGERAETE');
  const [formTyp, setFormTyp] = useState<InseratTyp>('ANGEBOT');
  const [formTitel, setFormTitel] = useState('');
  const [formBeschreibung, setFormBeschreibung] = useState('');
  const [formSportart, setFormSportart] = useState('');
  const [formPreis, setFormPreis] = useState('');
  const [formKostenlos, setFormKostenlos] = useState(true);
  const [formBildUrl, setFormBildUrl] = useState('');
  const [formDatum, setFormDatum] = useState('');
  const [formAltersgruppe, setFormAltersgruppe] = useState('');
  const [formKontaktEmail, setFormKontaktEmail] = useState('');
  const [formKontaktTelefon, setFormKontaktTelefon] = useState('');
  const [formAblaufDatum, setFormAblaufDatum] = useState('');

  // Bewerbungs-Formular
  const [bewerbungNachricht, setBewerbungNachricht] = useState('');
  const [bewerbungEmail, setBewerbungEmail] = useState('');

  const [speichern, setSpeichern] = useState(false);

  // ==================== Daten laden ====================

  const alleInserateLaden = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterKategorie) params.set('kategorie', filterKategorie);
      if (filterTyp) params.set('typ', filterTyp);
      if (filterSportart) params.set('sportart', filterSportart);
      if (filterPlz) {
        params.set('plz', filterPlz);
        params.set('umkreis', filterUmkreis);
      }
      if (filterSuche) params.set('suche', filterSuche);

      const qs = params.toString();
      const daten = await apiClient.get<Inserat[]>(`/marktplatz${qs ? `?${qs}` : ''}`);
      setAlleInserate(daten);
    } catch (fehler) {
      console.error('Fehler beim Laden der Inserate:', fehler);
    }
  }, [filterKategorie, filterTyp, filterSportart, filterPlz, filterUmkreis, filterSuche]);

  const meineInserateLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Inserat[]>('/marktplatz/meine');
      setMeineInserate(daten);
    } catch (fehler) {
      console.error('Fehler beim Laden der eigenen Inserate:', fehler);
    }
  }, []);

  const bewerbungenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Bewerbung[]>('/marktplatz/bewerbungen-eingehend');
      setBewerbungen(daten);
    } catch (fehler) {
      console.error('Fehler beim Laden der Bewerbungen:', fehler);
    }
  }, []);

  useEffect(() => {
    Promise.all([alleInserateLaden(), meineInserateLaden(), bewerbungenLaden()])
      .finally(() => setLaden(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter-Aenderungen neu laden
  useEffect(() => {
    alleInserateLaden();
  }, [alleInserateLaden]);

  // ==================== Formular zuruecksetzen ====================

  const formularZuruecksetzen = () => {
    setFormKategorie('SPORTGERAETE');
    setFormTyp('ANGEBOT');
    setFormTitel('');
    setFormBeschreibung('');
    setFormSportart('');
    setFormPreis('');
    setFormKostenlos(true);
    setFormBildUrl('');
    setFormDatum('');
    setFormAltersgruppe('');
    setFormKontaktEmail('');
    setFormKontaktTelefon('');
    setFormAblaufDatum('');
    setBearbeitenInserat(null);
  };

  const formularMitInseratFuellen = (inserat: Inserat) => {
    setFormKategorie(inserat.kategorie);
    setFormTyp(inserat.typ);
    setFormTitel(inserat.titel);
    setFormBeschreibung(inserat.beschreibung);
    setFormSportart(inserat.sportart || '');
    setFormPreis(inserat.preis !== null ? String(inserat.preis) : '');
    setFormKostenlos(inserat.preis === null || inserat.preis === 0);
    setFormBildUrl(inserat.bildUrl || '');
    setFormDatum(inserat.datum ? inserat.datum.substring(0, 10) : '');
    setFormAltersgruppe(inserat.altersgruppe || '');
    setFormKontaktEmail(inserat.kontaktEmail);
    setFormKontaktTelefon(inserat.kontaktTelefon || '');
    setFormAblaufDatum(inserat.ablaufDatum ? inserat.ablaufDatum.substring(0, 10) : '');
    setBearbeitenInserat(inserat);
  };

  // ==================== Inserat erstellen/bearbeiten ====================

  const inseratSpeichern = async () => {
    if (!formTitel.trim() || !formBeschreibung.trim()) return;
    setSpeichern(true);

    try {
      const daten = {
        kategorie: formKategorie,
        typ: formTyp,
        titel: formTitel.trim(),
        beschreibung: formBeschreibung.trim(),
        sportart: formSportart || undefined,
        bildUrl: formBildUrl || undefined,
        preis: formKostenlos ? null : (formPreis ? parseFloat(formPreis) : null),
        kontaktEmail: formKontaktEmail || undefined,
        kontaktTelefon: formKontaktTelefon || undefined,
        datum: formDatum || undefined,
        altersgruppe: formAltersgruppe || undefined,
        ablaufDatum: formAblaufDatum || undefined,
      };

      if (bearbeitenInserat) {
        await apiClient.put(`/marktplatz/${bearbeitenInserat.id}`, daten);
      } else {
        await apiClient.post('/marktplatz', daten);
      }

      setErstellenDialog(false);
      formularZuruecksetzen();
      await Promise.all([alleInserateLaden(), meineInserateLaden()]);
    } catch (fehler) {
      console.error('Fehler beim Speichern:', fehler);
    } finally {
      setSpeichern(false);
    }
  };

  // ==================== Inserat loeschen ====================

  const inseratLoeschen = async (inserat: Inserat) => {
    if (!confirm(`Inserat "${inserat.titel}" wirklich löschen?`)) return;

    try {
      await apiClient.delete(`/marktplatz/${inserat.id}`);
      await Promise.all([alleInserateLaden(), meineInserateLaden()]);
    } catch (fehler) {
      console.error('Fehler beim Löschen:', fehler);
    }
  };

  // ==================== Bewerben ====================

  const bewerbungAbsenden = async () => {
    if (!bewerbenDialog || !bewerbungNachricht.trim()) return;
    setSpeichern(true);

    try {
      await apiClient.post(`/marktplatz/${bewerbenDialog.id}/bewerben`, {
        nachricht: bewerbungNachricht.trim(),
        kontaktEmail: bewerbungEmail || undefined,
      });
      setBewerbenDialog(null);
      setBewerbungNachricht('');
      setBewerbungEmail('');
    } catch (fehler) {
      console.error('Fehler beim Bewerben:', fehler);
    } finally {
      setSpeichern(false);
    }
  };

  // ==================== Bewerbungsstatus ====================

  const bewerbungStatusAendern = async (bewerbungId: string, status: BewerbungStatus) => {
    try {
      await apiClient.put(`/marktplatz/bewerbung/${bewerbungId}/status`, { status });
      await bewerbungenLaden();
    } catch (fehler) {
      console.error('Fehler beim Status-Update:', fehler);
    }
  };

  // ==================== Detail-Dialog (Bewerbungen laden) ====================

  const detailsAnzeigen = async (inserat: Inserat) => {
    try {
      const detail = await apiClient.get<Inserat>(`/marktplatz/${inserat.id}`);
      setDetailDialog(detail);
    } catch (fehler) {
      console.error('Fehler beim Laden der Details:', fehler);
    }
  };

  // ==================== Render ====================

  if (laden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Marktplatz wird geladen...</div>
      </div>
    );
  }

  const zeigeDatumFelder = ['TRAINER', 'FREUNDSCHAFTSSPIEL', 'TURNIER', 'SCHIEDSRICHTER'].includes(
    formKategorie,
  );
  const zeigePreisFelder = ['SPORTGERAETE', 'TRIKOTS', 'SONSTIGES'].includes(formKategorie);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            Marktplatz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vereinsübergreifender Marktplatz — Geräte, Trainer, Spiele und mehr
          </p>
        </div>
        <Button
          onClick={() => {
            formularZuruecksetzen();
            setErstellenDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Inserat erstellen
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="marktplatz">
        <TabsList>
          <TabsTrigger value="marktplatz">
            Marktplatz
            {alleInserate.length > 0 && (
              <Badge className="ml-1.5 bg-primary/10 text-primary h-5 px-1.5 text-xs">
                {alleInserate.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="meine">
            Unsere Inserate
            {meineInserate.length > 0 && (
              <Badge className="ml-1.5 bg-primary/10 text-primary h-5 px-1.5 text-xs">
                {meineInserate.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bewerbungen">
            Bewerbungen
            {bewerbungen.filter((b) => b.status === 'NEU').length > 0 && (
              <Badge className="ml-1.5 bg-red-100 text-red-700 h-5 px-1.5 text-xs">
                {bewerbungen.filter((b) => b.status === 'NEU').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ==================== Tab 1: Marktplatz ==================== */}
        <TabsContent value="marktplatz">
          {/* Filter */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <Select
                    value={filterKategorie}
                    onChange={(e) => setFilterKategorie(e.target.value)}
                  >
                    <option value="">Alle Kategorien</option>
                    {Object.entries(KATEGORIE_KONFIG).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Select
                    value={filterTyp}
                    onChange={(e) => setFilterTyp(e.target.value)}
                  >
                    <option value="">Angebote & Gesuche</option>
                    <option value="ANGEBOT">Nur Angebote</option>
                    <option value="GESUCH">Nur Gesuche</option>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filterSportart}
                    onChange={(e) => setFilterSportart(e.target.value)}
                  >
                    <option value="">Alle Sportarten</option>
                    {SPORTARTEN.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="PLZ"
                    value={filterPlz}
                    onChange={(e) => setFilterPlz(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Select
                    value={filterUmkreis}
                    onChange={(e) => setFilterUmkreis(e.target.value)}
                    disabled={!filterPlz}
                  >
                    <option value="20">~20 km</option>
                    <option value="50">~50 km</option>
                  </Select>
                </div>
                <div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suche..."
                      value={filterSuche}
                      onChange={(e) => setFilterSuche(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kategorie-Chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setFilterKategorie('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !filterKategorie
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Alle
            </button>
            {Object.entries(KATEGORIE_KONFIG).map(([key, val]) => {
              const KatIcon = val.icon;
              return (
                <button
                  key={key}
                  onClick={() => setFilterKategorie(filterKategorie === key ? '' : key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    filterKategorie === key
                      ? val.badgeClass
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <KatIcon className="h-3 w-3" />
                  {val.label}
                </button>
              );
            })}
          </div>

          {/* Inserat-Liste */}
          {alleInserate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Keine Inserate gefunden</p>
              <p className="text-sm">
                Passen Sie die Filter an oder erstellen Sie das erste Inserat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {alleInserate.map((inserat) => (
                <InseratKarte
                  key={inserat.id}
                  inserat={inserat}
                  istEigenes={inserat.tenantId === benutzer?.tenantId}
                  onBewerben={(i) => {
                    setBewerbenDialog(i);
                    setBewerbungNachricht('');
                    setBewerbungEmail('');
                  }}
                  onBearbeiten={(i) => {
                    formularMitInseratFuellen(i);
                    setErstellenDialog(true);
                  }}
                  onLoeschen={inseratLoeschen}
                  onDetails={detailsAnzeigen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ==================== Tab 2: Unsere Inserate ==================== */}
        <TabsContent value="meine">
          {meineInserate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Noch keine Inserate erstellt</p>
              <p className="text-sm">Erstellen Sie Ihr erstes Inserat, um loszulegen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {meineInserate.map((inserat) => (
                <InseratKarte
                  key={inserat.id}
                  inserat={inserat}
                  istEigenes={true}
                  onBearbeiten={(i) => {
                    formularMitInseratFuellen(i);
                    setErstellenDialog(true);
                  }}
                  onLoeschen={inseratLoeschen}
                  onDetails={detailsAnzeigen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ==================== Tab 3: Bewerbungen ==================== */}
        <TabsContent value="bewerbungen">
          {bewerbungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Keine Bewerbungen</p>
              <p className="text-sm">
                Sobald andere Vereine auf Ihre Inserate antworten, erscheinen sie hier.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bewerbungen.map((bewerbung) => (
                <Card key={bewerbung.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {bewerbung.bewerberName}
                          </span>
                          <Badge className={STATUS_KONFIG[bewerbung.status].badgeClass}>
                            {STATUS_KONFIG[bewerbung.status].label}
                          </Badge>
                        </div>
                        {bewerbung.inserat && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Auf: &quot;{bewerbung.inserat.titel}&quot; ({KATEGORIE_KONFIG[bewerbung.inserat.kategorie]?.label})
                          </p>
                        )}
                        <p className="text-sm mb-2">{bewerbung.nachricht}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDatum(bewerbung.erstelltAm)}</span>
                          <span>{bewerbung.kontaktEmail}</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        {bewerbung.status === 'NEU' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                bewerbungStatusAendern(bewerbung.id, 'KONTAKTIERT')
                              }
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Kontaktieren
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() =>
                                bewerbungStatusAendern(bewerbung.id, 'ABGELEHNT')
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Ablehnen
                            </Button>
                          </>
                        )}
                        {bewerbung.status === 'KONTAKTIERT' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              bewerbungStatusAendern(bewerbung.id, 'ERLEDIGT')
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Erledigt
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Dialog: Inserat erstellen/bearbeiten ==================== */}
      <Dialog
        open={erstellenDialog}
        onOpenChange={(open) => {
          if (!open) {
            formularZuruecksetzen();
          }
          setErstellenDialog(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bearbeitenInserat ? 'Inserat bearbeiten' : 'Neues Inserat erstellen'}
            </DialogTitle>
            <DialogDescription>
              {bearbeitenInserat
                ? 'Ändern Sie die Angaben und speichern Sie.'
                : 'Erstellen Sie ein Inserat, das für alle Vereine sichtbar ist.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Kategorie + Typ */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie *</Label>
                <Select
                  value={formKategorie}
                  onChange={(e) => setFormKategorie(e.target.value as InseratKategorie)}
                >
                  {Object.entries(KATEGORIE_KONFIG).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Typ *</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormTyp('ANGEBOT')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      formTyp === 'ANGEBOT'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                    }`}
                  >
                    Angebot
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTyp('GESUCH')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      formTyp === 'GESUCH'
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                    }`}
                  >
                    Gesuch
                  </button>
                </div>
              </div>
            </div>

            {/* Titel */}
            <div>
              <Label>Titel *</Label>
              <Input
                value={formTitel}
                onChange={(e) => setFormTitel(e.target.value)}
                placeholder="z.B. 10 Fußbälle abzugeben"
              />
            </div>

            {/* Beschreibung */}
            <div>
              <Label>Beschreibung *</Label>
              <Textarea
                value={formBeschreibung}
                onChange={(e) => setFormBeschreibung(e.target.value)}
                placeholder="Beschreiben Sie Ihr Angebot oder Gesuch ausführlich..."
                rows={4}
              />
            </div>

            {/* Sportart */}
            <div>
              <Label>Sportart (optional)</Label>
              <Select
                value={formSportart}
                onChange={(e) => setFormSportart(e.target.value)}
              >
                <option value="">Keine Angabe</option>
                {SPORTARTEN.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>

            {/* Preis (nur bei bestimmten Kategorien) */}
            {zeigePreisFelder && (
              <div>
                <Label>Preis</Label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formKostenlos}
                      onChange={(e) => setFormKostenlos(e.target.checked)}
                      className="rounded"
                    />
                    Kostenlos
                  </label>
                  {!formKostenlos && (
                    <Input
                      type="number"
                      value={formPreis}
                      onChange={(e) => setFormPreis(e.target.value)}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      className="w-32"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Datum + Altersgruppe (nur bei bestimmten Kategorien) */}
            {zeigeDatumFelder && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Datum (optional)</Label>
                  <Input
                    type="date"
                    value={formDatum}
                    onChange={(e) => setFormDatum(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Altersgruppe (optional)</Label>
                  <Select
                    value={formAltersgruppe}
                    onChange={(e) => setFormAltersgruppe(e.target.value)}
                  >
                    <option value="">Keine Angabe</option>
                    {ALTERSGRUPPEN.map((ag) => (
                      <option key={ag} value={ag}>
                        {ag}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {/* Bild-URL */}
            <div>
              <Label>Bild-URL (optional)</Label>
              <Input
                value={formBildUrl}
                onChange={(e) => setFormBildUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kontakt-E-Mail</Label>
                <Input
                  type="email"
                  value={formKontaktEmail}
                  onChange={(e) => setFormKontaktEmail(e.target.value)}
                  placeholder="Wird automatisch vom Verein übernommen"
                />
              </div>
              <div>
                <Label>Telefon (optional)</Label>
                <Input
                  value={formKontaktTelefon}
                  onChange={(e) => setFormKontaktTelefon(e.target.value)}
                  placeholder="+49 ..."
                />
              </div>
            </div>

            {/* Ablaufdatum */}
            <div>
              <Label>Ablaufdatum (optional)</Label>
              <Input
                type="date"
                value={formAblaufDatum}
                onChange={(e) => setFormAblaufDatum(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Das Inserat wird nach diesem Datum automatisch deaktiviert.
              </p>
            </div>

            {/* Aktionen */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setErstellenDialog(false);
                  formularZuruecksetzen();
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={inseratSpeichern}
                disabled={speichern || !formTitel.trim() || !formBeschreibung.trim()}
              >
                {speichern
                  ? 'Speichern...'
                  : bearbeitenInserat
                    ? 'Speichern'
                    : 'Inserat erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Dialog: Bewerben/Anfragen ==================== */}
      <Dialog
        open={!!bewerbenDialog}
        onOpenChange={(open) => {
          if (!open) setBewerbenDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anfrage senden</DialogTitle>
            <DialogDescription>
              {bewerbenDialog && (
                <>
                  Anfrage an <strong>{bewerbenDialog.tenant.name}</strong> für
                  &quot;{bewerbenDialog.titel}&quot;
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Nachricht *</Label>
              <Textarea
                value={bewerbungNachricht}
                onChange={(e) => setBewerbungNachricht(e.target.value)}
                placeholder="Beschreiben Sie Ihr Interesse..."
                rows={4}
              />
            </div>
            <div>
              <Label>Ihre Kontakt-E-Mail (optional)</Label>
              <Input
                type="email"
                value={bewerbungEmail}
                onChange={(e) => setBewerbungEmail(e.target.value)}
                placeholder="Wird automatisch vom Verein übernommen"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBewerbenDialog(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={bewerbungAbsenden}
                disabled={speichern || !bewerbungNachricht.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                {speichern ? 'Senden...' : 'Anfrage senden'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Dialog: Detail mit Bewerbungen ==================== */}
      <Dialog
        open={!!detailDialog}
        onOpenChange={(open) => {
          if (!open) setDetailDialog(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailDialog?.titel}</DialogTitle>
            <DialogDescription>
              Inserat-Details und eingegangene Anfragen
            </DialogDescription>
          </DialogHeader>

          {detailDialog && (
            <div className="space-y-4 mt-4">
              {/* Inserat-Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={KATEGORIE_KONFIG[detailDialog.kategorie].badgeClass}>
                    {KATEGORIE_KONFIG[detailDialog.kategorie].label}
                  </Badge>
                  <Badge className={TYP_KONFIG[detailDialog.typ].badgeClass}>
                    {TYP_KONFIG[detailDialog.typ].label}
                  </Badge>
                </div>
                <p className="text-sm">{detailDialog.beschreibung}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {detailDialog.plz} {detailDialog.ort}
                  </span>
                  <span>Kontakt: {detailDialog.kontaktEmail}</span>
                  {detailDialog.kontaktTelefon && (
                    <span>Tel: {detailDialog.kontaktTelefon}</span>
                  )}
                </div>
              </div>

              {/* Bewerbungen */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">
                  Eingegangene Anfragen ({detailDialog.bewerbungen?.length || 0})
                </h3>

                {(!detailDialog.bewerbungen || detailDialog.bewerbungen.length === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Anfragen eingegangen.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {detailDialog.bewerbungen.map((bew) => (
                      <Card key={bew.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {bew.bewerberName}
                                </span>
                                <Badge
                                  className={STATUS_KONFIG[bew.status].badgeClass}
                                >
                                  {STATUS_KONFIG[bew.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm">{bew.nachricht}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {bew.kontaktEmail} — {formatDatum(bew.erstelltAm)}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              {bew.status === 'NEU' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      bewerbungStatusAendern(bew.id, 'KONTAKTIERT');
                                      // Aktualisiere lokale Anzeige
                                      setDetailDialog((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              bewerbungen: prev.bewerbungen?.map((b) =>
                                                b.id === bew.id
                                                  ? { ...b, status: 'KONTAKTIERT' as BewerbungStatus }
                                                  : b,
                                              ),
                                            }
                                          : null,
                                      );
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() => {
                                      bewerbungStatusAendern(bew.id, 'ABGELEHNT');
                                      setDetailDialog((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              bewerbungen: prev.bewerbungen?.map((b) =>
                                                b.id === bew.id
                                                  ? { ...b, status: 'ABGELEHNT' as BewerbungStatus }
                                                  : b,
                                              ),
                                            }
                                          : null,
                                      );
                                    }}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
