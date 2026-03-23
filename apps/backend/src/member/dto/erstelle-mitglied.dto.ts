import {
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberStatus, Ermaessigung, NachweisStatus } from '@prisma/client';

export class ErstelleMitgliedDto {
  @ApiProperty({ example: 'Max', description: 'Vorname' })
  @IsString({ message: 'Vorname muss ein Text sein.' })
  @MinLength(1, { message: 'Vorname darf nicht leer sein.' })
  vorname!: string;

  @ApiProperty({ example: 'Mustermann', description: 'Nachname' })
  @IsString({ message: 'Nachname muss ein Text sein.' })
  @MinLength(1, { message: 'Nachname darf nicht leer sein.' })
  nachname!: string;

  @ApiPropertyOptional({ example: 'max@beispiel.de', description: 'E-Mail-Adresse des Mitglieds' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  email?: string;

  @ApiPropertyOptional({ example: '2010-05-15', description: 'Geburtsdatum' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  geburtsdatum?: string;

  @ApiPropertyOptional({ example: '+49 176 12345678' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({ example: 'Musterstr. 1, 73037 Goeppingen' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: ['FUSSBALL', 'HANDBALL'], description: 'Sportarten (mehrere moeglich)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Eintrittsdatum' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Eintrittsdatum angeben.' })
  eintrittsdatum?: string;

  @ApiPropertyOptional({
    example: 'eltern@beispiel.de',
    description: 'E-Mail der Eltern (bei Jugendlichen)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  elternEmail?: string;

  @ApiPropertyOptional({
    description: 'Member-ID des Elternteils (fuer automatische Familie-Verknuepfung)',
  })
  @IsOptional()
  @IsString()
  elternMemberId?: string;

  @ApiPropertyOptional({ description: 'Eltern erlauben Fotos (Minderjährige, KUG §22)' })
  @IsOptional()
  fotoErlaubnis?: boolean;

  @ApiPropertyOptional({ description: 'Eltern erlauben Mitfahrt in Fahrgemeinschaften (Minderjährige, §832 BGB)' })
  @IsOptional()
  fahrgemeinschaftErlaubnis?: boolean;

  @ApiPropertyOptional({ description: 'Benutzerkonto fuer Kind erstellen (Eltern muessen zustimmen)' })
  @IsOptional()
  erstelleBenutzerKonto?: boolean;

  @ApiPropertyOptional({ description: 'Vereinsrollen (fuer Mitglieder ohne User-Account)', example: ['Jugendspieler'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vereinsRollen?: string[];
}

export class VerknuepfeMitgliedDto {
  @ApiProperty({ example: 'clxyz123', description: 'Benutzer-ID zur Verknuepfung' })
  @IsString({ message: 'userId muss ein Text sein.' })
  userId!: string;
}

export class StatusAendernDto {
  @ApiProperty({ enum: MemberStatus, example: MemberStatus.ACTIVE })
  @IsEnum(MemberStatus, { message: 'Ungueltiger Mitgliedsstatus.' })
  status!: MemberStatus;
}

export class BatchFreigebenDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'Liste der Mitglieder-IDs' })
  @IsArray({ message: 'ids muss ein Array sein.' })
  @IsString({ each: true, message: 'Jede ID muss ein Text sein.' })
  ids!: string[];
}

export class BeitragSetzenDto {
  @ApiPropertyOptional({ example: 'Jahresbeitrag Erwachsene', description: 'Beitragsart' })
  @IsOptional()
  @IsString({ message: 'beitragsArt muss ein Text sein.' })
  beitragsArt?: string;

  @ApiPropertyOptional({ example: 120, description: 'Beitragsbetrag in Euro' })
  @IsOptional()
  @IsNumber({}, { message: 'beitragBetrag muss eine Zahl sein.' })
  @Min(0, { message: 'beitragBetrag darf nicht negativ sein.' })
  beitragBetrag?: number;

  @ApiPropertyOptional({
    example: 'JAEHRLICH',
    description: 'Beitragsintervall (MONATLICH, QUARTALSWEISE, HALBJAEHRLICH, JAEHRLICH)',
  })
  @IsOptional()
  @IsString({ message: 'beitragIntervall muss ein Text sein.' })
  beitragIntervall?: string;

  @ApiPropertyOptional({ enum: Ermaessigung, description: 'Ermaessigungsgrund' })
  @IsOptional()
  @IsEnum(Ermaessigung, { message: 'Ungueltiger Ermaessigungsgrund.' })
  ermaessigung?: Ermaessigung;

  @ApiPropertyOptional({ example: 50, description: 'Ermaessigung in Prozent' })
  @IsOptional()
  @IsNumber({}, { message: 'ermaessigungProzent muss eine Zahl sein.' })
  @Min(0, { message: 'Ermaessigung darf nicht negativ sein.' })
  @Max(100, { message: 'Ermaessigung darf nicht ueber 100% sein.' })
  ermaessigungProzent?: number;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Ermaessigung gueltig bis' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  ermaessigungBis?: string;
}

export class NachweisStatusAendernDto {
  @ApiProperty({
    enum: [NachweisStatus.GENEHMIGT, NachweisStatus.ABGELEHNT],
    description: 'Neuer Nachweisstatus (GENEHMIGT oder ABGELEHNT)',
  })
  @IsEnum(NachweisStatus, { message: 'Ungueltiger Nachweisstatus.' })
  status!: NachweisStatus;
}

export class AktualisiereMitgliedDto {
  @ApiPropertyOptional({ example: 'Max' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  vorname?: string;

  @ApiPropertyOptional({ example: 'Mustermann' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  nachname?: string;

  @ApiPropertyOptional({ example: 'max@beispiel.de' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  email?: string;

  @ApiPropertyOptional({ example: '2010-05-15' })
  @IsOptional()
  @IsDateString()
  geburtsdatum?: string;

  @ApiPropertyOptional({ example: '+49 176 12345678' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({ example: 'Musterstr. 1, 73037 Goeppingen' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: ['FUSSBALL', 'HANDBALL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Eintrittsdatum' })
  @IsOptional()
  @IsDateString()
  eintrittsdatum?: string;

  @ApiPropertyOptional({ example: 'eltern@beispiel.de' })
  @IsOptional()
  @IsEmail()
  elternEmail?: string;

  @ApiPropertyOptional({
    description: 'Member-ID des Elternteils (fuer automatische Familie-Verknuepfung)',
  })
  @IsOptional()
  @IsString()
  elternMemberId?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Ungueltiger Mitgliedsstatus.' })
  status?: MemberStatus;

  @ApiPropertyOptional({ description: 'ID der Beitragsklasse' })
  @IsOptional()
  @IsString()
  beitragsklasseId?: string | null;

  @ApiPropertyOptional({ description: 'Individueller Beitragsbetrag in EUR' })
  @IsOptional()
  @IsNumber()
  beitragBetrag?: number | null;

  @ApiPropertyOptional({ description: 'Beitragsintervall' })
  @IsOptional()
  @IsString()
  beitragIntervall?: string | null;

  @ApiPropertyOptional({ description: 'Eltern erlauben Fotos (Minderjährige, KUG §22)' })
  @IsOptional()
  fotoErlaubnis?: boolean;

  @ApiPropertyOptional({ description: 'Eltern erlauben Mitfahrt in Fahrgemeinschaften (Minderjährige, §832 BGB)' })
  @IsOptional()
  fahrgemeinschaftErlaubnis?: boolean;

  @ApiPropertyOptional({ description: 'Benutzerkonto fuer Kind erstellen (Eltern muessen zustimmen)' })
  @IsOptional()
  erstelleBenutzerKonto?: boolean;

  @ApiPropertyOptional({ description: 'Vereinsrollen (fuer Mitglieder ohne User-Account)', example: ['Jugendspieler'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vereinsRollen?: string[];
}
