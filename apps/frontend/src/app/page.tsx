'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Users,
  Calendar,
  Trophy,
  MessageCircle,
  CreditCard,
  ClipboardList,
  ShoppingBag,
  Settings,
  Shield,
  Server,
  Lock,
  Code,
  Menu,
  Check,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Heart,
  Target,
  BarChart3,
  Gamepad2,
  PartyPopper,
  FileText,
  Brain,
  Stethoscope,
  Smartphone,
  ChevronRight,
  Mail,
} from 'lucide-react';

/* ============================================================
   Vereinbase – Öffentliche Marketing-Landingpage
   ============================================================ */

// --------------- Daten ---------------

const featureSections = [
  {
    title: 'Mitgliederverwaltung',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    features: [
      'Digitale Mitgliedsanträge + QR-Ausweis',
      'Familien-Verknüpfung (ein Login für alle Kinder)',
      'Selbstverwaltungs-Portal',
      'DSGVO-Export auf Knopfdruck',
    ],
  },
  {
    title: 'Kalender & Events',
    icon: Calendar,
    color: 'from-emerald-500 to-emerald-600',
    features: [
      'Trainings, Spiele, Turniere planen',
      'An-/Abmeldung mit Pflichtgrund',
      'QR-Code Check-In (papierlos)',
      'Automatische Erinnerungen (24h + 2h)',
      'Wetter-Vorhersage im Kalender',
      'iCal-Abo (Google, Apple, Outlook)',
    ],
  },
  {
    title: 'Turnier-Manager',
    icon: Trophy,
    color: 'from-amber-500 to-amber-600',
    features: [
      'Spielplan erstellen (Gruppe, KO, Schweizer)',
      'Live-Scoring mit Public-URL',
      'QR-Code für Zuschauer',
      'Öffentliche Turnier-Seite',
    ],
  },
  {
    title: 'Kommunikation',
    icon: MessageCircle,
    color: 'from-violet-500 to-violet-600',
    features: [
      'Nachrichten (WhatsApp-Ersatz)',
      'Eltern-Umfragen (Doodle-Ersatz)',
      'Digitales Schwarzes Brett',
      'Push-Notifications',
      'Notfall-Broadcast',
      'Stille-Stunden (22–07 Uhr)',
    ],
  },
  {
    title: 'Finanzen',
    icon: CreditCard,
    color: 'from-green-500 to-green-600',
    features: [
      'Beitragsverwaltung + SEPA',
      'Mannschaftskasse + Strafenkatalog',
      'Buchhaltung + DATEV-Export',
      'Sponsoren-Verwaltung',
    ],
  },
  {
    title: 'Trainer-Tools',
    icon: ClipboardList,
    color: 'from-rose-500 to-rose-600',
    features: [
      'KI-Trainingsplan-Generator',
      'Aufstellungsplaner (Drag & Drop)',
      'Spielberichte mit KI-Text',
      'Anwesenheitsstatistik (Heatmap)',
      'Spieler-Entwicklungsbögen',
    ],
  },
  {
    title: 'Vereins-Marktplatz',
    icon: ShoppingBag,
    color: 'from-orange-500 to-orange-600',
    features: [
      'Sportgeräte kaufen/verkaufen',
      'Trainer-Vertretung finden',
      'Freundschaftsspiele organisieren',
      'PLZ-basierte Suche',
    ],
  },
  {
    title: 'Verwaltung',
    icon: Settings,
    color: 'from-slate-500 to-slate-600',
    features: [
      'Vereinshomepage-Editor (Drag & Drop)',
      'Event-Landingpages für Werbung',
      'Rollen & Berechtigungen',
      'DFBnet Import/Export',
      'Wartelisten-Management',
    ],
  },
];

const comingSoon = [
  { title: 'Ehrenamt-Modul', icon: Heart },
  { title: 'Vereinsfest-Planer', icon: PartyPopper },
  { title: 'Fördermittel-Jahresbericht (PDF)', icon: FileText },
  { title: 'KI-Mitgliederbindung', icon: Brain },
  { title: 'Vereins-Gesundheitscheck', icon: Stethoscope },
  { title: 'Mobile App (iOS + Android)', icon: Smartphone },
];

// Preise werden noch definiert - Platzhalter

