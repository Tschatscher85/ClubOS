import Link from 'next/link';

export default function VereinsHomepageNichtGefunden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-extrabold text-gray-900">404</h1>
        <h2 className="mb-2 text-2xl font-bold text-gray-700">
          Verein nicht gefunden
        </h2>
        <p className="mb-8 text-gray-500">
          Die angeforderte Vereinsseite existiert nicht oder ist nicht aktiv.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
