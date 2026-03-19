'use client';

interface PublicFooterProps {
  vereinsname: string;
  primaryColor: string;
  footerText?: string | null;
  impressum?: string | null;
  datenschutz?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialYoutube?: string | null;
}

export function PublicFooter({
  vereinsname,
  primaryColor,
  footerText,
  impressum,
  datenschutz,
  socialFacebook,
  socialInstagram,
  socialYoutube,
}: PublicFooterProps) {
  const hatSocial = socialFacebook || socialInstagram || socialYoutube;

  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Vereinsname + Footer-Text */}
          <div>
            <h3 className="mb-2 text-lg font-bold">{vereinsname}</h3>
            {footerText && (
              <p className="text-sm text-gray-400">{footerText}</p>
            )}
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Rechtliches
            </h4>
            <ul className="space-y-1 text-sm text-gray-300">
              {impressum && (
                <li>
                  <button
                    onClick={() => {
                      /* Impressum-Modal */
                    }}
                    className="hover:text-white"
                  >
                    Impressum
                  </button>
                </li>
              )}
              {datenschutz && (
                <li>
                  <button
                    onClick={() => {
                      /* Datenschutz-Modal */
                    }}
                    className="hover:text-white"
                  >
                    Datenschutz
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Social Media */}
          {hatSocial && (
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Folgen Sie uns
              </h4>
              <div className="flex gap-4">
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors hover:text-white"
                    aria-label="Facebook"
                  >
                    Facebook
                  </a>
                )}
                {socialInstagram && (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors hover:text-white"
                    aria-label="Instagram"
                  >
                    Instagram
                  </a>
                )}
                {socialYoutube && (
                  <a
                    href={socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors hover:text-white"
                    aria-label="YouTube"
                  >
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {vereinsname}. Alle Rechte
          vorbehalten. Bereitgestellt von{' '}
          <a
            href="https://vereinbase.de"
            className="hover:text-white"
            style={{ color: primaryColor }}
          >
            Vereinbase
          </a>
        </div>
      </div>
    </footer>
  );
}
