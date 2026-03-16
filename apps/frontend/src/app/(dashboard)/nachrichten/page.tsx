import { MessageSquare } from 'lucide-react';

export default function NachrichtenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Nachrichten</h1>
      <p className="text-muted-foreground">
        Hier wird bald die Vereinskommunikation stattfinden.
      </p>
    </div>
  );
}
