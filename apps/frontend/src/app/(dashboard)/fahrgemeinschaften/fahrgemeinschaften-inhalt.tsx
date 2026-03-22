'use client';

import dynamic from 'next/dynamic';

const FahrgemeinschaftenSeite = dynamic(() => import('./page'), { ssr: false });

export default function FahrgemeinschaftenInhalt() {
  return (
    <div className="[&>div>div:first-child]:hidden">
      <FahrgemeinschaftenSeite />
    </div>
  );
}
