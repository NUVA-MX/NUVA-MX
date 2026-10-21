import '@/styles/tokens.css';
import '@/styles/base.css';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { site } from '@/content/site';
import { siteUrl } from '@/server/env';

const darkerGrotesque = localFont({
  src: '../../public/fonts/DarkerGrotesque-VariableFont_wght.ttf',
  weight: '300 900',
  variable: '--font-darker-grotesque',
  display: 'swap',
});

const acumin = localFont({
  src: '../../public/fonts/Acumin-Variable-Concept.ttf',
  weight: '100 900',
  variable: '--font-acumin',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: siteUrl() ? new URL(siteUrl() as string) : undefined,
  title: site.brand,
  description: site.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth" className={`${darkerGrotesque.variable} ${acumin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
