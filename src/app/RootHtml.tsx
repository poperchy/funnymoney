import type { Metadata } from 'next';
import { Golos_Text, IBM_Plex_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { dictionaries, type Locale } from '@/lib/i18n';
import './globals.css';

const golos = Golos_Text({
  variable: '--font-golos',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
});

/** Set in CI. Without it (locally) there is no address to point hreflang at, and nothing needs one. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export function rootMetadata(lang: Locale): Metadata {
  const { meta } = dictionaries[lang];
  return {
    title: meta.title,
    description: meta.description,
    ...(SITE_URL && {
      metadataBase: new URL(SITE_URL),
      alternates: { canonical: `${SITE_URL}${lang === 'en' ? '/en/' : '/'}`, languages: { ru: `${SITE_URL}/`, en: `${SITE_URL}/en/`, 'x-default': `${SITE_URL}/` } },
    }),
  };
}

/** Each language has its own root layout, because `<html lang>` has to be right in the static file. */
export function RootHtml({ lang, children }: { lang: Locale; children: ReactNode }) {
  return (
    <html lang={lang} className={`${golos.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
