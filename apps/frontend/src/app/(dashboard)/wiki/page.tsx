'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface WikiSeite {
  id: string;
  titel: string;
  inhalt: string;
  kategorie: string | null;
  erstelltVon: string;
  bearbeitetVon: string | null;
  erstelltAm: string;
  updatedAt: string;
}

export default function WikiPage() {
  const benutzer = useBenutzer();
  const [seiten, setSeiten] = useState<WikiSeite[]>([]);
  const [gewaehlteSeite, setGewaehlteSeite] = useState<WikiSeite | null>(null);
  const [gewaehlteKategorie, setGewaehlteKategorie] = useState<string | null>(
    null,
  );
  const [suchbegriff, setSuchbegriff] = useState('');
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false);
  const [neuModus, setNeuModus] = useState(false);
  const [formDaten, setFormDaten] = useState({
    titel: '',
    inhalt: '',
    kategorie: '',
  });
  const [laed, setLaed] = useState(false);

  const istAdmin =
    benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';
  const istTrainer = benutzer?.rolle === 'TRAINER';
  const kannErstellen = istAdmin || istTrainer;

  const seitenLaden = useCallback(async () => {
    try {
      const params = gewaehlteKategorie
        ? `?kategorie=${encodeURIComponent(gewaehlteKategorie)}`
        : '';
      const daten = await apiClient.get<WikiSeite[]>(`/wiki${params}`);
      setSeiten(daten);
    } catch {
      // Fehler ignorieren
    }
  }, [gewaehlteKategorie]);

  useEffect(() => {
    seitenLaden();
  }, [seitenLaden]);

  const suchen = async () => {
    if (!suchbegriff.trim()) {
      seitenLaden();
      return;
    }
    try {
      const daten = await apiClient.get<WikiSeite[]>(
        `/wiki/suche?q=${encodeURIComponent(suchbegriff)}`,
      );
      setSeiten(daten);
    } catch {
      // Fehler ignorieren
    }
  };

  const kategorien = Array.from(
    new Set(seiten.map((s) => s.kategorie).filter(Boolean)),
  ) as string[];

  const seiteErstellen = async () => {
    if (!formDaten.titel.trim() || !formDaten.inhalt.trim()) return;
    setLaed(true);
    try {
      const neue = await apiClient.post<WikiSeite>('/wiki', {
        titel: formDaten.titel,
        inhalt: formDaten.inhalt,
        kategorie: formDaten.kategorie || undefined,
      });
      setSeiten([neue, ...seiten]);
      setGewaehlteSeite(neue);
      setNeuModus(false);
      setFormDaten({ titel: '', inhalt: '', kategorie: '' });
    } catch {
      alert('Fehler beim Erstellen der Seite');
    } finally {
      setLaed(false);
    }
  };

  const seiteAktualisieren = async () => {
    if (!gewaehlteSeite || !formDaten.titel.trim()) return;
    setLaed(true);
    try {
      const aktualisiert = await apiClient.put<WikiSeite>(
        `/wiki/${gewaehlteSeite.id}`,
        {
          titel: formDaten.titel,
          inhalt: formDaten.inhalt,
          kategorie: formDaten.kategorie || undefined,
        },
      );
      setSeiten(
        seiten.map((s) => (s.id === aktualisiert.id ? aktualisiert : s)),
      );
      setGewaehlteSeite(aktualisiert);
      setBearbeitungsModus(false);
    } catch {
      alert('Fehler beim Aktualisieren');
    } finally {
      setLaed(false);
    }
  };

  const seiteLoeschen = async (id: string) => {
    if (!confirm('Diese Wiki-Seite wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/wiki/${id}`);
      setSeiten(seiten.filter((s) => s.id !== id));
      if (gewaehlteSeite?.id === id) {
        setGewaehlteSeite(null);
      }
    } catch {
      alert('Fehler beim Loeschen');
    }
  };

  const bearbeitungStarten = (seite: WikiSeite) => {
    setFormDaten({
      titel: seite.titel,
      inhalt: seite.inhalt,
      kategorie: seite.kategorie || '',
    });
    setBearbeitungsModus(true);
  };

  const neuStarten = () => {
    setFormDaten({ titel: '', inhalt: '', kategorie: '' });
    setNeuModus(true);
    setGewaehlteSeite(null);
    setBearbeitungsModus(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vereins-Wiki</h1>
            <p className="text-muted-foreground">
              Interne Wissensdatenbank fuer euren Verein
            </p>
          </div>
        </div>
        {kannErstellen && (
          <Button onClick={neuStarten} className="gap-2">
            <Plus className="h-4 w-4" />
            Neue Seite
          </Button>
        )}
      </div>

      {/* Suche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Wiki durchsuchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && suchen()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={suchen}>
          Suchen
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar: Kategorien */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Kategorien
          </h3>
          <button
            onClick={() => {
              setGewaehlteKategorie(null);
              setSuchbegriff('');
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              !gewaehlteKategorie
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Alle Seiten
            <span className="ml-auto text-xs opacity-70">
              {seiten.length}
            </span>
          </button>
          {kategorien.map((kat) => (
            <button
              key={kat}
              onClick={() => {
                setGewaehlteKategorie(kat);
                setSuchbegriff('');
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                gewaehlteKategorie === kat
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              {kat}
              <span className="ml-auto text-xs opacity-70">
                {seiten.filter((s) => s.kategorie === kat).length}
              </span>
            </button>
          ))}

          {/* Seitenliste */}
          <div className="mt-4 space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Seiten
            </h3>
            {seiten.map((seite) => (
              <button
                key={seite.id}
                onClick={() => {
                  setGewaehlteSeite(seite);
                  setNeuModus(false);
                  setBearbeitungsModus(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  gewaehlteSeite?.id === seite.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="truncate">{seite.titel}</span>
              </button>
            ))}
            {seiten.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                Noch keine Seiten vorhanden
              </p>
            )}
          </div>
        </div>

        {/* Hauptbereich */}
        <div className="lg:col-span-3">
          {neuModus ? (
            <Card>
              <CardHeader>
                <CardTitle>Neue Wiki-Seite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titel</label>
                  <Input
                    value={formDaten.titel}
                    onChange={(e) =>
                      setFormDaten({ ...formDaten, titel: e.target.value })
                    }
                    placeholder="Seitentitel..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategorie</label>
                  <Input
                    value={formDaten.kategorie}
                    onChange={(e) =>
                      setFormDaten({ ...formDaten, kategorie: e.target.value })
                    }
                    placeholder="z.B. Halle, Kontakte, Ablaeufe..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inhalt</label>
                  <Textarea
                    value={formDaten.inhalt}
                    onChange={(e) =>
                      setFormDaten({ ...formDaten, inhalt: e.target.value })
                    }
                    placeholder="Seiteninhalt (Markdown/HTML)..."
                    rows={15}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={seiteErstellen}
                    disabled={laed}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {laed ? 'Wird gespeichert...' : 'Speichern'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNeuModus(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : gewaehlteSeite ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    {bearbeitungsModus ? (
                      <Input
                        value={formDaten.titel}
                        onChange={(e) =>
                          setFormDaten({
                            ...formDaten,
                            titel: e.target.value,
                          })
                        }
                        className="text-xl font-bold"
                      />
                    ) : (
                      <CardTitle className="text-xl">
                        {gewaehlteSeite.titel}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {gewaehlteSeite.kategorie && (
                        <Badge variant="secondary">
                          {gewaehlteSeite.kategorie}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Aktualisiert:{' '}
                        {new Date(
                          gewaehlteSeite.updatedAt,
                        ).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {bearbeitungsModus ? (
                      <>
                        <Button
                          onClick={seiteAktualisieren}
                          disabled={laed}
                          size="sm"
                          className="gap-1"
                        >
                          <Save className="h-4 w-4" />
                          {laed ? 'Speichern...' : 'Speichern'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBearbeitungsModus(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bearbeitungStarten(gewaehlteSeite)}
                          className="gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          Bearbeiten
                        </Button>
                        {istAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => seiteLoeschen(gewaehlteSeite.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bearbeitungsModus ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kategorie</label>
                      <Input
                        value={formDaten.kategorie}
                        onChange={(e) =>
                          setFormDaten({
                            ...formDaten,
                            kategorie: e.target.value,
                          })
                        }
                        placeholder="Kategorie..."
                      />
                    </div>
                    <Textarea
                      value={formDaten.inhalt}
                      onChange={(e) =>
                        setFormDaten({
                          ...formDaten,
                          inhalt: e.target.value,
                        })
                      }
                      rows={15}
                    />
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: gewaehlteSeite.inhalt.replace(/\n/g, '<br/>'),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Waehle eine Seite aus oder erstelle eine neue
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
