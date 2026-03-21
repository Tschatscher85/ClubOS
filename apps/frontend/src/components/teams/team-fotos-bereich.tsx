'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Upload, Trash2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { useBenutzer } from '@/hooks/use-auth';

interface FotoData {
  id: string;
  url: string;
  beschreibung: string | null;
  hochgeladenVon: string;
  erstelltAm: string;
}

interface TeamFotosBereichProps {
  teamId: string;
}

export function TeamFotosBereich({ teamId }: TeamFotosBereichProps) {
  const benutzer = useBenutzer();
  const [fotos, setFotos] = useState<FotoData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [uploadOffen, setUploadOffen] = useState(false);
  const [uploadLadend, setUploadLadend] = useState(false);
  const [uploadFortschritt, setUploadFortschritt] = useState({ aktuell: 0, gesamt: 0 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [beschreibung, setBeschreibung] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const result = await apiClient.get<FotoData[]>(`/galerie/team/${teamId}`);
      setFotos(result);
    } catch {
      // Ignore
    } finally {
      setLadend(false);
    }
  }, [teamId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleUpload = async (dateien: FileList | null) => {
    if (!dateien || dateien.length === 0) return;
    setUploadLadend(true);
    setUploadFortschritt({ aktuell: 0, gesamt: dateien.length });

    for (let i = 0; i < dateien.length; i++) {
      setUploadFortschritt({ aktuell: i + 1, gesamt: dateien.length });
      const formData = new FormData();
      formData.append('foto', dateien[i]);
      formData.append('teamId', teamId);
      if (beschreibung) formData.append('beschreibung', beschreibung);

      try {
        const storeJson = localStorage.getItem('auth-storage');
        const accessToken = storeJson ? JSON.parse(storeJson).state?.accessToken : null;
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
    setUploadFortschritt({ aktuell: 0, gesamt: 0 });
    setUploadOffen(false);
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

  const lightboxFoto = lightboxIndex !== null ? fotos[lightboxIndex] : null;

  if (ladend) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-pulse">
        Fotos werden geladen...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {istAdmin && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setUploadOffen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Foto hochladen
          </Button>
        </div>
      )}

      {fotos.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Noch keine Fotos fuer dieses Team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {fotos.map((foto, index) => (
            <div
              key={foto.id}
              className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
              onClick={() => setLightboxIndex(index)}
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
            </div>
          ))}
        </div>
      )}

      {/* Upload-Dialog */}
      <Dialog open={uploadOffen} onOpenChange={setUploadOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Input
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Mannschaftsfoto"
              />
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Klicken oder Fotos hierher ziehen</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mehrere Fotos gleichzeitig möglich (max. 10 MB pro Bild)
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
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: uploadFortschritt.gesamt > 0
                        ? `${(uploadFortschritt.aktuell / uploadFortschritt.gesamt) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Foto {uploadFortschritt.aktuell} von {uploadFortschritt.gesamt} wird hochgeladen...
                </p>
              </div>
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
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightboxIndex(null)}>
            <X className="h-6 w-6" />
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {lightboxIndex < fotos.length - 1 && (
            <button
              className="absolute right-4 text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
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
              <p className="text-white text-center mt-2 text-sm">{lightboxFoto.beschreibung}</p>
            )}
            <div className="flex justify-center mt-2 gap-2">
              {(lightboxFoto.hochgeladenVon === benutzer?.id || istAdmin) && (
                <Button variant="destructive" size="sm" onClick={() => handleLoeschen(lightboxFoto.id)}>
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
