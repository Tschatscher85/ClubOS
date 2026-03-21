'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PendingBadgeProps {
  label: string;
}

export function PendingBadge({ label }: PendingBadgeProps) {
  const envWert =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_HANDELSREGISTERNUMMER
      : null;

  if (envWert) {
    return <span>{envWert}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-orange-500 text-white hover:bg-orange-600 cursor-help">
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bitte nach Notartermin eintragen</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
