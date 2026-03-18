--
-- PostgreSQL database dump
--

\restrict kcXsmpdB4ZrPVdcAjtgnZ9LgUs43Di7EbWBRFmY2CJ7VSltbfLLnlR90bKjthiL

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: clubos
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO clubos;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: clubos
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PENDING',
    'YES',
    'NO',
    'MAYBE'
);


ALTER TYPE public."AttendanceStatus" OWNER TO clubos;

--
-- Name: DokumentKategorie; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."DokumentKategorie" AS ENUM (
    'MITGLIEDSANTRAG',
    'VERTRAG',
    'RECHNUNG',
    'PROTOKOLL',
    'TRAININGSPLAN',
    'SATZUNG',
    'DATENSCHUTZ',
    'SONSTIGES'
);


ALTER TYPE public."DokumentKategorie" OWNER TO clubos;

--
-- Name: EinladungStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."EinladungStatus" AS ENUM (
    'GESENDET',
    'GEOEFFNET',
    'AUSGEFUELLT',
    'ABGELAUFEN'
);


ALTER TYPE public."EinladungStatus" OWNER TO clubos;

--
-- Name: EmailOrdner; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."EmailOrdner" AS ENUM (
    'POSTEINGANG',
    'GESENDET',
    'ENTWUERFE',
    'ARCHIV',
    'PAPIERKORB'
);


ALTER TYPE public."EmailOrdner" OWNER TO clubos;

--
-- Name: Ermaessigung; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."Ermaessigung" AS ENUM (
    'KEINE',
    'STUDENT',
    'SCHUELER',
    'AZUBI',
    'RENTNER',
    'SCHWERBEHINDERT',
    'EHRENAMT',
    'FAMILIE',
    'SOZIAL',
    'SONSTIGE'
);


ALTER TYPE public."Ermaessigung" OWNER TO clubos;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."EventType" AS ENUM (
    'TRAINING',
    'MATCH',
    'TOURNAMENT',
    'TRIP',
    'MEETING'
);


ALTER TYPE public."EventType" OWNER TO clubos;

--
-- Name: FormType; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."FormType" AS ENUM (
    'MITGLIEDSANTRAG',
    'EINVERSTAENDNIS',
    'DATENSCHUTZ',
    'SONSTIGES'
);


ALTER TYPE public."FormType" OWNER TO clubos;

--
-- Name: FrageStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."FrageStatus" AS ENUM (
    'OFFEN',
    'AUTOMATISCH_BEANTWORTET',
    'BEANTWORTET'
);


ALTER TYPE public."FrageStatus" OWNER TO clubos;

--
-- Name: MatchStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."MatchStatus" AS ENUM (
    'GEPLANT',
    'LAUFEND',
    'BEENDET',
    'ABGESAGT'
);


ALTER TYPE public."MatchStatus" OWNER TO clubos;

--
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."MemberStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'CANCELLED'
);


ALTER TYPE public."MemberStatus" OWNER TO clubos;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."MessageType" AS ENUM (
    'BROADCAST',
    'ANNOUNCEMENT',
    'TEAM_CHAT',
    'QUESTION',
    'FAQ_ANSWER'
);


ALTER TYPE public."MessageType" OWNER TO clubos;

--
-- Name: NachweisStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."NachweisStatus" AS ENUM (
    'NICHT_ERFORDERLICH',
    'AUSSTEHEND',
    'EINGEREICHT',
    'GENEHMIGT',
    'ABGELEHNT',
    'ABGELAUFEN'
);


ALTER TYPE public."NachweisStatus" OWNER TO clubos;

--
-- Name: Plan; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."Plan" AS ENUM (
    'STARTER',
    'PRO',
    'CLUB',
    'ENTERPRISE',
    'SELF_HOSTED'
);


ALTER TYPE public."Plan" OWNER TO clubos;

--
-- Name: ReaktionTyp; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."ReaktionTyp" AS ENUM (
    'GESEHEN',
    'JA',
    'NEIN',
    'VIELLEICHT'
);


ALTER TYPE public."ReaktionTyp" OWNER TO clubos;

--
-- Name: RechnungStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."RechnungStatus" AS ENUM (
    'OFFEN',
    'BEZAHLT',
    'UEBERFAELLIG',
    'STORNIERT'
);


ALTER TYPE public."RechnungStatus" OWNER TO clubos;

--
-- Name: ReminderType; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."ReminderType" AS ENUM (
    'H24',
    'H2',
    'CUSTOM'
);


ALTER TYPE public."ReminderType" OWNER TO clubos;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."Role" AS ENUM (
    'SUPERADMIN',
    'ADMIN',
    'TRAINER',
    'MEMBER',
    'PARENT'
);


ALTER TYPE public."Role" OWNER TO clubos;

--
-- Name: SchiriStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."SchiriStatus" AS ENUM (
    'EINGETEILT',
    'BESTAETIGT',
    'ABGELEHNT',
    'ERSATZ'
);


ALTER TYPE public."SchiriStatus" OWNER TO clubos;

--
-- Name: SektionsTyp; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."SektionsTyp" AS ENUM (
    'HERO',
    'UEBER_UNS',
    'ABTEILUNGEN',
    'MANNSCHAFTEN',
    'TERMINE',
    'NEUIGKEITEN',
    'KONTAKT',
    'SPONSOREN',
    'GALERIE',
    'MITGLIED_WERDEN',
    'FREITEXT',
    'TURNIER'
);


ALTER TYPE public."SektionsTyp" OWNER TO clubos;

