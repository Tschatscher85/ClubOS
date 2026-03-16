'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const istAngemeldet = useAuthStore((s) => s.istAngemeldet);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (istAngemeldet && accessToken) {
      router.replace('/dashboard');
    } else {
      router.replace('/anmelden');
    }
  }, [istAngemeldet, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Laden...</div>
    </div>
  );
}
