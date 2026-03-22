'use client';

import dynamic from 'next/dynamic';

const GalerieSeite = dynamic(() => import('./page'), { ssr: false });

export default function GalerieInhalt() {
  return (
    <div className="[&>div>div:first-child]:hidden">
      <GalerieSeite />
    </div>
  );
}
