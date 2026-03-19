'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  ArrowLeft,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Globe,
  Image,
  Users,
  Calendar,
  Phone,
  ImageIcon,
  Award,
  Type,
  Star,
  FileText,
  Megaphone,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

type SektionsTyp =
  | 'HERO'
  | 'UEBER_UNS'
  | 'ABTEILUNGEN'
  | 'MANNSCHAFTEN'
  | 'TERMINE'
  | 'NEUIGKEITEN'
  | 'KONTAKT'
  | 'SPONSOREN'
  | 'GALERIE'
  | 'MITGLIED_WERDEN'
  | 'FREITEXT'
  | 'TURNIER';

interface HomepageSektion {
  id: string;
  homepageId: string;
  typ: SektionsTyp;
  titel: string | null;
  inhalt: string | null;
  bildUrl: string | null;
  reihenfolge: number;
  istSichtbar: boolean;
  daten: Record<string, unknown> | null;
}

interface Homepage {
  id: string;
  tenantId: string;
  istAktiv: boolean;
  subdomain: string | null;
  heroTitel: string | null;
  heroUntertitel: string | null;
  heroBildUrl: string | null;
  ueberUns: string | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  kontaktAdresse: string | null;
  oeffnungszeiten: string | null;
  seoTitel: string | null;
  seoBeschreibung: string | null;
  footerText: string | null;
  customCss: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialYoutube: string | null;
  sektionen: HomepageSektion[];
}

// ==================== Konstanten ====================

