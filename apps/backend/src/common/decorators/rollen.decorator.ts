import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLLEN_KEY = 'rollen';
export const Rollen = (...rollen: Role[]) => SetMetadata(ROLLEN_KEY, rollen);
