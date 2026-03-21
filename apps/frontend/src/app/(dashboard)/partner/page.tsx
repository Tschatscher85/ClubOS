'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Handshake,
  Plus,
  ExternalLink,
  Trash2,
  Search,
  Building2,
  Shirt,
  Utensils,
  Shield,
  Camera,
  Globe,
  Truck,
  HelpCircle,
  Dumbbell,
  Percent,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { useBenutzer } from '@/hooks/use-auth';

// --- Interfaces ---

interface Kooperationspartner {
  id: string;
  name: string;
  logoUrl: string | null;
  webseite: string | null;
  beschreibung: string | null;
  kategorie: string;
  kontaktEmail: string | null;
  rabattProzent: number | null;
  rabattCode: string | null;
  istAktiv: boolean;
}

interface VereinsPartner {
  id: string;
  name: string;
  logoUrl: string | null;
  webseite: string | null;
  beschreibung: string | null;
  kategorie: string;
  kontaktName: string | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  notizen: string | null;
  istAktiv: boolean;
  _count?: { auftraege: number };
}

interface Auftrag {
  id: string;
  beschreibung: string;
  betrag: number | null;
  datum: string;
  status: string;
  teamId: string | null;
}

// --- Konstanten ---

const KATEGORIE_ICONS: Record<string, typeof Building2> = {
  DRUCKEREI: Shirt,
  AUSRUESTER: Shirt,
  SPORTGERAETE: Dumbbell,
  CATERING: Utensils,
  VERSICHERUNG: Shield,
  MEDIEN: Camera,
  IT_DIENSTLEISTER: Globe,
  REISEN: Truck,
  SONSTIGES: HelpCircle,
};

const KATEGORIE_LABEL: Record<string, string> = {
  DRUCKEREI: 'Druckerei',
  AUSRUESTER: 'Ausrüster',
  SPORTGERAETE: 'Sportgeräte',
  CATERING: 'Catering',
  VERSICHERUNG: 'Versicherung',
  MEDIEN: 'Medien & Foto',
  IT_DIENSTLEISTER: 'IT & Web',
  REISEN: 'Reisen & Camps',
  SONSTIGES: 'Sonstiges',
};

const AUFTRAG_STATUS_LABEL: Record<string, string> = {
  OFFEN: 'Offen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  STORNIERT: 'Storniert',
};

// --- Hauptkomponente ---

