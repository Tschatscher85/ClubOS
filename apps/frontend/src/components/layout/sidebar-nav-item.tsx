'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function SidebarNavItem({ href, label, icon: Icon, badge }: SidebarNavItemProps) {
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
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