const SEKTIONS_TYP_INFO: Record<SektionsTyp, { label: string; icon: typeof Layout; farbe: string }> = {
  HERO: { label: 'Hero', icon: Image, farbe: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  UEBER_UNS: { label: 'Ueber uns', icon: FileText, farbe: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  ABTEILUNGEN: { label: 'Abteilungen', icon: Star, farbe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  MANNSCHAFTEN: { label: 'Mannschaften', icon: Users, farbe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  TERMINE: { label: 'Termine', icon: Calendar, farbe: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  NEUIGKEITEN: { label: 'Neuigkeiten', icon: Megaphone, farbe: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  KONTAKT: { label: 'Kontakt', icon: Phone, farbe: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  SPONSOREN: { label: 'Sponsoren', icon: Award, farbe: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  GALERIE: { label: 'Galerie', icon: ImageIcon, farbe: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  MITGLIED_WERDEN: { label: 'Mitglied werden', icon: UserPlus, farbe: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  FREITEXT: { label: 'Freitext', icon: Type, farbe: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  TURNIER: { label: 'Turnier', icon: Award, farbe: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const VERFUEGBARE_TYPEN: SektionsTyp[] = [
  'HERO',
  'UEBER_UNS',
  'ABTEILUNGEN',
  'MANNSCHAFTEN',
  'TERMINE',
  'NEUIGKEITEN',
  'KONTAKT',
  'SPONSOREN',
  'GALERIE',
  'MITGLIED_WERDEN',
  'FREITEXT',
  'TURNIER',
];

// ==================== Sortierbare Sektion ====================

function SortierbareSektionItem({
  sektion,
  istAktiv,
  onBearbeiten,
  onSichtbarkeitUmschalten,
  onLoeschen,
}: {
  sektion: HomepageSektion;
  istAktiv: boolean;
  onBearbeiten: () => void;
  onSichtbarkeitUmschalten: () => void;
  onLoeschen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sektion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const info = SEKTIONS_TYP_INFO[sektion.typ];
  const Icon = info.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        istAktiv
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:bg-muted/50'
      } ${!sektion.istSichtbar ? 'opacity-60' : ''}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <Badge variant="secondary" className={`text-xs ${info.farbe}`}>
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>

      <span className="flex-1 text-sm font-medium truncate">
        {sektion.titel || info.label}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSichtbarkeitUmschalten}
          title={sektion.istSichtbar ? 'Ausblenden' : 'Einblenden'}
        >
          {sektion.istSichtbar ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBearbeiten}
          title="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onLoeschen}
          title="Loeschen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== Bearbeitungspanel ====================

function BearbeitungsPanel({
  sektion,
  homepage,
  onSektionAktualisieren,
  onHomepageAktualisieren,
  ladend,
}: {
  sektion: HomepageSektion;
  homepage: Homepage;
  onSektionAktualisieren: (daten: Partial<HomepageSektion>) => void;
  onHomepageAktualisieren: (daten: Partial<Homepage>) => void;
  ladend: boolean;
}) {
  const info = SEKTIONS_TYP_INFO[sektion.typ];
  const Icon = info.icon;

  // Lokale Zustaende fuer Formularfelder
  const [titel, setTitel] = useState(sektion.titel || '');
  const [inhalt, setInhalt] = useState(sektion.inhalt || '');
  const [bildUrl, setBildUrl] = useState(sektion.bildUrl || '');

  // Homepage-Level Felder
  const [heroTitel, setHeroTitel] = useState(homepage.heroTitel || '');
  const [heroUntertitel, setHeroUntertitel] = useState(homepage.heroUntertitel || '');
  const [heroBildUrl, setHeroBildUrl] = useState(homepage.heroBildUrl || '');
  const [kontaktEmail, setKontaktEmail] = useState(homepage.kontaktEmail || '');
  const [kontaktTelefon, setKontaktTelefon] = useState(homepage.kontaktTelefon || '');
  const [kontaktAdresse, setKontaktAdresse] = useState(homepage.kontaktAdresse || '');
  const [ueberUns, setUeberUns] = useState(homepage.ueberUns || '');

  // Bei Sektionswechsel zuruecksetzen
  useEffect(() => {
    setTitel(sektion.titel || '');
    setInhalt(sektion.inhalt || '');
    setBildUrl(sektion.bildUrl || '');
    setHeroTitel(homepage.heroTitel || '');
    setHeroUntertitel(homepage.heroUntertitel || '');
    setHeroBildUrl(homepage.heroBildUrl || '');
    setKontaktEmail(homepage.kontaktEmail || '');
    setKontaktTelefon(homepage.kontaktTelefon || '');
    setKontaktAdresse(homepage.kontaktAdresse || '');
    setUeberUns(homepage.ueberUns || '');
  }, [sektion.id, sektion.titel, sektion.inhalt, sektion.bildUrl, homepage.heroTitel, homepage.heroUntertitel, homepage.heroBildUrl, homepage.kontaktEmail, homepage.kontaktTelefon, homepage.kontaktAdresse, homepage.ueberUns]);

  const handleSektionSpeichern = () => {
    onSektionAktualisieren({ titel, inhalt, bildUrl: bildUrl || undefined } as Partial<HomepageSektion>);
  };

  const handleHomepageSpeichern = () => {
    onHomepageAktualisieren({
      heroTitel,
      heroUntertitel,
      heroBildUrl: heroBildUrl || undefined,
      kontaktEmail: kontaktEmail || undefined,
      kontaktTelefon: kontaktTelefon || undefined,
      kontaktAdresse: kontaktAdresse || undefined,
      ueberUns: ueberUns || undefined,
    } as Partial<Homepage>);
  };

  const renderFelder = () => {
    switch (sektion.typ) {
      case 'HERO':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sektions-Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Vereinsname" />
            </div>
            <div className="space-y-2">
              <Label>Hero-Titel (Ueberschrift)</Label>
              <Input value={heroTitel} onChange={(e) => setHeroTitel(e.target.value)} placeholder="Willkommen beim Verein" />
            </div>
            <div className="space-y-2">
              <Label>Untertitel</Label>
              <Input value={heroUntertitel} onChange={(e) => setHeroUntertitel(e.target.value)} placeholder="Seit 1920 - Ihr Sportverein" />
            </div>
            <div className="space-y-2">
              <Label>Hintergrundbild-URL</Label>
              <Input value={heroBildUrl} onChange={(e) => setHeroBildUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>CTA-Button-Text (optional)</Label>
              <Input value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Mitglied werden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { handleSektionSpeichern(); handleHomepageSpeichern(); }} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'UEBER_UNS':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Ueber uns" />
            </div>
            <div className="space-y-2">
              <Label>Inhalt (HTML moeglich)</Label>
              <Textarea value={ueberUns} onChange={(e) => setUeberUns(e.target.value)} placeholder="Beschreiben Sie Ihren Verein..." rows={8} />
            </div>
            <div className="space-y-2">
              <Label>Kurzbeschreibung (fuer Sektion)</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Kurzer Einleitungstext..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { handleSektionSpeichern(); handleHomepageSpeichern(); }} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'KONTAKT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Kontakt" />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={kontaktAdresse} onChange={(e) => setKontaktAdresse(e.target.value)} placeholder="Musterstrasse 1, 12345 Musterstadt" />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={kontaktTelefon} onChange={(e) => setKontaktTelefon(e.target.value)} placeholder="+49 123 456789" />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={kontaktEmail} onChange={(e) => setKontaktEmail(e.target.value)} placeholder="info@meinverein.de" />
            </div>
            <div className="space-y-2">
              <Label>Zusaetzlicher Text</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Oeffnungszeiten, Maps-Hinweise..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { handleSektionSpeichern(); handleHomepageSpeichern(); }} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'MANNSCHAFTEN':
      case 'ABTEILUNGEN':
      case 'TERMINE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder={info.label} />
            </div>
            <div className="space-y-2">
              <Label>Einleitungstext (optional)</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Kurzer Text ueber dieser Sektion..." rows={3} />
            </div>
            <p className="text-sm text-muted-foreground">
              Die Daten fuer diese Sektion werden automatisch aus dem System geladen.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'GALERIE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Galerie" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Impressionen aus dem Vereinsleben..." rows={3} />
            </div>
            <p className="text-sm text-muted-foreground">
              Bilder koennen ueber die Bildergalerie-Verwaltung hochgeladen werden.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'SPONSOREN':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Unsere Sponsoren" />
            </div>
            <div className="space-y-2">
              <Label>Einleitungstext</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Danke an unsere Sponsoren..." rows={3} />
            </div>
            <p className="text-sm text-muted-foreground">
              Die Sponsoren werden automatisch aus dem Sponsoren-Modul geladen.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'MITGLIED_WERDEN':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Mitglied werden" />
            </div>
            <div className="space-y-2">
              <Label>Motivationstext</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Warum Sie Mitglied werden sollten..." rows={4} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'FREITEXT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Sektions-Titel" />
            </div>
            <div className="space-y-2">
              <Label>Inhalt (HTML moeglich)</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Freier Inhalt..." rows={8} />
            </div>
            <div className="space-y-2">
              <Label>Bild-URL (optional)</Label>
              <Input value={bildUrl} onChange={(e) => setBildUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );

      case 'NEUIGKEITEN':
      case 'TURNIER':
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder={info.label} />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Optionaler Einleitungstext..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSektionSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {info.label} bearbeiten
        </CardTitle>
        <CardDescription>
          {sektion.istSichtbar ? 'Sichtbar auf der Homepage' : 'Ausgeblendet'}
        </CardDescription>
      </CardHeader>
      <CardContent>{renderFelder()}</CardContent>
    </Card>
  );
}

// ==================== Hauptseite ====================

export default function HomepageEditorPage() {
  const { benutzer } = useAuth();
  const [homepage, setHomepage] = useState<Homepage | null>(null);
  const [sektionen, setSektionen] = useState<HomepageSektion[]>([]);
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string | null>(null);
  const [ladend, setLadend] = useState(true);
  const [speichernd, setSpeichernd] = useState(false);
  const [erfolg, setErfolg] = useState('');
  const [fehler, setFehler] = useState('');
  const [neueSektion, setNeueSektion] = useState(false);

  const istAdmin =
    benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Homepage laden
  const homepageLaden = useCallback(async () => {
    try {
      setLadend(true);
      const daten = await apiClient.get<Homepage>('/homepage/admin');
      setHomepage(daten);
      setSektionen(daten.sektionen || []);
    } catch (err) {
      // Wenn noch keine Homepage existiert, erstellen
      try {
        const daten = await apiClient.post<Homepage>('/homepage/admin/erstellen', {});
        setHomepage(daten);
        setSektionen(daten.sektionen || []);
      } catch (erstellFehler) {
        setFehler(
          erstellFehler instanceof Error
            ? erstellFehler.message
            : 'Fehler beim Laden der Homepage.',
        );
      }
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    homepageLaden();
  }, [homepageLaden]);

  // Drag & Drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const alteIndex = sektionen.findIndex((s) => s.id === active.id);
    const neueIndex = sektionen.findIndex((s) => s.id === over.id);
    const neueSektionen = arrayMove(sektionen, alteIndex, neueIndex);
    setSektionen(neueSektionen);

    // Reihenfolge per API speichern
    try {
      await Promise.all(
        neueSektionen.map((s, i) =>
          apiClient.put(`/homepage/admin/sektionen/${s.id}`, {
            reihenfolge: i,
          }),
        ),
      );
      zeigeErfolg('Reihenfolge gespeichert.');
    } catch {
      setFehler('Fehler beim Speichern der Reihenfolge.');
      // Zuruecksetzen
      if (homepage) setSektionen(homepage.sektionen);
    }
  };

  // Sichtbarkeit umschalten
  const handleSichtbarkeitUmschalten = async (sektion: HomepageSektion) => {
    const neuerWert = !sektion.istSichtbar;
    setSektionen((prev) =>
      prev.map((s) =>
        s.id === sektion.id ? { ...s, istSichtbar: neuerWert } : s,
      ),
    );

    try {
      await apiClient.put(`/homepage/admin/sektionen/${sektion.id}`, {
        istSichtbar: neuerWert,
      });
      zeigeErfolg(neuerWert ? 'Sektion eingeblendet.' : 'Sektion ausgeblendet.');
    } catch {
      // Zuruecksetzen
      setSektionen((prev) =>
        prev.map((s) =>
          s.id === sektion.id ? { ...s, istSichtbar: !neuerWert } : s,
        ),
      );
      setFehler('Fehler beim Umschalten der Sichtbarkeit.');
    }
  };

  // Sektion loeschen
  const handleLoeschen = async (sektion: HomepageSektion) => {
    if (!confirm(`Sektion "${sektion.titel || SEKTIONS_TYP_INFO[sektion.typ].label}" wirklich loeschen?`)) return;

    try {
      await apiClient.delete(`/homepage/admin/sektionen/${sektion.id}`);
      setSektionen((prev) => prev.filter((s) => s.id !== sektion.id));
      if (ausgewaehlteId === sektion.id) setAusgewaehlteId(null);
      zeigeErfolg('Sektion geloescht.');
    } catch {
      setFehler('Fehler beim Loeschen der Sektion.');
    }
  };

  // Neue Sektion hinzufuegen
  const handleNeueSektionHinzufuegen = async (typ: SektionsTyp) => {
    if (!homepage) return;

    try {
      const neueSektion = await apiClient.post<HomepageSektion>('/homepage/admin/sektionen', {
        typ,
        titel: SEKTIONS_TYP_INFO[typ].label,
        reihenfolge: sektionen.length,
      });
      setSektionen((prev) => [...prev, neueSektion]);
      setAusgewaehlteId(neueSektion.id);
      setNeueSektion(false);
      zeigeErfolg('Neue Sektion hinzugefuegt.');
    } catch {
      setFehler('Fehler beim Hinzufuegen der Sektion.');
    }
  };

  // Sektion aktualisieren
  const handleSektionAktualisieren = async (daten: Partial<HomepageSektion>) => {
    if (!ausgewaehlteId) return;

    setSpeichernd(true);
    try {
      const aktualisiert = await apiClient.put<HomepageSektion>(
        `/homepage/admin/sektionen/${ausgewaehlteId}`,
        daten,
      );
      setSektionen((prev) =>
        prev.map((s) => (s.id === ausgewaehlteId ? { ...s, ...aktualisiert } : s)),
      );
      zeigeErfolg('Sektion gespeichert.');
    } catch {
      setFehler('Fehler beim Speichern der Sektion.');
    } finally {
      setSpeichernd(false);
    }
  };

  // Homepage-Level Daten aktualisieren
  const handleHomepageAktualisieren = async (daten: Partial<Homepage>) => {
    setSpeichernd(true);
    try {
      const aktualisiert = await apiClient.put<Homepage>('/homepage/admin', daten);
      setHomepage(aktualisiert);
      zeigeErfolg('Homepage gespeichert.');
    } catch {
      setFehler('Fehler beim Speichern der Homepage.');
    } finally {
      setSpeichernd(false);
    }
  };

  // Homepage aktivieren/deaktivieren
  const handleAktivToggle = async () => {
    if (!homepage) return;

    try {
      const aktualisiert = await apiClient.put<Homepage>('/homepage/admin', {
        istAktiv: !homepage.istAktiv,
      });
      setHomepage(aktualisiert);
      zeigeErfolg(
        aktualisiert.istAktiv
          ? 'Homepage ist jetzt oeffentlich sichtbar.'
          : 'Homepage ist jetzt deaktiviert.',
      );
    } catch {
      setFehler('Fehler beim Umschalten des Status.');
    }
  };

  // KI-Generierung
  const handleKiGenerieren = async () => {
    if (!confirm('Sollen die Homepage-Texte mit KI generiert werden? Bestehende Inhalte werden ueberschrieben.')) return;

    setSpeichernd(true);
    try {
      const daten = await apiClient.post<Homepage>('/homepage/admin/ki-generieren', {});
      setHomepage(daten);
      setSektionen(daten.sektionen || []);
      zeigeErfolg('Homepage-Inhalte wurden mit KI generiert.');
    } catch (err) {
      setFehler(
        err instanceof Error
          ? err.message
          : 'Fehler bei der KI-Generierung.',
      );
    } finally {
      setSpeichernd(false);
    }
  };

  const zeigeErfolg = (nachricht: string) => {
    setErfolg(nachricht);
    setFehler('');
    setTimeout(() => setErfolg(''), 3000);
  };

  const ausgewaehlteSektion = sektionen.find((s) => s.id === ausgewaehlteId) || null;

  if (ladend) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Homepage wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/einstellungen" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Einstellungen
      </Link>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vereinshomepage</h1>
            <p className="text-muted-foreground">
              Homepage-Sektionen verwalten und anordnen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleKiGenerieren}
            disabled={speichernd}
            title="Inhalte mit KI generieren"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            KI-Texte
          </Button>
          <Button
            variant={homepage?.istAktiv ? 'default' : 'outline'}
            onClick={handleAktivToggle}
          >
            <Globe className="h-4 w-4 mr-2" />
            {homepage?.istAktiv ? 'Aktiv' : 'Inaktiv'}
          </Button>
        </div>
      </div>

      {/* Erfolg/Fehler */}
      {erfolg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {erfolg}
        </div>
      )}
      {fehler && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      {/* Hauptbereich: Liste + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linke Seite: Sektionsliste */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sektionen</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNeueSektion(!neueSektion)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Neue Sektion
                </Button>
              </div>
              <CardDescription>
                Ziehen Sie Sektionen um die Reihenfolge zu aendern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Neue Sektion Auswahl */}
              {neueSektion && (
                <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 mb-3">
                  <p className="text-sm font-medium mb-3">Sektionstyp waehlen:</p>
                  <div className="flex flex-wrap gap-2">
                    {VERFUEGBARE_TYPEN.map((typ) => {
                      const typInfo = SEKTIONS_TYP_INFO[typ];
                      const TypIcon = typInfo.icon;
                      return (
                        <Button
                          key={typ}
                          variant="outline"
                          size="sm"
                          onClick={() => handleNeueSektionHinzufuegen(typ)}
                          className="text-xs"
                        >
                          <TypIcon className="h-3 w-3 mr-1" />
                          {typInfo.label}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setNeueSektion(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              )}

              {/* Sortierbare Liste */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sektionen.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sektionen.map((sektion) => (
                    <SortierbareSektionItem
                      key={sektion.id}
                      sektion={sektion}
                      istAktiv={ausgewaehlteId === sektion.id}
                      onBearbeiten={() => setAusgewaehlteId(sektion.id)}
                      onSichtbarkeitUmschalten={() =>
                        handleSichtbarkeitUmschalten(sektion)
                      }
                      onLoeschen={() => handleLoeschen(sektion)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {sektionen.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Sektionen vorhanden. Fuegen Sie eine neue Sektion hinzu.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Homepage-Subdomain Info */}
          {homepage?.subdomain && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>
                    Oeffentliche URL:{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">
                      {homepage.subdomain}.clubos.de
                    </code>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rechte Seite: Bearbeitungspanel */}
        <div>
          {ausgewaehlteSektion && homepage ? (
            <BearbeitungsPanel
              sektion={ausgewaehlteSektion}
              homepage={homepage}
              onSektionAktualisieren={handleSektionAktualisieren}
              onHomepageAktualisieren={handleHomepageAktualisieren}
              ladend={speichernd}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Pencil className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Keine Sektion ausgewaehlt</p>
                <p className="text-sm">
                  Klicken Sie auf eine Sektion um sie zu bearbeiten
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