--
-- Name: Sport; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."Sport" AS ENUM (
    'FUSSBALL',
    'HANDBALL',
    'BASKETBALL',
    'FOOTBALL',
    'TENNIS',
    'TURNEN',
    'SCHWIMMEN',
    'LEICHTATHLETIK',
    'VOLLEYBALL',
    'TISCHTENNIS',
    'BADMINTON',
    'HOCKEY',
    'RUGBY',
    'BASEBALL',
    'SOFTBALL',
    'EISHOCKEY',
    'WASSERBALL',
    'RINGEN',
    'JUDO',
    'KARATE',
    'TAEKWONDO',
    'BOXEN',
    'FECHTEN',
    'REITEN',
    'GOLF',
    'KLETTERN',
    'SKIFAHREN',
    'SNOWBOARD',
    'RADSPORT',
    'TRIATHLON',
    'RUDERN',
    'KANU',
    'SEGELN',
    'TANZEN',
    'YOGA',
    'FITNESS',
    'CROSSFIT',
    'WANDERN',
    'LAUFEN',
    'DART',
    'BILLARD',
    'SCHACH',
    'ESPORT',
    'CHEERLEADING',
    'AKROBATIK',
    'TRAMPOLINTURNEN',
    'RHYTHMISCHE_SPORTGYMNASTIK',
    'EISKUNSTLAUF',
    'BOGENSCHIESSEN',
    'SCHIESSEN',
    'ANGELN',
    'MOTORSPORT',
    'FLOORBALL',
    'LACROSSE',
    'CRICKET',
    'SQUASH',
    'KICKBOXEN',
    'MMA',
    'CAPOEIRA',
    'PARKOUR',
    'SKATEBOARD',
    'SURFEN',
    'TAUCHEN',
    'WASSERSKI',
    'GEWICHTHEBEN',
    'POWERLIFTING',
    'ROLLSPORT',
    'PETANQUE',
    'CURLING',
    'SONSTIGES',
    'CUSTOM'
);


ALTER TYPE public."Sport" OWNER TO clubos;

--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'EINGEREICHT',
    'IN_PRUEFUNG',
    'GENEHMIGT',
    'ABGELEHNT',
    'ARCHIVIERT'
);


ALTER TYPE public."SubmissionStatus" OWNER TO clubos;

--
-- Name: TournamentFormat; Type: TYPE; Schema: public; Owner: clubos
--

CREATE TYPE public."TournamentFormat" AS ENUM (
    'GRUPPE',
    'KO',
    'SCHWEIZER',
    'KOMBINATION'
);


ALTER TYPE public."TournamentFormat" OWNER TO clubos;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Abteilung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Abteilung" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    sport public."Sport" NOT NULL,
    "leiterIds" text[],
    beschreibung text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Abteilung" OWNER TO clubos;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "memberId" text NOT NULL,
    status public."AttendanceStatus" DEFAULT 'PENDING'::public."AttendanceStatus" NOT NULL,
    reason text,
    "answeredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO clubos;

--
-- Name: Beitrag; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Beitrag" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    betrag double precision NOT NULL,
    intervall text NOT NULL,
    sportart text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Beitrag" OWNER TO clubos;

--
-- Name: BenachrichtigungsEinstellung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."BenachrichtigungsEinstellung" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "pushAktiv" boolean DEFAULT true NOT NULL,
    "emailAktiv" boolean DEFAULT true NOT NULL,
    "stilleStundenVon" integer DEFAULT 22 NOT NULL,
    "stilleStundenBis" integer DEFAULT 7 NOT NULL,
    "notfallUeberschreiben" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BenachrichtigungsEinstellung" OWNER TO clubos;

--
-- Name: CustomSportart; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."CustomSportart" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    beschreibung text,
    icon text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomSportart" OWNER TO clubos;

--
-- Name: Dokument; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Dokument" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    beschreibung text,
    "dateiUrl" text NOT NULL,
    "dateiGroesse" integer NOT NULL,
    "dateiTyp" text NOT NULL,
    kategorie public."DokumentKategorie" DEFAULT 'SONSTIGES'::public."DokumentKategorie" NOT NULL,
    ordner text,
    "hochgeladenVon" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Dokument" OWNER TO clubos;

--
-- Name: Einladung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Einladung" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    token text NOT NULL,
    vorname text NOT NULL,
    nachname text NOT NULL,
    email text NOT NULL,
    "templateIds" text[],
    sportarten text[],
    geburtsdatum text,
    "workflowId" text,
    status public."EinladungStatus" DEFAULT 'GESENDET'::public."EinladungStatus" NOT NULL,
    "eingeladenVon" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Einladung" OWNER TO clubos;

--
-- Name: ElternFrage; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."ElternFrage" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "teamId" text,
    "fragenderId" text NOT NULL,
    frage text NOT NULL,
    antwort text,
    automatisch boolean DEFAULT false NOT NULL,
    status public."FrageStatus" DEFAULT 'OFFEN'::public."FrageStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "beantwortetAm" timestamp(3) without time zone
);


ALTER TABLE public."ElternFrage" OWNER TO clubos;

--
-- Name: EmailEinstellungen; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."EmailEinstellungen" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "smtpHost" text NOT NULL,
    "smtpPort" integer DEFAULT 587 NOT NULL,
    "smtpUser" text NOT NULL,
    "smtpPass" text NOT NULL,
    "absenderEmail" text NOT NULL,
    "absenderName" text NOT NULL,
    signatur text,
    "istAktiv" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailEinstellungen" OWNER TO clubos;

--
-- Name: EmailEntwurf; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."EmailEntwurf" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "absenderId" text NOT NULL,
    an text[],
    betreff text,
    inhalt text,
    anhaenge text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailEntwurf" OWNER TO clubos;

--
-- Name: EmailPosteingang; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."EmailPosteingang" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "empfaengerId" text,
    von text NOT NULL,
    "vonName" text,
    an text NOT NULL,
    betreff text NOT NULL,
    inhalt text NOT NULL,
    "inhaltText" text,
    gelesen boolean DEFAULT false NOT NULL,
    "istWichtig" boolean DEFAULT false NOT NULL,
    ordner text DEFAULT 'POSTEINGANG'::text NOT NULL,
    anhaenge text[],
    "messageId" text,
    "inReplyTo" text,
    "empfangenAm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EmailPosteingang" OWNER TO clubos;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    type public."EventType" NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    location text NOT NULL,
    "hallName" text,
    "hallAddress" text,
    "teamId" text NOT NULL,
    "tenantId" text NOT NULL,
    notes text,
    "recurrenceRule" text,
    "recurrenceEnd" timestamp(3) without time zone,
    "parentEventId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO clubos;

