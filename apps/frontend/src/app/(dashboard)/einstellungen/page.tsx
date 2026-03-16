import { Settings } from 'lucide-react';

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Settings className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Einstellungen</h1>
      <p className="text-muted-foreground">
        Hier werden bald Vereins- und Benutzereinstellungen verwaltet.
      </p>
    </div>
  );
}
