'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Pencil, Trash2, Users, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamFormular } from '@/components/teams/team-formular';
import { apiClient } from '@/lib/api-client';
import { sportartLabel, sportartenLaden } from '@/lib/sportarten';

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  trainerId: string;
  maxKader: number | null;
  _count: { events: number; teamMembers: number; warteliste: number };
}

export default function TeamsInhalt() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [bearbeitungsTeam, setBearbeitungsTeam] = useState<Team | null>(null);

  const datenLaden = useCallback(async () => {
    try {
      const [daten] = await Promise.all([
        apiClient.get<Team[]>('/teams'),
        sportartenLaden(), // Sportarten-Cache fuellen
      ]);
      setTeams(daten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleLoeschen = async (id: string) => {
    if (!confirm('Team wirklich löschen?')) return;
    try {
      await apiClient.delete(`/teams/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Teams werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mannschaften</h1>
            <p className="text-muted-foreground">{teams.length} Teams</p>
          </div>
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Teams vorhanden. Erstellen Sie das erste Team.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/teams/${team.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {sportartLabel(team.sport)}
                    </Badge>
                    <Badge variant="outline">{team.ageGroup}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBearbeitungsTeam(team);
                      setFormularOffen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoeschen(team.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {team._count.teamMembers}
                    {team.maxKader !== null ? `/${team.maxKader}` : ''} Spieler
                  </span>
                  <span>{team._count.events} Veranstaltungen</span>
                  {team._count.warteliste > 0 && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {team._count.warteliste} auf Warteliste
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamFormular
        offen={formularOffen}
        onSchliessen={() => {
          setFormularOffen(false);
          setBearbeitungsTeam(null);
        }}
        onGespeichert={datenLaden}
        team={bearbeitungsTeam}
      />
    </div>
  );
}
