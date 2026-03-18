'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Users, Palette, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { applyTenantTheme } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/constants';
import { sportartLabel, sportartenFallback } from '@/lib/sportarten';

const FARBEN = [
  { name: 'Blau', wert: '#1a56db' },
  { name: 'Rot', wert: '#dc2626' },
  { name: 'Gruen', wert: '#16a34a' },
  { name: 'Lila', wert: '#7c3aed' },
  { name: 'Orange', wert: '#ea580c' },
  { name: 'Schwarz', wert: '#171717' },
  { name: 'Tuerkis', wert: '#0891b2' },
  { name: 'Pink', wert: '#db2777' },
];

const SPORTARTEN_LISTE = sportartenFallback();

export default function OnboardingPage() {
  const router = useRouter();
  const { tenant, accessToken, profilLaden } = useAuthStore();
  const [schritt, setSchritt] = useState(0);
  const [farbe, setFarbe] = useState('#1a56db');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLadend, setLogoLadend] = useState(false);
  const [sportarten, setSportarten] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [altersgruppe, setAltersgruppe] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!accessToken) {
    router.replace('/anmelden');
    return null;
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei || !tenant) return;
    setLogoLadend(true);
    try {
      const formData = new FormData();
      formData.append('logo', datei);
      const res = await fetch(`${API_BASE_URL}/vereine/${tenant.id}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logo || data.logoUrl);
        await profilLaden();
      }
    } catch {
      // Ignorieren
    } finally {
      setLogoLadend(false);
    }
  };

  const handleFarbe = (f: string) => {
    setFarbe(f);
    applyTenantTheme(f);
  };

  const handleSportartToggle = (s: string) => {
    setSportarten((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleAbschliessen = async () => {
    try {
      // Farbe speichern
      if (tenant) {
        await apiClient.put(`/vereine/${tenant.id}`, { primaryColor: farbe });
      }
      // Erstes Team erstellen wenn angegeben
      if (teamName && sportarten.length > 0) {
        try {
          await apiClient.post('/teams', {
            name: teamName,
            sport: sportarten[0],
            ageGroup: altersgruppe || 'Senioren',
          });
        } catch {
          // Team-Erstellung optional
        }
      }
    } catch {
      // Einstellungen optional
    }
    router.push('/dashboard');
  };

  const schritte = [
    // Schritt 0: Willkommen + Logo
    <div key="logo" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Willkommen bei ClubOS!</h2>
        <p className="text-muted-foreground">
          Richten Sie Ihren Verein in wenigen Schritten ein.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32">
          {logoUrl && (
            <AvatarImage src={`${API_BASE_URL}${logoUrl}`} alt="Vereinslogo" />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
            {tenant?.name
              ?.split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'CO'}
          </AvatarFallback>
        </Avatar>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <Button
          variant="outline"
          onClick={() => logoInputRef.current?.click()}
          disabled={logoLadend}
        >
          <Upload className="h-4 w-4 mr-2" />
          {logoLadend ? 'Wird hochgeladen...' : 'Logo hochladen'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Optional - Sie koennen dies auch spaeter machen
        </p>
      </div>
    </div>,

    // Schritt 1: Vereinsfarbe
    <div key="farbe" className="space-y-6">
      <div className="text-center space-y-2">
        <Palette className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Vereinsfarbe waehlen</h2>
        <p className="text-muted-foreground">
          Alle Buttons und Akzente passen sich automatisch an.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {FARBEN.map((f) => (
          <button
            key={f.wert}
            onClick={() => handleFarbe(f.wert)}
            className={`w-14 h-14 rounded-xl border-2 transition-all ${
              farbe === f.wert
                ? 'border-foreground scale-110 shadow-lg'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: f.wert }}
            title={f.name}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Label>Eigene Farbe:</Label>
        <Input
          type="color"
          value={farbe}
          onChange={(e) => handleFarbe(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
      </div>
    </div>,

    // Schritt 2: Sportarten
    <div key="sport" className="space-y-6">
      <div className="text-center space-y-2">
        <Users className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Welche Sportarten bietet Ihr Verein?</h2>
        <p className="text-muted-foreground">
          Waehlen Sie eine oder mehrere Sportarten.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SPORTARTEN_LISTE.map(({ wert: s }) => (
          <Button
            key={s}
            variant={sportarten.includes(s) ? 'default' : 'outline'}
            onClick={() => handleSportartToggle(s)}
            className="min-w-[120px]"
          >
            {sportartLabel(s)}
          </Button>
        ))}
      </div>
      {sportarten.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium text-center">
            Erstes Team erstellen (optional)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team-Name</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={`${tenant?.name} ${sportartLabel(sportarten[0])}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Altersgruppe</Label>
              <Input
                value={altersgruppe}
                onChange={(e) => setAltersgruppe(e.target.value)}
                placeholder="Senioren"
              />
            </div>
          </div>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {tenant?.name || 'ClubOS'}
            </CardTitle>
            <CardDescription>
              Schritt {schritt + 1} von {schritte.length}
            </CardDescription>
            {/* Fortschrittsbalken */}
            <div className="flex gap-1 pt-2">
              {schritte.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= schritt ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {schritte[schritt]}

            <div className="flex justify-between pt-4">
              {schritt > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setSchritt(schritt - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurueck
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                >
                  Ueberspringen
                </Button>
              )}

              {schritt < schritte.length - 1 ? (
                <Button onClick={() => setSchritt(schritt + 1)}>
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleAbschliessen}>
                  <Check className="h-4 w-4 mr-2" />
                  Loslegen!
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
