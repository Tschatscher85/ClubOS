'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { useBenutzer } from '@/hooks/use-auth';

interface TeamKurz {
  id: string;
  name: string;
}

interface EventKurz {
  id: string;
  title: string;
}

interface FotoData {
  id: string;
  tenantId: string;
  teamId: string | null;
  eventId: string | null;
  url: string;
  thumbnail: string | null;
  beschreibung: string | null;
  hochgeladenVon: string;
  erstelltAm: string;
  team: TeamKurz | null;
  event: EventKurz | null;
}

export default function GaleriePage() {
  const benutzer = useBenutzer();
  const [fotos, setFotos] = useState<FotoData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [uploadOffen, setUploadOffen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'alle' | 'team' | 'event'>('alle');
  const [uploadLadend, setUploadLadend] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [teams, setTeams] = useState<TeamKurz[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const result = await apiClient.get<FotoData[]>('/galerie');
      setFotos(result);

      // Unique Teams extrahieren
      const teamMap = new Map<string, TeamKurz>();
      result.forEach((f) => {
        if (f.team) teamMap.set(f.team.id, f.team);
      });
      setTeams(Array.from(teamMap.values()));
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleUpload = async (dateien: FileList | null) => {
    if (!dateien || dateien.length === 0) return;
    setUploadLadend(true);

    for (let i = 0; i < dateien.length; i++) {
      const formData = new FormData();
      formData.append('foto', dateien[i]);
      if (selectedTeamId) formData.append('teamId', selectedTeamId);
      if (selectedEventId) formData.append('eventId', selectedEventId);
      if (beschreibung) formData.append('beschreibung', beschreibung);

      try {
        const { accessToken } = getAccessToken();
        await fetch(`${API_BASE_URL}/galerie/upload`, {
          method: 'POST',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          body: formData,
        });
      } catch (error) {
        console.error('Upload-Fehler:', error);
      }
    }

    setUploadLadend(false);
    setUploadOffen(false);
    setSelectedTeamId('');
    setSelectedEventId('');
    setBeschreibung('');
    datenLaden();
  };

  const handleLoeschen = async (fotoId: string) => {
    if (!confirm('Foto wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/galerie/${fotoId}`);
      datenLaden();
      if (lightboxIndex !== null) setLightboxIndex(null);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Filter anwenden
  const gefilterteFotos = fotos.filter((f) => {
    if (filter === 'team') return f.teamId !== null;
    if (filter === 'event') return f.eventId !== null;
    return true;
  });

  // Gruppierung nach Team/Event
  const gruppiert = new Map<string, { label: string; fotos: FotoData[] }>();
  gefilterteFotos.forEach((f) => {
    const key = f.team?.name || f.event?.title || 'Ohne Zuordnung';
    if (!gruppiert.has(key)) {
      gruppiert.set(key, { label: key, fotos: [] });
    }
    gruppiert.get(key)!.fotos.push(f);
  });

  const lightboxFoto = lightboxIndex !== null ? gefilterteFotos[lightboxIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Foto-Galerie
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fotos.length} Foto{fotos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {istAdmin && (
          <Button onClick={() => setUploadOffen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Foto hochladen
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Badge
          variant={filter === 'alle' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('alle')}
        >
          Alle
        </Badge>
        <Badge
          variant={filter === 'team' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('team')}
        >
          Nach Team
        </Badge>
        <Badge
          variant={filter === 'event' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('event')}
        >
          Nach Event
        </Badge>
      </div>

      {ladend ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="animate-pulse text-muted-foreground">Galerie wird geladen...</div>
        </div>
      ) : gefilterteFotos.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Fotos vorhanden.</p>
            {istAdmin && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setUploadOffen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Erstes Foto hochladen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        Array.from(gruppiert.entries()).map(([key, gruppe]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg">{gruppe.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {gruppe.fotos.map((foto) => {
                  const globalIndex = gefilterteFotos.indexOf(foto);
                  return (
                    <div
                      key={foto.id}
                      className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
                      onClick={() => setLightboxIndex(globalIndex)}
                    >
                      <img
                        src={`${API_BASE_URL}${foto.url}`}
                        alt={foto.beschreibung || 'Foto'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {(foto.hochgeladenVon === benutzer?.id || istAdmin) && (
                        <button
                          className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoeschen(foto.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      {foto.beschreibung && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {foto.beschreibung}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Upload-Dialog */}
      <Dialog open={uploadOffen} onOpenChange={setUploadOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Team (optional)</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">Kein Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Input
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Mannschaftsfoto Saisonstart"
              />
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Klicken oder Foto hierher ziehen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP oder GIF (max. 10 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </div>
            {uploadLadend && (
              <p className="text-sm text-muted-foreground text-center">
                Wird hochgeladen...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxFoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white p-2"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {lightboxIndex < gefilterteFotos.length - 1 && (
            <button
              className="absolute right-4 text-white p-2"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${API_BASE_URL}${lightboxFoto.url}`}
              alt={lightboxFoto.beschreibung || 'Foto'}
              className="max-w-full max-h-[85vh] object-contain"
            />
            {lightboxFoto.beschreibung && (
              <p className="text-white text-center mt-2 text-sm">
                {lightboxFoto.beschreibung}
              </p>
            )}
            <div className="flex justify-center mt-2 gap-2">
              {(lightboxFoto.hochgeladenVon === benutzer?.id || istAdmin) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleLoeschen(lightboxFoto.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Loeschen
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper: AccessToken fuer multipart-Upload lesen
 */
function getAccessToken(): { accessToken: string | null } {
  try {
    const storeJson = localStorage.getItem('auth-storage');
    if (storeJson) {
      const store = JSON.parse(storeJson);
      return { accessToken: store.state?.accessToken || null };
    }
  } catch {
    // Ignore
  }
  return { accessToken: null };
}
