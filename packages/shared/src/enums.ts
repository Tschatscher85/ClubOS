// Benutzerrollen
export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  MEMBER = 'MEMBER',
  PARENT = 'PARENT',
}

// Vereins-Tarife
export enum Plan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  CLUB = 'CLUB',
  ENTERPRISE = 'ENTERPRISE',
  SELF_HOSTED = 'SELF_HOSTED',
}

// Mitgliedsstatus
export enum MemberStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

// Sportarten
export enum Sport {
  FUSSBALL = 'FUSSBALL',
  HANDBALL = 'HANDBALL',
  BASKETBALL = 'BASKETBALL',
  FOOTBALL = 'FOOTBALL',
  TENNIS = 'TENNIS',
  TURNEN = 'TURNEN',
  SCHWIMMEN = 'SCHWIMMEN',
  LEICHTATHLETIK = 'LEICHTATHLETIK',
  SONSTIGES = 'SONSTIGES',
}

// Veranstaltungstypen
export enum EventType {
  TRAINING = 'TRAINING',
  MATCH = 'MATCH',
  TOURNAMENT = 'TOURNAMENT',
  TRIP = 'TRIP',
  MEETING = 'MEETING',
}

// Anwesenheitsstatus
export enum AttendanceStatus {
  PENDING = 'PENDING',
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE',
}

// Turnierformate
export enum TournamentFormat {
  GRUPPE = 'GRUPPE',
  KO = 'KO',
  SCHWEIZER = 'SCHWEIZER',
  KOMBINATION = 'KOMBINATION',
}

// Spielstatus
export enum MatchStatus {
  GEPLANT = 'GEPLANT',
  LAUFEND = 'LAUFEND',
  BEENDET = 'BEENDET',
  ABGESAGT = 'ABGESAGT',
}

// Formulartypen
export enum FormType {
  MITGLIEDSANTRAG = 'MITGLIEDSANTRAG',
  EINVERSTAENDNIS = 'EINVERSTAENDNIS',
  SONSTIGES = 'SONSTIGES',
}

// Erinnerungstypen
export enum ReminderType {
  H24 = 'H24',
  H2 = 'H2',
  CUSTOM = 'CUSTOM',
}

// Nachrichtentypen
export enum MessageType {
  BROADCAST = 'BROADCAST',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  TEAM_CHAT = 'TEAM_CHAT',
  QUESTION = 'QUESTION',
  FAQ_ANSWER = 'FAQ_ANSWER',
}