const trustBadges = [
  { icon: Shield, label: 'DSGVO-konform' },
  { icon: Server, label: 'Server in Deutschland' },
  { icon: Lock, label: 'Ende-zu-Ende verschlüsselt' },
  { icon: Code, label: 'Transparente Technik' },
];

const navLinks = [
  { label: 'Funktionen', href: '#funktionen' },
  { label: 'Preise', href: '#preise' },
  { label: 'Sicherheit', href: '#vertrauen' },
];

// --------------- Komponente ---------------

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===================== NAVIGATION ===================== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Vereinbase
          </Link>

          {/* Desktop-Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link href="/anmelden">
              <Button variant="outline" size="sm">
                Anmelden
              </Button>
            </Link>
            <Link href="/registrieren">
              <Button size="sm">Kostenlos testen</Button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="mt-8 flex flex-col gap-4">
                  <span className="text-lg font-bold text-primary">Vereinbase</span>
                  {navLinks.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ))}
                  <hr className="my-2" />
                  <Link href="/anmelden" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Anmelden
                    </Button>
                  </Link>
                  <Link href="/registrieren" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Kostenlos testen</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Dezente Hintergrund-Kreise */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Sparkles className="mr-1 h-3 w-3" /> Jetzt verfügbar
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Die All-in-One Plattform
              <br />
              für Sportvereine
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
              Ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein und 6 weitere Apps
              — DSGVO-konform, deutscher Server, ein Preis.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registrieren">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 shadow-lg hover:bg-blue-50"
                >
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#funktionen">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Funktionen ansehen
                </Button>
              </a>
            </div>

            <p className="mt-10 text-sm text-blue-200">
              14 Tage kostenlos testen — keine Kreditkarte nötig
            </p>
          </div>
        </div>
      </section>

      {/* ===================== SOCIAL PROOF BAR ===================== */}
      <section className="border-b bg-muted/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span>Bereits von Vereinen in ganz Deutschland genutzt</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>60+ Funktionen in einer Plattform</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>100 % DSGVO-konform</span>
          </div>
        </div>
      </section>

      {/* ===================== FEATURE GRID ===================== */}
      <section id="funktionen" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Funktionen
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Alles, was euer Verein braucht
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Von der Mitgliederverwaltung bis zum Turnier-Manager — eine Plattform
              statt zehn verschiedene Apps.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featureSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${section.color} p-2.5 text-white`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== KOMMT BALD ===================== */}
      <section className="border-y bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Roadmap
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Kommt bald
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Wir arbeiten ständig an neuen Funktionen für eure Vereine.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4"
                >
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge
                    variant="outline"
                    className="ml-auto shrink-0 text-[10px]"
                  >
                    Bald
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="preise" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Preise
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Faire Preise für jeden Verein
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Wir arbeiten gerade an unseren Preispaketen.
              Starten Sie jetzt kostenlos und testen Sie alle Funktionen 14 Tage lang.
            </p>
            <div className="mt-8">
              <Link href="/registrieren">
                <Button size="lg" className="text-lg px-8 py-6">
                  Jetzt kostenlos testen
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Keine Kreditkarte nötig. Keine Verpflichtung.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== TRUST / SICHERHEIT ===================== */}
      <section id="vertrauen" className="border-y bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Sicherheit & Datenschutz
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Eure Daten in guten Händen
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Made in Germany — für deutsche Vereine, auf deutschen Servern.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
                >
                  <div className="rounded-full bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bereit für den digitalen Verein?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Startet jetzt kostenlos und erlebt, wie einfach Vereinsarbeit sein kann.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registrieren">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 shadow-lg hover:bg-blue-50"
                >
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:support@vereinbase.de">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Demo vereinbaren
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              Oder vereinbart eine persönliche Demo — wir zeigen euch alles in 15 Minuten.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <span className="text-lg font-bold text-primary">Vereinbase</span>
              <p className="mt-1 text-sm text-muted-foreground">
                Vereinbase UG (haftungsbeschränkt) — Jaeger Holding UG
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/impressum" className="hover:text-foreground">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-foreground">
                Datenschutz
              </Link>
              <Link href="/agb" className="hover:text-foreground">
                AGB
              </Link>
              <a
                href="mailto:support@vereinbase.de"
                className="hover:text-foreground"
              >
                support@vereinbase.de
              </a>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vereinbase. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
