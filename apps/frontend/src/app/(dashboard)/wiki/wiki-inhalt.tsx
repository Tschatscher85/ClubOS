'use client';

import dynamic from 'next/dynamic';

const WikiSeite = dynamic(() => import('./page'), { ssr: false });

/**
 * Wiki-Inhalt als einbettbare Komponente.
 * Blendet den Seiten-Header aus, da er im Dokumente-Tab nicht noetig ist.
 */
export default function WikiInhalt() {
  return (
    <div className="[&>div>div:first-child]:hidden">
      <WikiSeite />
    </div>
  );
}