--
-- Name: EventComment; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."EventComment" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventComment" OWNER TO clubos;

--
-- Name: EventLandingpage; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."EventLandingpage" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "istAktiv" boolean DEFAULT true NOT NULL,
    slug text NOT NULL,
    titel text NOT NULL,
    beschreibung text,
    "bannerBildUrl" text,
    ort text,
    datum text,
    zeitplan text,
    anfahrt text,
    "kontaktEmail" text,
    "kontaktTelefon" text,
    "seoTitel" text,
    "seoBeschreibung" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventLandingpage" OWNER TO clubos;

--
-- Name: FAQ; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."FAQ" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "teamId" text,
    question text NOT NULL,
    answer text NOT NULL,
    "useCount" integer DEFAULT 0 NOT NULL,
    embedding jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FAQ" OWNER TO clubos;

--
-- Name: Fahrgemeinschaft; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Fahrgemeinschaft" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "eventId" text,
    "fahrerId" text NOT NULL,
    startort text NOT NULL,
    zielort text NOT NULL,
    abfahrt timestamp(3) without time zone NOT NULL,
    plaetze integer DEFAULT 4 NOT NULL,
    kommentar text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Fahrgemeinschaft" OWNER TO clubos;

--
-- Name: FormSubmission; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."FormSubmission" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "templateId" text NOT NULL,
    "eingereichtVon" text,
    email text NOT NULL,
    daten jsonb NOT NULL,
    "signatureUrl" text,
    "signaturDatenUrl" text,
    status public."SubmissionStatus" DEFAULT 'EINGEREICHT'::public."SubmissionStatus" NOT NULL,
    kommentar text,
    "archiviertePdf" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FormSubmission" OWNER TO clubos;

--
-- Name: FormTemplate; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."FormTemplate" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    type public."FormType" NOT NULL,
    "fileUrl" text NOT NULL,
    fields jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FormTemplate" OWNER TO clubos;

--
-- Name: Halle; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Halle" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    adresse text,
    kapazitaet integer,
    lat double precision,
    lng double precision,
    "mapsUrl" text,
    "parkplatzInfo" text,
    zugangscode text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Halle" OWNER TO clubos;

--
-- Name: Hallenbelegung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Hallenbelegung" (
    id text NOT NULL,
    "halleId" text NOT NULL,
    "teamId" text NOT NULL,
    wochentag text NOT NULL,
    von text NOT NULL,
    bis text NOT NULL,
    notiz text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Hallenbelegung" OWNER TO clubos;

--
-- Name: Homepage; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Homepage" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "istAktiv" boolean DEFAULT false NOT NULL,
    subdomain text,
    "customDomain" text,
    "heroTitel" text,
    "heroUntertitel" text,
    "heroBildUrl" text,
    "ueberUns" text,
    gruendungsjahr integer,
    "mitgliederAnzahl" integer,
    "kontaktEmail" text,
    "kontaktTelefon" text,
    "kontaktAdresse" text,
    oeffnungszeiten text,
    impressum text,
    datenschutz text,
    "socialFacebook" text,
    "socialInstagram" text,
    "socialYoutube" text,
    "seoTitel" text,
    "seoBeschreibung" text,
    "headerBildUrl" text,
    "footerText" text,
    "customCss" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Homepage" OWNER TO clubos;

