import type { Metadata } from 'next';
import { Golos_Text, IBM_Plex_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Наличка — стена с деньгами',
  description:
    'Учёт личных финансов, где деньги — это купюры на стене. Раскладывай зарплату по ячейкам, вытаскивай купюры на траты и смотри, как худеет пачка.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${golos.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
