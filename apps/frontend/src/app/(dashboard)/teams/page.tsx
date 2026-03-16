import { Shield } from 'lucide-react';

export default function TeamsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Shield className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Mannschaften</h1>
      <p className="text-muted-foreground">
        Hier werden bald alle Teams und Mannschaften verwaltet.
      </p>
    </div>
  );
}
