'use client';

import dynamic from 'next/dynamic';

const EhrenamtSeite = dynamic(() => import('./page'), { ssr: false });

/**
 * Ehrenamt-Inhalt als einbettbare Komponente.
 * Blendet den Seiten-Header aus, da er im Mitglieder-Tab nicht noetig ist.
 */
export default function EhrenamtInhalt() {
  return (
    <div className="ehrenamt-eingebettet [&>div>div:first-child]:hidden">
      <EhrenamtSeite />
    </div>
  );
}
