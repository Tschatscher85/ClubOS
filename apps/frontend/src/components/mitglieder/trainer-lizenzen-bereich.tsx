'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Award,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Upload,
  ExternalLink,
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

interface Lizenz {
  id: string;
  bezeichnung: string;
  ausstellerVerband: string | null;
  lizenznummer: string | null;
  erhaltenAm: string;
  gueltigBis: string | null;
  dokumentUrl: string | null;
  notizen: string | null;
  status?: string;
}

interface TrainerLizenzenBereichProps {
  userId: string;
  mitgliedName: string;
}

function berechneStatus(gueltigBis: string | null): { label: string; farbe: string; icon: typeof CheckCircle } {
  if (!gueltigBis) return { label: 'Unbegrenzt', farbe: 'text-green-600', icon: CheckCircle };
  const ablauf = new Date(gueltigBis);
  const heute = new Date();
  const in3Monaten = new Date();
  in3Monaten.setMonth(heute.getMonth() + 3);

  if (ablauf < heute) return { label: 'Abgelaufen', farbe: 'text-red-600', icon: XCircle };
  if (ablauf < in3Monaten) return { label: 'Läuft bald ab', farbe: 'text-orange-600', icon: AlertTriangle };
  return { label: 'Gültig', farbe: 'text-green-600', icon: CheckCircle };
}

export function TrainerLizenzenBereich({ userId, mitgliedName }: TrainerLizenzenBereichProps) {
  const benutzer = useBenutzer();
  const [lizenzen, setLizenzen] = useState<Lizenz[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);

  // Formular
  const [bezeichnung, setBezeichnung] = useState('');
  const [verband, setVerband] = useState('');
  const [lizenznummer, setLizenznummer] = useState('');
  const [erhaltenAm, setErhaltenAm] = useState('');
  const [gueltigBis, setGueltigBis] = useState('');
  const [notizen, setNotizen] = useState('');
  const [dokumentUrl, setDokumentUrl] = useState('');
  const [uploadLadend, setUploadLadend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer && ['ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const result = await apiClient.get<Lizenz[]>('/trainer-lizenzen');
      // Nur Lizenzen dieses Users filtern
      setLizenzen(result.filter((l: any) => l.userId === userId));
    } catch {
      // Ignore
    } finally {
      setLadend(false);
    }
  }, [userId]);

  useEffect(() => { datenLaden(); }, [datenLaden]);

  const handleSpeichern = async () => {
    try {
      await apiClient.post('/trainer-lizenzen', {
        userId,
        bezeichnung,
        ausstellerVerband: verband || undefined,
        lizenznummer: lizenznummer || undefined,
        erhaltenAm,
        gueltigBis: gueltigBis || undefined,
        dokumentUrl: dokumentUrl || undefined,
        notizen: notizen || undefined,
      });
      setDialogOffen(false);
      setBezeichnung(''); setVerband(''); setLizenznummer('');
      setErhaltenAm(''); setGueltigBis(''); setNotizen(''); setDokumentUrl('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Lizenz wirklich löschen?')) return;
    try {
      await apiClient.delete(`/trainer-lizenzen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleDokumentUpload = async (dateien: FileList | null) => {
    if (!dateien || dateien.length === 0) return;
    setUploadLadend(true);
    try {
      const formData = new FormData();
      formData.append('datei', dateien[0]);
      formData.append('name', `Lizenz ${bezeichnung || 'Dokument'}`);
      formData.append('kategorie', 'SONSTIGES');

      const storeJson = localStorage.getItem('auth-storage');
      const accessToken = storeJson ? JSON.parse(storeJson).state?.accessToken : null;
      const res = await fetch(`${API_BASE_URL}/dokumente`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setDokumentUrl(data.dateiUrl);
      }
    } catch {
      // Ignore
    } finally {
      setUploadLadend(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Trainer-Lizenzen
          </CardTitle>
          {istAdmin && (
            <Button variant="outline" size="sm" onClick={() => setDialogOffen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Lizenz hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {ladend ? (
          <p className="text-sm text-muted-foreground animate-pulse">Lizenzen werden geladen...</p>
        ) : lizenzen.length === 0 ? (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Keine Lizenzen hinterlegt.</p>
            {istAdmin && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setDialogOffen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Erste Lizenz hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {lizenzen.map((lizenz) => {
              const status = berechneStatus(lizenz.gueltigBis);
              const StatusIcon = status.icon;
              return (
                <div key={lizenz.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <StatusIcon className={`h-5 w-5 shrink-0 ${status.farbe}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{lizenz.bezeichnung}</p>
                      <Badge variant="outline" className={`text-[10px] ${status.farbe}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {lizenz.ausstellerVerband && <span>{lizenz.ausstellerVerband}</span>}
                      {lizenz.lizenznummer && <span>Nr. {lizenz.lizenznummer}</span>}
                      <span>
                        Erhalten: {new Date(lizenz.erhaltenAm).toLocaleDateString('de-DE')}
                      </span>
                      {lizenz.gueltigBis && (
                        <span>
                          Gültig bis: {new Date(lizenz.gueltigBis).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {lizenz.dokumentUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => window.open(`${API_BASE_URL}${lizenz.dokumentUrl}`, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {istAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => handleLoeschen(lizenz.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Lizenz-Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trainer-Lizenz für {mitgliedName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Bezeichnung *</Label>
              <Input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)}
                placeholder="z.B. C-Lizenz Fußball, Übungsleiter-C" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Verband</Label>
                <Input value={verband} onChange={(e) => setVerband(e.target.value)}
                  placeholder="z.B. WFV, DOSB, DFB" />
              </div>
              <div className="space-y-2">
                <Label>Lizenznummer</Label>
                <Input value={lizenznummer} onChange={(e) => setLizenznummer(e.target.value)}
                  placeholder="z.B. 12345-C" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Erhalten am *</Label>
                <Input type="date" value={erhaltenAm} onChange={(e) => setErhaltenAm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gültig bis (leer = unbegrenzt)</Label>
                <Input type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lizenz-Dokument (PDF)</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLadend}>
                  <Upload className="h-4 w-4 mr-1" />
                  {uploadLadend ? 'Wird hochgeladen...' : dokumentUrl ? 'Dokument hochgeladen' : 'PDF hochladen'}
                </Button>
                {dokumentUrl && (
                  <Badge variant="secondary" className="text-xs">Hochgeladen</Badge>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => handleDokumentUpload(e.target.files)} />
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Input value={notizen} onChange={(e) => setNotizen(e.target.value)}
                placeholder="z.B. Verlängerung geplant für Sommer 2027" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>Abbrechen</Button>
              <Button onClick={handleSpeichern} disabled={!bezeichnung || !erhaltenAm}>
                Lizenz speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
