'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Heart,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Mail,
  User,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  webseite: string | null;
  beschreibung: string | null;
  kontaktName: string | null;
  kontaktEmail: string | null;
  istAktiv: boolean;
}

export default function SponsorenPage() {
  const [sponsoren, setSponsoren] = useState<Sponsor[]>([]);
  const [ladend, setLadend] = useState(true);

  // Dialog
  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeitungsId, setBearbeitungsId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [webseite, setWebseite] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [kontaktName, setKontaktName] = useState('');
  const [kontaktEmail, setKontaktEmail] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Sponsor[]>('/sponsoren');
      setSponsoren(daten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleNeu = () => {
    setBearbeitungsId(null);
    setName('');
    setWebseite('');
    setBeschreibung('');
    setKontaktName('');
    setKontaktEmail('');
    setDialogOffen(true);
  };

  const handleBearbeiten = (s: Sponsor) => {
    setBearbeitungsId(s.id);
    setName(s.name);
    setWebseite(s.webseite || '');
    setBeschreibung(s.beschreibung || '');
    setKontaktName(s.kontaktName || '');
    setKontaktEmail(s.kontaktEmail || '');
    setDialogOffen(true);
  };

  const handleSpeichern = async () => {
    if (!name) return;
    setSpeichernd(true);
    try {
      const daten = {
        name,
        webseite: webseite || undefined,
        beschreibung: beschreibung || undefined,
        kontaktName: kontaktName || undefined,
        kontaktEmail: kontaktEmail || undefined,
      };

      if (bearbeitungsId) {
        await apiClient.put(`/sponsoren/${bearbeitungsId}`, daten);
      } else {
        await apiClient.post('/sponsoren', daten);
      }
      setDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleAktivToggle = async (s: Sponsor) => {
    try {
      await apiClient.put(`/sponsoren/${s.id}`, { istAktiv: !s.istAktiv });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Sponsor wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/sponsoren/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Sponsoren werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sponsoren</h1>
            <p className="text-muted-foreground">
              Werbepartner und Foerderer des Vereins
            </p>
          </div>
        </div>
        <Button onClick={handleNeu}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Sponsor
        </Button>
      </div>

      {/* Sponsoren-Liste */}
      {sponsoren.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Sponsoren erfasst.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sponsoren.map((s) => (
            <Card
              key={s.id}
              className={`transition-opacity ${!s.istAktiv ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl.startsWith('http') ? s.logoUrl : `${API_BASE_URL}${s.logoUrl}`}
                        alt={s.name}
                        className="h-10 w-10 object-contain rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <CardTitle className="text-base">{s.name}</CardTitle>
                  </div>
                  <Badge variant={s.istAktiv ? 'default' : 'secondary'}>
                    {s.istAktiv ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {s.beschreibung && (
                  <p className="text-sm text-muted-foreground">
                    {s.beschreibung}
                  </p>
                )}
                {s.webseite && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={s.webseite.startsWith('http') ? s.webseite : `https://${s.webseite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {s.webseite}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {s.kontaktName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {s.kontaktName}
                  </div>
                )}
                {s.kontaktEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {s.kontaktEmail}
                  </div>
                )}

                <div className="flex gap-1 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBearbeiten(s)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAktivToggle(s)}
                  >
                    {s.istAktiv ? (
                      <ToggleRight className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5 mr-1" />
                    )}
                    {s.istAktiv ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoeschen(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bearbeitungsId ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}
            </DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten des Sponsors oder Foerderers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Stadtwerke Goeppingen"
              />
            </div>
            <div className="space-y-2">
              <Label>Webseite</Label>
              <Input
                value={webseite}
                onChange={(e) => setWebseite(e.target.value)}
                placeholder="z.B. www.stadtwerke-gp.de"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Hauptsponsor seit 2020"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kontaktperson</Label>
                <Input
                  value={kontaktName}
                  onChange={(e) => setKontaktName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label>Kontakt-E-Mail</Label>
                <Input
                  type="email"
                  value={kontaktEmail}
                  onChange={(e) => setKontaktEmail(e.target.value)}
                  placeholder="sponsor@firma.de"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSpeichern} disabled={!name || speichernd}>
                {speichernd
                  ? 'Wird gespeichert...'
                  : bearbeitungsId
                    ? 'Speichern'
                    : 'Sponsor erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
