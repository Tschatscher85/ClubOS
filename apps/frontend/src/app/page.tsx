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
  Smartphone,
  Mail,
  BookOpen,
  Receipt,
} from 'lucide-react';

/* ============================================================
   Vereinbase – Öffentliche Marketing-Landingpage
   Farbschema: Anthrazit, Gold, Silber
   ============================================================ */

// --------------- Daten ---------------

const featureSections = [
  {
    title: 'Mitgliederverwaltung',
    icon: Users,
    features: [
      'Digitale Mitgliedsanträge + QR-Ausweis',
      'Familien-Verknüpfung (ein Login für alle Kinder)',
      'Papieranträge scannen & zuordnen',
      'Foto-/Fahrgemeinschaft-Einverständnis',
      'Selbstverwaltungs-Portal',
      'DSGVO-Export auf Knopfdruck',
    ],
  },
  {
    title: 'Kalender & Events',
    icon: Calendar,
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
    features: [
      'Nachrichten (WhatsApp-Ersatz)',
      'Eltern-Umfragen (Doodle-Ersatz)',
      'Digitales Schwarzes Brett',
      'Push-Notifications + Notfall-Broadcast',
      'Stille-Stunden (22–07 Uhr)',
    ],
  },
  {
    title: 'Finanzen & Sponsoren',
    icon: CreditCard,
    features: [
      'Beitragsverwaltung + SEPA',
      'Mannschaftskasse + Strafenkatalog',
      'Buchhaltung + DATEV-Export',
      'Sponsoren-Verwaltung + Crowdfunding',
    ],
  },
  {
    title: 'Trainer-Tools & KI',
    icon: ClipboardList,
    features: [
      'KI-Trainingsplan-Generator',
      'Aufstellungsplaner (Drag & Drop)',
      'Spielberichte mit KI-Text',
      'Saisonplanung (visuelle Timeline)',
      'Anwesenheitsstatistik (Heatmap)',
      'Spieler-Entwicklungsbögen',
    ],
  },
  {
    title: 'Ehrenamt & Vereinsleben',
    icon: Heart,
    features: [
      'Ehrenamt-Modul (Helfer-Aufgaben)',
      'Vereinsfest-Planer (Schichten, Einkauf, Kasse)',
      'Übungsleiter-Stunden (3.300 EUR Warnung)',
      'Foto-Galerie pro Team (DSGVO-geschützt)',
    ],
  },
  {
    title: 'Verwaltung & Wissen',
    icon: BookOpen,
    features: [
      'Vereins-Wiki (Wissensmanagement)',
      'Vereinshomepage-Editor (Drag & Drop)',
      'DFBnet Import/Export',
      'Fördermittel-Jahresbericht (PDF)',
      'Vereins-Gesundheitscheck',
      'Trainer-Lizenz-Tracker',
    ],
  },
];

