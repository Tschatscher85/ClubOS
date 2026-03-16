'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function TenantThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeAnwenden = useAuthStore((s) => s.themeAnwenden);

  useEffect(() => {
    themeAnwenden();
  }, [themeAnwenden]);

  return <>{children}</>;
}