export default function PartnerPage() {
  const benutzer = useBenutzer();
  const [koopPartner, setKoopPartner] = useState<Kooperationspartner[]>([]);
  const [vereinsPartner, setVereinsPartner] = useState<VereinsPartner[]>([]);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState('');
  const [ladend, setLadend] = useState(true);

  // Dialog-States
  const [dialogOffen, setDialogOffen] = useState(false);
  const [dialogTyp, setDialogTyp] = useState<'vereins' | 'auftrag'>('vereins');
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [auftragDialogOffen, setAuftragDialogOffen] = useState(false);

  // Formular-States
  const [formName, setFormName] = useState('');
  const [formBeschreibung, setFormBeschreibung] = useState('');
  const [formKategorie, setFormKategorie] = useState('DRUCKEREI');
  const [formKontaktName, setFormKontaktName] = useState('');
  const [formKontaktEmail, setFormKontaktEmail] = useState('');
  const [formKontaktTelefon, setFormKontaktTelefon] = useState('');
  const [formWebseite, setFormWebseite] = useState('');
  const [formNotizen, setFormNotizen] = useState('');

  // Auftrag-Formular
  const [auftragBeschreibung, setAuftragBeschreibung] = useState('');
  const [auftragBetrag, setAuftragBetrag] = useState('');

  const istAdmin = benutzer && ['ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);
  const istSuperadmin = benutzer?.rolle === 'SUPERADMIN';

  const datenLaden = useCallback(async () => {
    try {
      const [koop, verein] = await Promise.allSettled([
        apiClient.get<Kooperationspartner[]>('/kooperationspartner'),
        apiClient.get<VereinsPartner[]>('/vereins-partner'),
      ]);
      if (koop.status === 'fulfilled') setKoopPartner(koop.value);
      if (verein.status === 'fulfilled') setVereinsPartner(verein.value);
    } catch {
      // Ignore
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => { datenLaden(); }, [datenLaden]);

  const resetFormular = () => {
    setFormName(''); setFormBeschreibung(''); setFormKategorie('DRUCKEREI');
    setFormKontaktName(''); setFormKontaktEmail(''); setFormKontaktTelefon('');
    setFormWebseite(''); setFormNotizen(''); setBearbeitenId(null);
  };

  const handleVereinsPartnerSpeichern = async () => {
    const daten = {
      name: formName, beschreibung: formBeschreibung, kategorie: formKategorie,
      kontaktName: formKontaktName, kontaktEmail: formKontaktEmail,
      kontaktTelefon: formKontaktTelefon, webseite: formWebseite, notizen: formNotizen,
    };
    if (bearbeitenId) {
      await apiClient.put(`/vereins-partner/${bearbeitenId}`, daten);
    } else {
      await apiClient.post('/vereins-partner', daten);
    }
    setDialogOffen(false); resetFormular(); datenLaden();
  };

  const handleVereinsPartnerLoeschen = async (id: string) => {
    if (!confirm('Partner wirklich löschen?')) return;
    await apiClient.delete(`/vereins-partner/${id}`);
    datenLaden();
  };

  const handleAuftragErstellen = async () => {
    if (!selectedPartnerId) return;
    await apiClient.post(`/vereins-partner/${selectedPartnerId}/auftraege`, {
      beschreibung: auftragBeschreibung,
      betrag: auftragBetrag ? parseFloat(auftragBetrag) : null,
    });
    setAuftragDialogOffen(false); setAuftragBeschreibung(''); setAuftragBetrag('');
    // Aufträge neu laden
    const result = await apiClient.get<Auftrag[]>(`/vereins-partner/${selectedPartnerId}/auftraege`);
    setAuftraege(result);
  };

  const handlePartnerDetails = async (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    try {
      const result = await apiClient.get<Auftrag[]>(`/vereins-partner/${partnerId}/auftraege`);
      setAuftraege(result);
    } catch { setAuftraege([]); }
  };

  const handleBearbeiten = (partner: VereinsPartner) => {
    setBearbeitenId(partner.id);
    setFormName(partner.name); setFormBeschreibung(partner.beschreibung || '');
    setFormKategorie(partner.kategorie); setFormKontaktName(partner.kontaktName || '');
    setFormKontaktEmail(partner.kontaktEmail || ''); setFormKontaktTelefon(partner.kontaktTelefon || '');
    setFormWebseite(partner.webseite || ''); setFormNotizen(partner.notizen || '');
    setDialogOffen(true);
  };

  // Filtern
  const filteredKoop = koopPartner.filter((p) =>
    (!suchbegriff || p.name.toLowerCase().includes(suchbegriff.toLowerCase())) &&
    (!kategorieFilter || p.kategorie === kategorieFilter)
  );
  const filteredVerein = vereinsPartner.filter((p) =>
    (!suchbegriff || p.name.toLowerCase().includes(suchbegriff.toLowerCase())) &&
    (!kategorieFilter || p.kategorie === kategorieFilter)
  );

  const renderPartnerKarte = (p: Kooperationspartner | VereinsPartner, typ: 'koop' | 'verein') => {
    const Icon = KATEGORIE_ICONS[p.kategorie] || HelpCircle;
    const isKoop = typ === 'koop';
    const koop = isKoop ? (p as Kooperationspartner) : null;
    const verein = !isKoop ? (p as VereinsPartner) : null;

    return (
      <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => !isKoop && handlePartnerDetails(p.id)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2.5 shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {KATEGORIE_LABEL[p.kategorie] || p.kategorie}
                </Badge>
              </div>
              {p.beschreibung && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.beschreibung}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {koop?.rabattProzent && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Percent className="h-3 w-3" />
                    {koop.rabattProzent}% Rabatt
                  </span>
                )}
                {verein?._count?.auftraege !== undefined && verein._count.auftraege > 0 && (
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    {verein._count.auftraege} Aufträge
                  </span>
                )}
                {p.webseite && (
                  <a href={p.webseite} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-3 w-3" /> Webseite
                  </a>
                )}
              </div>
            </div>
            {!isKoop && istAdmin && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleBearbeiten(p as VereinsPartner); }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="h-6 w-6" /> Partner & Dienstleister
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kooperationspartner von Vereinbase und eigene Dienstleister verwalten
          </p>
        </div>
        {istAdmin && (
          <Button onClick={() => { resetFormular(); setDialogOffen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Partner hinzufügen
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={suchbegriff} onChange={(e) => setSuchbegriff(e.target.value)}
            placeholder="Partner suchen..." className="pl-9" />
        </div>
        <select value={kategorieFilter} onChange={(e) => setKategorieFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm">
          <option value="">Alle Kategorien</option>
          {Object.entries(KATEGORIE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="vereins-partner">
        <TabsList>
          <TabsTrigger value="vereins-partner">
            Vereins-Partner ({filteredVerein.length})
          </TabsTrigger>
          <TabsTrigger value="vereinbase-vorteile">
            Vereinbase Vorteile ({filteredKoop.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vereins-partner" className="mt-4">
          {ladend ? (
            <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">
              Partner werden geladen...
            </p>
          ) : filteredVerein.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Partner vorhanden.</p>
                {istAdmin && (
                  <Button variant="outline" className="mt-3"
                    onClick={() => { resetFormular(); setDialogOffen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Ersten Partner hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVerein.map((p) => renderPartnerKarte(p, 'verein'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vereinbase-vorteile" className="mt-4">
          {filteredKoop.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Noch keine Vereinbase-Kooperationspartner vorhanden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredKoop.map((p) => renderPartnerKarte(p, 'koop'))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Aufträge-Seitenansicht */}
      {selectedPartnerId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Aufträge — {vereinsPartner.find((p) => p.id === selectedPartnerId)?.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPartnerId(null)}>
                  Schliessen
                </Button>
                {istAdmin && (
                  <Button size="sm" onClick={() => setAuftragDialogOffen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Auftrag
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {auftraege.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Aufträge vorhanden.
              </p>
            ) : (
              <div className="space-y-2">
                {auftraege.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{a.beschreibung}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.datum).toLocaleDateString('de-DE')}
                        {a.betrag ? ` — ${a.betrag.toFixed(2)} EUR` : ''}
                      </p>
                    </div>
                    <Badge variant={a.status === 'ABGESCHLOSSEN' ? 'default' : 'secondary'}>
                      {AUFTRAG_STATUS_LABEL[a.status] || a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Partner-Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bearbeitenId ? 'Partner bearbeiten' : 'Neuen Partner hinzufügen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="z.B. Sport Müller" />
              </div>
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={formKategorie}
                  onChange={(e) => setFormKategorie(e.target.value)}>
                  {Object.entries(KATEGORIE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input value={formBeschreibung} onChange={(e) => setFormBeschreibung(e.target.value)}
                placeholder="z.B. Bedruckt seit 2020 unsere Trikots" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kontaktperson</Label>
                <Input value={formKontaktName} onChange={(e) => setFormKontaktName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input value={formKontaktEmail} onChange={(e) => setFormKontaktEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={formKontaktTelefon} onChange={(e) => setFormKontaktTelefon(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Webseite</Label>
              <Input value={formWebseite} onChange={(e) => setFormWebseite(e.target.value)}
                placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Interne Notizen</Label>
              <Input value={formNotizen} onChange={(e) => setFormNotizen(e.target.value)}
                placeholder="z.B. Kontakt über Thomas, guter Preis bei > 50 Stück" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>Abbrechen</Button>
              <Button onClick={handleVereinsPartnerSpeichern} disabled={!formName}>
                {bearbeitenId ? 'Aktualisieren' : 'Anlegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auftrag-Dialog */}
      <Dialog open={auftragDialogOffen} onOpenChange={setAuftragDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Auftrag erfassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Beschreibung *</Label>
              <Input value={auftragBeschreibung} onChange={(e) => setAuftragBeschreibung(e.target.value)}
                placeholder="z.B. 30 Trikots Bambini mit Vereinslogo" />
            </div>
            <div className="space-y-2">
              <Label>Betrag (EUR, optional)</Label>
              <Input type="number" step="0.01" value={auftragBetrag}
                onChange={(e) => setAuftragBetrag(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAuftragDialogOffen(false)}>Abbrechen</Button>
              <Button onClick={handleAuftragErstellen} disabled={!auftragBeschreibung}>Erfassen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
