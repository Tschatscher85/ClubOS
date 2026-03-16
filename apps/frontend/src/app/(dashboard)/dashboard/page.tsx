import { WillkommenBanner } from '@/components/dashboard/willkommen-banner';
import { UebersichtKarten } from '@/components/dashboard/uebersicht-karten';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WillkommenBanner />
      <UebersichtKarten />
    </div>
  );
}
