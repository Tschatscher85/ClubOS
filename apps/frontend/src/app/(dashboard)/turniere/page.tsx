import { Trophy } from 'lucide-react';

export default function TurnierePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Turnier-Manager</h1>
      <p className="text-muted-foreground">
        Hier werden bald Turniere geplant und live angezeigt.
      </p>
    </div>
  );
}
