'use client';

import { useState, useRef } from 'react';
import { Settings, Palette, Save, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { applyTenantTheme } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/constants';

const FARBEN = [
  { name: 'Blau', wert: '#1a56db' },
  { name: 'Rot', wert: '#dc2626' },
  { name: 'Gruen', wert: '#16a34a' },
  { name: 'Lila', wert: '#7c3aed' },
  { name: 'Orange', wert: '#ea580c' },
  { name: 'Pink', wert: '#db2777' },
  { name: 'Tuerkis', wert: '#0891b2' },
  { name: 'Schwarz', wert: '#171717' },
];

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter (29 EUR/Monat)',
  PRO: 'Pro (79 EUR/Monat)',
  CLUB: 'Club (149 EUR/Monat)',
  ENTERPRISE: 'Enterprise',
  SELF_HOSTED: 'Self-Hosted',
};

export default function EinstellungenPage() {
  const { benutzer, tenant, profilLaden } = useAuth();
  const [name, setName] = useState(tenant?.name || '');
  const [farbe, setFarbe] = useState(tenant?.primaryColor || '#1a56db');
  const [customFarbe, setCustomFarbe] = useState('');
  const [ladend, setLadend] = useState(false);
  const [logoLadend, setLogoLadend] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei || !tenant) return;

    setLogoLadend(true);
    setFehler('');

    try {
      const formData = new FormData();
      formData.append('logo', datei);

      const res = await fetch(`${API_BASE_URL}/vereine/${tenant.id}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.nachricht || 'Upload fehlgeschlagen.');
      }

      await profilLaden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Logo-Upload fehlgeschlagen.');
    } finally {
      setLogoLadend(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleFarbeWaehlen = (neueFarbe: string) => {
    setFarbe(neueFarbe);
    applyTenantTheme(neueFarbe);
  };

  const handleSpeichern = async () => {
    setLadend(true);
    setFehler('');
    setGespeichert(false);

    try {
      await apiClient.put(`/vereine/${tenant?.id}`, {
        name,
        primaryColor: farbe,
      });
      applyTenantTheme(farbe);
      await profilLaden();
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 3000);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setLadend(false);
    }
  };

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">Vereinseinstellungen verwalten</p>
        </div>
      </div>

      {/* Vereinsdaten */}
      <Card>
        <CardHeader>
          <CardTitle>Vereinsdaten</CardTitle>
          <CardDescription>Name und Grundeinstellungen des Vereins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vereinsname</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!istAdmin}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={tenant?.slug || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tarif</Label>
              <div className="h-10 flex items-center">
                <Badge variant="secondary">
                  {PLAN_LABEL[(tenant as unknown as Record<string, string>)?.plan] || 'Starter'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vereinslogo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Vereinslogo
          </CardTitle>
          <CardDescription>
            Logo hochladen (PNG, JPG, SVG oder WebP, max. 2 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {tenant?.logo && (
                <AvatarImage
                  src={`${API_BASE_URL}${tenant.logo}`}
                  alt={tenant.name}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {tenant?.name
                  ? tenant.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'CO'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={!istAdmin}
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={!istAdmin || logoLadend}
              >
                <Upload className="h-4 w-4 mr-2" />
                {logoLadend ? 'Wird hochgeladen...' : 'Logo hochladen'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Empfohlen: Quadratisch, mind. 200x200 Pixel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vereinsfarbe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Vereinsfarbe
          </CardTitle>
          <CardDescription>
            Waehlen Sie die Primaerfarbe Ihres Vereins. Alle Buttons, Links und Akzente passen sich automatisch an.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {FARBEN.map((f) => (
              <button
                key={f.wert}
                onClick={() => handleFarbeWaehlen(f.wert)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  farbe === f.wert
                    ? 'border-foreground scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: f.wert }}
                title={f.name}
                disabled={!istAdmin}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Label>Eigene Farbe:</Label>
            <Input
              type="color"
              value={farbe}
              onChange={(e) => handleFarbeWaehlen(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
              disabled={!istAdmin}
            />
            <Input
              value={farbe}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  handleFarbeWaehlen(e.target.value);
                }
                setCustomFarbe(e.target.value);
              }}
              placeholder="#1a56db"
              className="w-32"
              disabled={!istAdmin}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Vorschau:</p>
            <div className="flex gap-3">
              <Button>Primaer-Button</Button>
              <Button variant="outline">Outline-Button</Button>
              <Badge>Badge</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benutzerinfo */}
      <Card>
        <CardHeader>
          <CardTitle>Mein Konto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={benutzer?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Input value={benutzer?.rolle || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speichern */}
      {istAdmin && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSpeichern} disabled={ladend}>
            <Save className="h-4 w-4 mr-2" />
            {ladend ? 'Speichern...' : 'Einstellungen speichern'}
          </Button>
          {gespeichert && (
            <span className="text-sm text-green-600">Gespeichert!</span>
          )}
          {fehler && (
            <span className="text-sm text-destructive">{fehler}</span>
          )}
        </div>
      )}
    </div>
  );
}
