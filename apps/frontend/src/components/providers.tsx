'use client';

import { TenantThemeProvider } from './tenant-theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <TenantThemeProvider>{children}</TenantThemeProvider>;
}
