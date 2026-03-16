import { Role, Plan } from './enums';

// Auth Types
export interface RegistrierenPayload {
  email: string;
  passwort: string;
  vereinsname: string;
  slug: string;
}

export interface AnmeldenPayload {
  email: string;
  passwort: string;
}

export interface TokenPaar {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  rolle: Role;
  tenantId: string;
}

// Tenant Types
export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  plan: Plan;
}

// User Types
export interface BenutzerProfil {
  id: string;
  email: string;
  rolle: Role;
  tenantId: string;
  erstelltAm: Date;
}

// API Response Types
export interface ApiAntwort<T = unknown> {
  erfolg: boolean;
  daten?: T;
  nachricht?: string;
}

export interface PaginierteAntwort<T> {
  daten: T[];
  gesamt: number;
  seite: number;
  proSeite: number;
}
