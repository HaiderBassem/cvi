import type { Metadata, Viewport } from 'next';
import { Manrope, Cormorant_Garamond, Caveat } from 'next/font/google';
import '@/styles/globals.css';
import { SiteChrome } from '@/components/site/SiteChrome';
import { getSettings } from '@/lib/db';
import { getChromeData } from '@/lib/site/chrome';

// Manrope: a clean, open sans that stays legible at small sizes (body, labels, controls).
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Cormorant Garamond: a high-contrast editorial serif for headlines and numerals.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

// Caveat: the handwritten margin notes on the intro sheet.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-hand',
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
  const chrome = getChromeData();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorant.variable} ${caveat.variable} dark`}
    >
      <body className="text-[#f4f4f6] selection:bg-[#4cb8f5] selection:text-black">
        <SiteChrome chrome={chrome}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
