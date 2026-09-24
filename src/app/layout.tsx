import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Les douceurs&Didine — savons parfumés et vitrines faites main',
    template: '%s · Les douceurs&Didine',
  },
  description:
    'Savons parfumés faits main sur base au beurre de karité bio sans SLS, et vitrines personnalisées à offrir. Petites séries.',
  applicationName: 'Les douceurs&Didine',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Didine',
    statusBarStyle: 'default',
  },
  // Tant que la boutique n'est pas réellement ouverte, on ne veut pas être
  // référencé : une vitrine incomplète qui remonte sous le nom de la marque
  // fait plus de mal que pas de référencement du tout.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12100f',
};

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {/* Premier élément focusable de la page : un lecteur au clavier ne
            doit pas avoir à traverser toute la navigation à chaque page. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-onyx focus:px-4 focus:py-2 focus:text-nuage"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
