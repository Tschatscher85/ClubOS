'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNavItem({ href, label, icon: Icon }: SidebarNavItemProps) {
  const pathname = usePathname();
  const istAktiv = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        istAktiv
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