--
-- Name: HomepageSektion; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."HomepageSektion" (
    id text NOT NULL,
    "homepageId" text NOT NULL,
    typ public."SektionsTyp" NOT NULL,
    titel text,
    inhalt text,
    "bildUrl" text,
    reihenfolge integer DEFAULT 0 NOT NULL,
    "istSichtbar" boolean DEFAULT true NOT NULL,
    daten jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HomepageSektion" OWNER TO clubos;

--
-- Name: Member; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Member" (
    id text NOT NULL,
    "userId" text,
    "tenantId" text NOT NULL,
    "memberNumber" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    "birthDate" timestamp(3) without time zone,
    phone text,
    address text,
    "joinDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "exitDate" timestamp(3) without time zone,
    status public."MemberStatus" DEFAULT 'PENDING'::public."MemberStatus" NOT NULL,
    sport text[],
    "qrCode" text,
    "parentEmail" text,
    "signatureUrl" text,
    "beitragsArt" text,
    "beitragBetrag" double precision,
    "beitragIntervall" text,
    ermaessigung public."Ermaessigung",
    "ermaessigungProzent" double precision,
    "ermaessigungBis" timestamp(3) without time zone,
    "nachweisDokUrl" text,
    "nachweisStatus" public."NachweisStatus" DEFAULT 'NICHT_ERFORDERLICH'::public."NachweisStatus" NOT NULL,
    "nachweisErinnerungGesendet" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Member" OWNER TO clubos;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "teamId" text,
    "senderId" text NOT NULL,
    content text NOT NULL,
    type public."MessageType" NOT NULL,
    "isEmergency" boolean DEFAULT false NOT NULL,
    "silentFrom" text,
    "silentTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Message" OWNER TO clubos;

--
-- Name: MessageReaction; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."MessageReaction" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    reaktion public."ReaktionTyp" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReaction" OWNER TO clubos;

--
-- Name: MessageRead; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."MessageRead" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageRead" OWNER TO clubos;

--
-- Name: Mitfahrer; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Mitfahrer" (
    id text NOT NULL,
    "fahrgemeinschaftId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Mitfahrer" OWNER TO clubos;

--
-- Name: PinboardItem; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."PinboardItem" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "teamId" text NOT NULL,
    titel text NOT NULL,
    inhalt text NOT NULL,
    icon text DEFAULT 'info'::text NOT NULL,
    "istAngepinnt" boolean DEFAULT false NOT NULL,
    "erstelltVon" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PinboardItem" OWNER TO clubos;

--
-- Name: Profilbild; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Profilbild" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "bildUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Profilbild" OWNER TO clubos;

--
-- Name: Rechnung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Rechnung" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "rechnungsNr" text NOT NULL,
    betrag double precision NOT NULL,
    beschreibung text NOT NULL,
    "faelligAm" timestamp(3) without time zone NOT NULL,
    "bezahltAm" timestamp(3) without time zone,
    status public."RechnungStatus" DEFAULT 'OFFEN'::public."RechnungStatus" NOT NULL,
    "sepaMandat" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Rechnung" OWNER TO clubos;

--
-- Name: Reminder; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Reminder" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    type public."ReminderType" NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "scheduledFor" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Reminder" OWNER TO clubos;

--
-- Name: RollenVorlage; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."RollenVorlage" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    beschreibung text,
    "systemRolle" public."Role" NOT NULL,
    berechtigungen text[],
    farbe text,
    sortierung integer DEFAULT 0 NOT NULL,
    "istStandard" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RollenVorlage" OWNER TO clubos;

--
-- Name: SchiedsrichterEinteilung; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."SchiedsrichterEinteilung" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "eventId" text NOT NULL,
    "memberId" text NOT NULL,
    status public."SchiriStatus" DEFAULT 'EINGETEILT'::public."SchiriStatus" NOT NULL,
    bestaetigt boolean DEFAULT false NOT NULL,
    notiz text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SchiedsrichterEinteilung" OWNER TO clubos;

--
-- Name: SchnellAnmeldungToken; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."SchnellAnmeldungToken" (
    id text NOT NULL,
    token text NOT NULL,
    "eventId" text NOT NULL,
    "memberId" text NOT NULL,
    benutzt boolean DEFAULT false NOT NULL,
    "gueltigBis" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SchnellAnmeldungToken" OWNER TO clubos;

--
-- Name: Sponsor; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Sponsor" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "logoUrl" text,
    webseite text,
    beschreibung text,
    "kontaktName" text,
    "kontaktEmail" text,
    "istAktiv" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sponsor" OWNER TO clubos;

--
-- Name: Team; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    name text NOT NULL,
    sport public."Sport" NOT NULL,
    "ageGroup" text NOT NULL,
    "trainerId" text NOT NULL,
    "tenantId" text NOT NULL,
    "abteilungId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Team" OWNER TO clubos;

--
-- Name: TeamMember; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."TeamMember" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "memberId" text NOT NULL,
    rolle text DEFAULT 'SPIELER'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TeamMember" OWNER TO clubos;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "primaryColor" text DEFAULT '#1a56db'::text NOT NULL,
    plan public."Plan" DEFAULT 'STARTER'::public."Plan" NOT NULL,
    domain text,
    "kiProvider" text DEFAULT 'anthropic'::text NOT NULL,
    "kiApiKey" text,
    "kiModell" text,
    "vereinsNr" text,
    amtsgericht text,
    gruendungsjahr integer,
    anschrift text,
    plz text,
    ort text,
    bundesland text,
    telefon text,
    email text,
    webseite text,
    "vorstand1Name" text,
    "vorstand1Funktion" text,
    "vorstand2Name" text,
    "vorstand2Funktion" text,
    kassenwart text,
    schriftfuehrer text,
    jugendwart text,
    "satzungUrl" text,
    "satzungDatum" timestamp(3) without time zone,
    impressum text,
    "datenschutzUrl" text,
    "datenschutzText" text,
    "haftpflichtVersicherung" text,
    "haftpflichtPoliceNr" text,
    "haftpflichtGueltigBis" timestamp(3) without time zone,
    "unfallVersicherung" text,
    "unfallPoliceNr" text,
    "unfallGueltigBis" timestamp(3) without time zone,
    "gewaehrleistungsVersicherung" text,
    steuernummer text,
    finanzamt text,
    "gemeinnuetzigBis" timestamp(3) without time zone,
    "gemeinnuetzigUrl" text,
    iban text,
    bic text,
    "bankName" text,
    "smtpHost" text,
    "smtpPort" integer DEFAULT 587,
    "smtpUser" text,
    "smtpPass" text,
    "smtpAbsenderEmail" text,
    "smtpAbsenderName" text,
    landessportbund text,
    sportverband text,
    "verbandsMitgliedsNr" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO clubos;

--
-- Name: Tournament; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Tournament" (
    id text NOT NULL,
    name text NOT NULL,
    sport public."Sport" NOT NULL,
    format public."TournamentFormat" NOT NULL,
    "publicUrl" text NOT NULL,
    "tenantId" text NOT NULL,
    "isLive" boolean DEFAULT false NOT NULL,
    "qrCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tournament" OWNER TO clubos;

--
-- Name: TournamentMatch; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."TournamentMatch" (
    id text NOT NULL,
    "tournamentId" text NOT NULL,
    team1 text NOT NULL,
    team2 text NOT NULL,
    score1 integer,
    score2 integer,
    "time" timestamp(3) without time zone,
    field text,
    status public."MatchStatus" DEFAULT 'GEPLANT'::public."MatchStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TournamentMatch" OWNER TO clubos;

--
-- Name: TurnierLandingpage; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."TurnierLandingpage" (
    id text NOT NULL,
    "tournamentId" text NOT NULL,
    "istAktiv" boolean DEFAULT true NOT NULL,
    slug text NOT NULL,
    titel text NOT NULL,
    beschreibung text,
    "bannerBildUrl" text,
    ort text,
    datum text,
    "teilnahmeInfo" text,
    preise text,
    sponsoren text[],
    "sponsorLogos" text[],
    "kontaktEmail" text,
    "seoTitel" text,
    "seoBeschreibung" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TurnierLandingpage" OWNER TO clubos;

--
-- Name: User; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text,
    role public."Role" NOT NULL,
    "tenantId" text NOT NULL,
    "refreshToken" text,
    "emailVerifiziert" boolean DEFAULT false NOT NULL,
    "emailVerifyToken" text,
    "emailVerifyExpiresAt" timestamp(3) without time zone,
    "passwortResetToken" text,
    "passwortResetExpiresAt" timestamp(3) without time zone,
    "googleId" text,
    "vereinsRollen" text[],
    berechtigungen text[],
    "istAktiv" boolean DEFAULT true NOT NULL,
    "letzterLogin" timestamp(3) without time zone,
    "eingeladenVon" text,
    notizen text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO clubos;

--
-- Name: Workflow; Type: TABLE; Schema: public; Owner: clubos
--

CREATE TABLE public."Workflow" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    beschreibung text,
    "templateIds" text[],
    sportarten text[],
    "emailBetreff" text,
    "emailText" text,
    "istAktiv" boolean DEFAULT true NOT NULL,
    "erstelltVon" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Workflow" OWNER TO clubos;

--
-- Name: Abteilung Abteilung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Abteilung"
    ADD CONSTRAINT "Abteilung_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: Beitrag Beitrag_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Beitrag"
    ADD CONSTRAINT "Beitrag_pkey" PRIMARY KEY (id);


--
-- Name: BenachrichtigungsEinstellung BenachrichtigungsEinstellung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."BenachrichtigungsEinstellung"
    ADD CONSTRAINT "BenachrichtigungsEinstellung_pkey" PRIMARY KEY (id);


--
-- Name: CustomSportart CustomSportart_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."CustomSportart"
    ADD CONSTRAINT "CustomSportart_pkey" PRIMARY KEY (id);


--
-- Name: Dokument Dokument_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Dokument"
    ADD CONSTRAINT "Dokument_pkey" PRIMARY KEY (id);


--
-- Name: Einladung Einladung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Einladung"
    ADD CONSTRAINT "Einladung_pkey" PRIMARY KEY (id);


--
-- Name: ElternFrage ElternFrage_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."ElternFrage"
    ADD CONSTRAINT "ElternFrage_pkey" PRIMARY KEY (id);


--
-- Name: EmailEinstellungen EmailEinstellungen_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EmailEinstellungen"
    ADD CONSTRAINT "EmailEinstellungen_pkey" PRIMARY KEY (id);


--
-- Name: EmailEntwurf EmailEntwurf_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EmailEntwurf"
    ADD CONSTRAINT "EmailEntwurf_pkey" PRIMARY KEY (id);


--
-- Name: EmailPosteingang EmailPosteingang_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EmailPosteingang"
    ADD CONSTRAINT "EmailPosteingang_pkey" PRIMARY KEY (id);


--
-- Name: EventComment EventComment_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EventComment"
    ADD CONSTRAINT "EventComment_pkey" PRIMARY KEY (id);


--
-- Name: EventLandingpage EventLandingpage_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EventLandingpage"
    ADD CONSTRAINT "EventLandingpage_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: FAQ FAQ_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FAQ"
    ADD CONSTRAINT "FAQ_pkey" PRIMARY KEY (id);


--
-- Name: Fahrgemeinschaft Fahrgemeinschaft_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Fahrgemeinschaft"
    ADD CONSTRAINT "Fahrgemeinschaft_pkey" PRIMARY KEY (id);


--
-- Name: FormSubmission FormSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_pkey" PRIMARY KEY (id);


--
-- Name: FormTemplate FormTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FormTemplate"
    ADD CONSTRAINT "FormTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Halle Halle_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Halle"
    ADD CONSTRAINT "Halle_pkey" PRIMARY KEY (id);


--
-- Name: Hallenbelegung Hallenbelegung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Hallenbelegung"
    ADD CONSTRAINT "Hallenbelegung_pkey" PRIMARY KEY (id);


--
-- Name: HomepageSektion HomepageSektion_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."HomepageSektion"
    ADD CONSTRAINT "HomepageSektion_pkey" PRIMARY KEY (id);


--
-- Name: Homepage Homepage_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Homepage"
    ADD CONSTRAINT "Homepage_pkey" PRIMARY KEY (id);


--
-- Name: Member Member_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);


--
-- Name: MessageReaction MessageReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_pkey" PRIMARY KEY (id);


--
-- Name: MessageRead MessageRead_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."MessageRead"
    ADD CONSTRAINT "MessageRead_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Mitfahrer Mitfahrer_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Mitfahrer"
    ADD CONSTRAINT "Mitfahrer_pkey" PRIMARY KEY (id);


--
-- Name: PinboardItem PinboardItem_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."PinboardItem"
    ADD CONSTRAINT "PinboardItem_pkey" PRIMARY KEY (id);


--
-- Name: Profilbild Profilbild_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Profilbild"
    ADD CONSTRAINT "Profilbild_pkey" PRIMARY KEY (id);


--
-- Name: Rechnung Rechnung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Rechnung"
    ADD CONSTRAINT "Rechnung_pkey" PRIMARY KEY (id);


--
-- Name: Reminder Reminder_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_pkey" PRIMARY KEY (id);


--
-- Name: RollenVorlage RollenVorlage_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."RollenVorlage"
    ADD CONSTRAINT "RollenVorlage_pkey" PRIMARY KEY (id);


--
-- Name: SchiedsrichterEinteilung SchiedsrichterEinteilung_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."SchiedsrichterEinteilung"
    ADD CONSTRAINT "SchiedsrichterEinteilung_pkey" PRIMARY KEY (id);


--
-- Name: SchnellAnmeldungToken SchnellAnmeldungToken_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."SchnellAnmeldungToken"
    ADD CONSTRAINT "SchnellAnmeldungToken_pkey" PRIMARY KEY (id);


--
-- Name: Sponsor Sponsor_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Sponsor"
    ADD CONSTRAINT "Sponsor_pkey" PRIMARY KEY (id);


--
-- Name: TeamMember TeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: TournamentMatch TournamentMatch_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TournamentMatch"
    ADD CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY (id);


--
-- Name: Tournament Tournament_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Tournament"
    ADD CONSTRAINT "Tournament_pkey" PRIMARY KEY (id);


--
-- Name: TurnierLandingpage TurnierLandingpage_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TurnierLandingpage"
    ADD CONSTRAINT "TurnierLandingpage_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Workflow Workflow_pkey; Type: CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Workflow"
    ADD CONSTRAINT "Workflow_pkey" PRIMARY KEY (id);


--
-- Name: Abteilung_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Abteilung_tenantId_idx" ON public."Abteilung" USING btree ("tenantId");


--
-- Name: Abteilung_tenantId_sport_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Abteilung_tenantId_sport_key" ON public."Abteilung" USING btree ("tenantId", sport);


--
-- Name: Attendance_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Attendance_eventId_idx" ON public."Attendance" USING btree ("eventId");


--
-- Name: Attendance_eventId_memberId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Attendance_eventId_memberId_key" ON public."Attendance" USING btree ("eventId", "memberId");


--
-- Name: Attendance_memberId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Attendance_memberId_idx" ON public."Attendance" USING btree ("memberId");


--
-- Name: Beitrag_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Beitrag_tenantId_idx" ON public."Beitrag" USING btree ("tenantId");


--
-- Name: BenachrichtigungsEinstellung_userId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "BenachrichtigungsEinstellung_userId_idx" ON public."BenachrichtigungsEinstellung" USING btree ("userId");


--
-- Name: BenachrichtigungsEinstellung_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "BenachrichtigungsEinstellung_userId_key" ON public."BenachrichtigungsEinstellung" USING btree ("userId");


--
-- Name: CustomSportart_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "CustomSportart_tenantId_idx" ON public."CustomSportart" USING btree ("tenantId");


--
-- Name: CustomSportart_tenantId_name_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "CustomSportart_tenantId_name_key" ON public."CustomSportart" USING btree ("tenantId", name);


--
-- Name: Dokument_kategorie_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Dokument_kategorie_idx" ON public."Dokument" USING btree (kategorie);


--
-- Name: Dokument_ordner_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Dokument_ordner_idx" ON public."Dokument" USING btree (ordner);


--
-- Name: Dokument_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Dokument_tenantId_idx" ON public."Dokument" USING btree ("tenantId");


--
-- Name: Einladung_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Einladung_tenantId_idx" ON public."Einladung" USING btree ("tenantId");


--
-- Name: Einladung_token_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Einladung_token_idx" ON public."Einladung" USING btree (token);


--
-- Name: Einladung_token_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Einladung_token_key" ON public."Einladung" USING btree (token);


--
-- Name: ElternFrage_status_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "ElternFrage_status_idx" ON public."ElternFrage" USING btree (status);


--
-- Name: ElternFrage_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "ElternFrage_teamId_idx" ON public."ElternFrage" USING btree ("teamId");


--
-- Name: ElternFrage_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "ElternFrage_tenantId_idx" ON public."ElternFrage" USING btree ("tenantId");


--
-- Name: EmailEinstellungen_userId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailEinstellungen_userId_idx" ON public."EmailEinstellungen" USING btree ("userId");


--
-- Name: EmailEinstellungen_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "EmailEinstellungen_userId_key" ON public."EmailEinstellungen" USING btree ("userId");


--
-- Name: EmailEntwurf_absenderId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailEntwurf_absenderId_idx" ON public."EmailEntwurf" USING btree ("absenderId");


--
-- Name: EmailEntwurf_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailEntwurf_tenantId_idx" ON public."EmailEntwurf" USING btree ("tenantId");


--
-- Name: EmailPosteingang_empfaengerId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailPosteingang_empfaengerId_idx" ON public."EmailPosteingang" USING btree ("empfaengerId");


--
-- Name: EmailPosteingang_empfangenAm_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailPosteingang_empfangenAm_idx" ON public."EmailPosteingang" USING btree ("empfangenAm");


--
-- Name: EmailPosteingang_ordner_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailPosteingang_ordner_idx" ON public."EmailPosteingang" USING btree (ordner);


--
-- Name: EmailPosteingang_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EmailPosteingang_tenantId_idx" ON public."EmailPosteingang" USING btree ("tenantId");


--
-- Name: EventComment_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EventComment_eventId_idx" ON public."EventComment" USING btree ("eventId");


--
-- Name: EventLandingpage_eventId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "EventLandingpage_eventId_key" ON public."EventLandingpage" USING btree ("eventId");


--
-- Name: EventLandingpage_slug_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "EventLandingpage_slug_idx" ON public."EventLandingpage" USING btree (slug);


--
-- Name: EventLandingpage_slug_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "EventLandingpage_slug_key" ON public."EventLandingpage" USING btree (slug);


--
-- Name: Event_date_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Event_date_idx" ON public."Event" USING btree (date);


--
-- Name: Event_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Event_teamId_idx" ON public."Event" USING btree ("teamId");


--
-- Name: Event_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Event_tenantId_idx" ON public."Event" USING btree ("tenantId");


--
-- Name: FAQ_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "FAQ_tenantId_idx" ON public."FAQ" USING btree ("tenantId");


--
-- Name: Fahrgemeinschaft_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Fahrgemeinschaft_eventId_idx" ON public."Fahrgemeinschaft" USING btree ("eventId");


--
-- Name: Fahrgemeinschaft_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Fahrgemeinschaft_tenantId_idx" ON public."Fahrgemeinschaft" USING btree ("tenantId");


--
-- Name: FormSubmission_status_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "FormSubmission_status_idx" ON public."FormSubmission" USING btree (status);


--
-- Name: FormSubmission_templateId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "FormSubmission_templateId_idx" ON public."FormSubmission" USING btree ("templateId");


--
-- Name: FormSubmission_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "FormSubmission_tenantId_idx" ON public."FormSubmission" USING btree ("tenantId");


--
-- Name: FormTemplate_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "FormTemplate_tenantId_idx" ON public."FormTemplate" USING btree ("tenantId");


--
-- Name: Halle_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Halle_tenantId_idx" ON public."Halle" USING btree ("tenantId");


--
-- Name: Hallenbelegung_halleId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Hallenbelegung_halleId_idx" ON public."Hallenbelegung" USING btree ("halleId");


--
-- Name: Hallenbelegung_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Hallenbelegung_teamId_idx" ON public."Hallenbelegung" USING btree ("teamId");


--
-- Name: HomepageSektion_homepageId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "HomepageSektion_homepageId_idx" ON public."HomepageSektion" USING btree ("homepageId");


--
-- Name: HomepageSektion_reihenfolge_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "HomepageSektion_reihenfolge_idx" ON public."HomepageSektion" USING btree (reihenfolge);


--
-- Name: Homepage_customDomain_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Homepage_customDomain_key" ON public."Homepage" USING btree ("customDomain");


--
-- Name: Homepage_subdomain_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Homepage_subdomain_idx" ON public."Homepage" USING btree (subdomain);


--
-- Name: Homepage_subdomain_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Homepage_subdomain_key" ON public."Homepage" USING btree (subdomain);


--
-- Name: Homepage_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Homepage_tenantId_idx" ON public."Homepage" USING btree ("tenantId");


--
-- Name: Homepage_tenantId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Homepage_tenantId_key" ON public."Homepage" USING btree ("tenantId");


--
-- Name: Member_email_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Member_email_idx" ON public."Member" USING btree (email);


--
-- Name: Member_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Member_tenantId_idx" ON public."Member" USING btree ("tenantId");


--
-- Name: Member_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Member_userId_key" ON public."Member" USING btree ("userId");


--
-- Name: MessageReaction_messageId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "MessageReaction_messageId_idx" ON public."MessageReaction" USING btree ("messageId");


--
-- Name: MessageReaction_messageId_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON public."MessageReaction" USING btree ("messageId", "userId");


--
-- Name: MessageRead_messageId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "MessageRead_messageId_idx" ON public."MessageRead" USING btree ("messageId");


--
-- Name: MessageRead_messageId_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON public."MessageRead" USING btree ("messageId", "userId");


--
-- Name: Message_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Message_teamId_idx" ON public."Message" USING btree ("teamId");


--
-- Name: Message_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Message_tenantId_idx" ON public."Message" USING btree ("tenantId");


--
-- Name: Mitfahrer_fahrgemeinschaftId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Mitfahrer_fahrgemeinschaftId_idx" ON public."Mitfahrer" USING btree ("fahrgemeinschaftId");


--
-- Name: Mitfahrer_fahrgemeinschaftId_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Mitfahrer_fahrgemeinschaftId_userId_key" ON public."Mitfahrer" USING btree ("fahrgemeinschaftId", "userId");


--
-- Name: PinboardItem_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "PinboardItem_teamId_idx" ON public."PinboardItem" USING btree ("teamId");


--
-- Name: PinboardItem_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "PinboardItem_tenantId_idx" ON public."PinboardItem" USING btree ("tenantId");


--
-- Name: Profilbild_userId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Profilbild_userId_idx" ON public."Profilbild" USING btree ("userId");


--
-- Name: Profilbild_userId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Profilbild_userId_key" ON public."Profilbild" USING btree ("userId");


--
-- Name: Rechnung_memberId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Rechnung_memberId_idx" ON public."Rechnung" USING btree ("memberId");


--
-- Name: Rechnung_status_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Rechnung_status_idx" ON public."Rechnung" USING btree (status);


--
-- Name: Rechnung_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Rechnung_tenantId_idx" ON public."Rechnung" USING btree ("tenantId");


--
-- Name: Reminder_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Reminder_eventId_idx" ON public."Reminder" USING btree ("eventId");


--
-- Name: Reminder_scheduledFor_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Reminder_scheduledFor_idx" ON public."Reminder" USING btree ("scheduledFor");


--
-- Name: RollenVorlage_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "RollenVorlage_tenantId_idx" ON public."RollenVorlage" USING btree ("tenantId");


--
-- Name: RollenVorlage_tenantId_name_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "RollenVorlage_tenantId_name_key" ON public."RollenVorlage" USING btree ("tenantId", name);


--
-- Name: SchiedsrichterEinteilung_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "SchiedsrichterEinteilung_eventId_idx" ON public."SchiedsrichterEinteilung" USING btree ("eventId");


--
-- Name: SchiedsrichterEinteilung_eventId_memberId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "SchiedsrichterEinteilung_eventId_memberId_key" ON public."SchiedsrichterEinteilung" USING btree ("eventId", "memberId");


--
-- Name: SchiedsrichterEinteilung_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "SchiedsrichterEinteilung_tenantId_idx" ON public."SchiedsrichterEinteilung" USING btree ("tenantId");


--
-- Name: SchnellAnmeldungToken_eventId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "SchnellAnmeldungToken_eventId_idx" ON public."SchnellAnmeldungToken" USING btree ("eventId");


--
-- Name: SchnellAnmeldungToken_token_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "SchnellAnmeldungToken_token_idx" ON public."SchnellAnmeldungToken" USING btree (token);


--
-- Name: SchnellAnmeldungToken_token_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "SchnellAnmeldungToken_token_key" ON public."SchnellAnmeldungToken" USING btree (token);


--
-- Name: Sponsor_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Sponsor_tenantId_idx" ON public."Sponsor" USING btree ("tenantId");


--
-- Name: TeamMember_memberId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "TeamMember_memberId_idx" ON public."TeamMember" USING btree ("memberId");


--
-- Name: TeamMember_teamId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "TeamMember_teamId_idx" ON public."TeamMember" USING btree ("teamId");


--
-- Name: TeamMember_teamId_memberId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "TeamMember_teamId_memberId_key" ON public."TeamMember" USING btree ("teamId", "memberId");


--
-- Name: Team_abteilungId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Team_abteilungId_idx" ON public."Team" USING btree ("abteilungId");


--
-- Name: Team_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Team_tenantId_idx" ON public."Team" USING btree ("tenantId");


--
-- Name: Tenant_slug_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Tenant_slug_idx" ON public."Tenant" USING btree (slug);


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: TournamentMatch_tournamentId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "TournamentMatch_tournamentId_idx" ON public."TournamentMatch" USING btree ("tournamentId");


--
-- Name: Tournament_publicUrl_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Tournament_publicUrl_idx" ON public."Tournament" USING btree ("publicUrl");


--
-- Name: Tournament_publicUrl_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "Tournament_publicUrl_key" ON public."Tournament" USING btree ("publicUrl");


--
-- Name: Tournament_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Tournament_tenantId_idx" ON public."Tournament" USING btree ("tenantId");


--
-- Name: TurnierLandingpage_slug_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "TurnierLandingpage_slug_idx" ON public."TurnierLandingpage" USING btree (slug);


--
-- Name: TurnierLandingpage_slug_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "TurnierLandingpage_slug_key" ON public."TurnierLandingpage" USING btree (slug);


--
-- Name: TurnierLandingpage_tournamentId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "TurnierLandingpage_tournamentId_key" ON public."TurnierLandingpage" USING btree ("tournamentId");


--
-- Name: User_emailVerifyToken_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON public."User" USING btree ("emailVerifyToken");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: User_passwortResetToken_key; Type: INDEX; Schema: public; Owner: clubos
--

CREATE UNIQUE INDEX "User_passwortResetToken_key" ON public."User" USING btree ("passwortResetToken");


--
-- Name: User_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "User_tenantId_idx" ON public."User" USING btree ("tenantId");


--
-- Name: Workflow_tenantId_idx; Type: INDEX; Schema: public; Owner: clubos
--

CREATE INDEX "Workflow_tenantId_idx" ON public."Workflow" USING btree ("tenantId");


--
-- Name: Abteilung Abteilung_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Abteilung"
    ADD CONSTRAINT "Abteilung_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomSportart CustomSportart_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."CustomSportart"
    ADD CONSTRAINT "CustomSportart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dokument Dokument_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Dokument"
    ADD CONSTRAINT "Dokument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmailEinstellungen EmailEinstellungen_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EmailEinstellungen"
    ADD CONSTRAINT "EmailEinstellungen_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventComment EventComment_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EventComment"
    ADD CONSTRAINT "EventComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventLandingpage EventLandingpage_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."EventLandingpage"
    ADD CONSTRAINT "EventLandingpage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FAQ FAQ_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FAQ"
    ADD CONSTRAINT "FAQ_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Fahrgemeinschaft Fahrgemeinschaft_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Fahrgemeinschaft"
    ADD CONSTRAINT "Fahrgemeinschaft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormSubmission FormSubmission_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."FormTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormSubmission FormSubmission_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormTemplate FormTemplate_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."FormTemplate"
    ADD CONSTRAINT "FormTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Halle Halle_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Halle"
    ADD CONSTRAINT "Halle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Hallenbelegung Hallenbelegung_halleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Hallenbelegung"
    ADD CONSTRAINT "Hallenbelegung_halleId_fkey" FOREIGN KEY ("halleId") REFERENCES public."Halle"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Hallenbelegung Hallenbelegung_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Hallenbelegung"
    ADD CONSTRAINT "Hallenbelegung_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HomepageSektion HomepageSektion_homepageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."HomepageSektion"
    ADD CONSTRAINT "HomepageSektion_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES public."Homepage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Homepage Homepage_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Homepage"
    ADD CONSTRAINT "Homepage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Member Member_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Member Member_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageReaction MessageReaction_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageRead MessageRead_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."MessageRead"
    ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mitfahrer Mitfahrer_fahrgemeinschaftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Mitfahrer"
    ADD CONSTRAINT "Mitfahrer_fahrgemeinschaftId_fkey" FOREIGN KEY ("fahrgemeinschaftId") REFERENCES public."Fahrgemeinschaft"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PinboardItem PinboardItem_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."PinboardItem"
    ADD CONSTRAINT "PinboardItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PinboardItem PinboardItem_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."PinboardItem"
    ADD CONSTRAINT "PinboardItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reminder Reminder_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RollenVorlage RollenVorlage_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."RollenVorlage"
    ADD CONSTRAINT "RollenVorlage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchnellAnmeldungToken SchnellAnmeldungToken_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."SchnellAnmeldungToken"
    ADD CONSTRAINT "SchnellAnmeldungToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sponsor Sponsor_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Sponsor"
    ADD CONSTRAINT "Sponsor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Team Team_abteilungId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_abteilungId_fkey" FOREIGN KEY ("abteilungId") REFERENCES public."Abteilung"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Team Team_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TournamentMatch TournamentMatch_tournamentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TournamentMatch"
    ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES public."Tournament"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tournament Tournament_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Tournament"
    ADD CONSTRAINT "Tournament_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TurnierLandingpage TurnierLandingpage_tournamentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."TurnierLandingpage"
    ADD CONSTRAINT "TurnierLandingpage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES public."Tournament"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Workflow Workflow_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clubos
--

ALTER TABLE ONLY public."Workflow"
    ADD CONSTRAINT "Workflow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: clubos
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict kcXsmpdB4ZrPVdcAjtgnZ9LgUs43Di7EbWBRFmY2CJ7VSltbfLLnlR90bKjthiL