const comingSoon = [
  { title: 'Mobile App (iOS + Android)', icon: Smartphone },
  { title: 'E-Rechnung (ZUGFeRD)', icon: Receipt },
];

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
    <div className="min-h-screen bg-[#1a1a1f] text-gray-100">
      {/* ===================== NAVIGATION ===================== */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a1f]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-amber-400">
            Vereinbase
          </Link>

          {/* Desktop-Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link href="/anmelden">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Anmelden
              </Button>
            </Link>
            <Link href="/registrieren">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500"
              >
                Kostenlos testen
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-[#1a1a1f] border-white/10">
                <div className="mt-8 flex flex-col gap-4">
                  <span className="text-lg font-bold text-amber-400">Vereinbase</span>
                  {navLinks.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-gray-400 hover:text-white"
                    >
                      {l.label}
                    </a>
                  ))}
                  <hr className="my-2 border-white/10" />
                  <Link href="/anmelden" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 bg-transparent text-gray-300 hover:bg-white/10"
                    >
                      Anmelden
                    </Button>
                  </Link>
                  <Link href="/registrieren" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold">
                      Kostenlos testen
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1f] via-[#252530] to-[#1a1a1f]">
        {/* Dezente Gold-Akzente */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-500/5" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-amber-500/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
              <Sparkles className="mr-1 h-3 w-3" /> Jetzt verfügbar
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-white">Die All-in-One Plattform</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                für Sportvereine
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
              Ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein und 6 weitere Apps
              — DSGVO-konform, deutscher Server, ein Preis.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registrieren">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500"
                >
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#funktionen">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-600 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  Funktionen ansehen
                </Button>
              </a>
            </div>

            <p className="mt-10 text-sm text-gray-500">
              14 Tage kostenlos testen — keine Kreditkarte nötig
            </p>
          </div>
        </div>
      </section>

      {/* ===================== SOCIAL PROOF BAR ===================== */}
      <section className="border-y border-white/5 bg-[#16161b] py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-gray-500 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span>Bereits von Vereinen in ganz Deutschland genutzt</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>100+ Funktionen in einer Plattform</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>100 % DSGVO-konform</span>
          </div>
        </div>
      </section>

      {/* ===================== FEATURE GRID ===================== */}
      <section id="funktionen" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 border-gray-700 bg-gray-800 text-gray-300">
              Funktionen
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Alles, was euer Verein braucht
            </h2>
            <p className="mt-4 text-lg text-gray-400">
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
                  className="group rounded-xl border border-white/10 bg-[#22222a] p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-2.5 text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
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
      <section className="border-y border-white/5 bg-[#16161b] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 border-gray-700 bg-gray-800 text-gray-300">
              Roadmap
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Kommt bald
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Wir arbeiten ständig an neuen Funktionen für eure Vereine.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#22222a] p-4"
                >
                  <div className="rounded-md bg-gray-800 p-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{item.title}</span>
                  <Badge
                    className="ml-auto shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]"
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
            <Badge className="mb-4 border-gray-700 bg-gray-800 text-gray-300">
              Preise
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Faire Preise für jeden Verein
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Wir arbeiten gerade an unseren Preispaketen.
              Starten Sie jetzt kostenlos und testen Sie alle Funktionen 14 Tage lang.
            </p>
            <div className="mt-8">
              <Link href="/registrieren">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-lg px-8 py-6 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500"
                >
                  Jetzt kostenlos testen
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Keine Kreditkarte nötig. Keine Verpflichtung.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== TRUST / SICHERHEIT ===================== */}
      <section id="vertrauen" className="border-y border-white/5 bg-[#16161b] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 border-gray-700 bg-gray-800 text-gray-300">
              Sicherheit & Datenschutz
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Eure Daten in guten Händen
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Made in Germany — für deutsche Vereine, auf deutschen Servern.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#22222a] p-6 text-center"
                >
                  <div className="rounded-full bg-amber-500/10 p-3">
                    <Icon className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-300">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bereit für den digitalen Verein?
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Startet jetzt kostenlos und erlebt, wie einfach Vereinsarbeit sein kann.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registrieren">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500"
                >
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:info@vereinbase.de">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-600 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Demo vereinbaren
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Oder vereinbart eine persönliche Demo — wir zeigen euch alles in 15 Minuten.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-white/10 bg-[#12121a] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <span className="text-lg font-bold text-amber-400">Vereinbase</span>
              <p className="mt-1 text-sm text-gray-500">
                Vereinbase UG (haftungsbeschränkt)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <Link href="/impressum" className="hover:text-gray-300 transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-gray-300 transition-colors">
                Datenschutz
              </Link>
              <Link href="/agb" className="hover:text-gray-300 transition-colors">
                AGB
              </Link>
              <Link href="/avv" className="hover:text-gray-300 transition-colors">
                AVV
              </Link>
              <a
                href="mailto:info@vereinbase.de"
                className="hover:text-gray-300 transition-colors"
              >
                info@vereinbase.de
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Vereinbase. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
