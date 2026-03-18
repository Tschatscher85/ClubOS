import { SetMetadata } from '@nestjs/common';

export const BERECHTIGUNGEN_KEY = 'berechtigungen';
export const Berechtigungen = (...berechtigungen: string[]) =>
  SetMetadata(BERECHTIGUNGEN_KEY, berechtigungen);
