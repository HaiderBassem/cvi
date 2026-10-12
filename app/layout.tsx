import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono, Syne } from 'next/font/google';
import '@/styles/globals.css';
import { SiteChrome } from '@/components/site/SiteChrome';
import { getSettings } from '@/lib/db';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    title: {
      default: `${settings.companyName} · Baghdad · International Architectural Practice`,
      template: `%s · ${settings.companyName}`,
    },
    description: settings.defaultSeoDescription,
    keywords: [
      'CVI Architects',
      'CVI ARCH',
      'Baghdad Architecture',
      'Iraq Modern Architecture',
      'BIM Iraq',
      'Sustainable Urbanism Baghdad',
      'Architectural Visualization',
      'Al-Jadriya Architects',
    ],
    authors: [{ name: settings.companyName, url: 'https://cvi-arch.com' }],
    metadataBase: new URL('https://cvi-arch.com'),
    openGraph: {
      title: `${settings.companyName} · Architectural Tectonics & Urban Vision`,
      description: settings.defaultSeoDescription,
      url: 'https://cvi-arch.com',
      siteName: settings.companyName,
      images: [
        {
          url: settings.defaultOgImage,
          width: 1600,
          height: 888,
          alt: `${settings.companyName} Baghdad Headquarters`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.companyName,
      description: settings.defaultSeoDescription,
      images: [settings.defaultOgImage],
    },
    icons: {
      icon: '/cvi-arch-logo.svg',
      apple: '/cvi-arch-logo.svg',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSettings();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${syne.variable} dark`}
    >
      <body className="bg-[#0a0a0c] text-[#f4f4f6] selection:bg-[#4cb8f5] selection:text-black">
        <SiteChrome companyName={settings.companyName} coordinates={`${settings.latitude}° N, ${settings.longitude}° E`}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
