import { getNavigationItems, getSettings, getSiteContent } from '@/lib/db';

/**
 * Everything the site-wide chrome (top bar, phone menu, footer, opening screen) shows, gathered
 * from the admin-edited content, menu and settings in one place so every page renders the same.
 */
export interface SiteChromeData {
  companyName: string;
  brandSubtitle: string;
  nav: { label: string; href: string; hint: string; external: boolean }[];
  cta: { label: string; href: string };
  contact: {
    addressLines: string[];
    email: string;
    phone: string;
    socials: { label: string; href: string }[];
  };
  loader: { text: string; image: string };
  labels: { menuOpen: string; menuClose: string; studioHeading: string; contactHeading: string; followHeading: string };
  footer: { blurb: string; menuTitle: string; studioTitle: string; backToTop: string; copyright: string };
}

export function getChromeData(): SiteChromeData {
  const settings = getSettings();
  const content = getSiteContent();
  const nav = getNavigationItems(true).map((n) => ({
    label: n.label,
    href: n.href,
    hint: n.hint ?? '',
    external: n.is_external === 1 || /^https?:\/\//.test(n.href),
  }));

  const socials = [
    { label: 'Instagram', href: settings.instagramUrl },
    { label: 'Facebook', href: settings.facebookUrl },
    { label: 'X / Twitter', href: settings.twitterUrl },
    { label: 'LinkedIn', href: settings.linkedinUrl },
  ].filter((s) => /^https?:\/\//.test(s.href || ''));

  return {
    companyName: settings.companyName,
    brandSubtitle: content.brandSubtitle,
    nav,
    cta: { label: content.navCtaLabel, href: content.navCtaHref },
    contact: {
      addressLines: [settings.addressLine1, settings.addressLine2].filter(Boolean),
      email: settings.email,
      phone: settings.phone,
      socials,
    },
    loader: { text: content.loaderText, image: content.loaderImage },
    labels: {
      menuOpen: content.menuOpenLabel,
      menuClose: content.menuCloseLabel,
      studioHeading: content.menuStudioHeading,
      contactHeading: content.menuContactHeading,
      followHeading: content.menuFollowHeading,
    },
    footer: {
      blurb: content.footerBlurb,
      menuTitle: content.footerMenuTitle,
      studioTitle: content.footerStudioTitle,
      backToTop: content.footerBackToTop,
      copyright: settings.copyrightText,
    },
  };
}
