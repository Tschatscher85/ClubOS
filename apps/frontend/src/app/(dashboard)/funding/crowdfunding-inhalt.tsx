'use client';

import dynamic from 'next/dynamic';

const CrowdfundingSeite = dynamic(() => import('./page'), { ssr: false });

/**
 * Crowdfunding-Inhalt als einbettbare Komponente.
 * Blendet den Seiten-Header aus, da er im Sponsoren-Tab nicht noetig ist.
 */
export default function CrowdfundingInhalt() {
  return (
    <div className="[&>div>div:first-child]:hidden">
      <CrowdfundingSeite />
    </div>
  );
}
