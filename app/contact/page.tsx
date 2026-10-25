import React from 'react';
import type { Metadata } from 'next';
import { getSettings, getSiteContent } from '@/lib/db';
import { Mail, Phone, MapPin, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import ContactForm from '@/components/site/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Atelier · Direct Dialogue',
  description: 'Connect with CVI Architects in Baghdad, Iraq. Commission a masterplan, inquire about architectural and structural design services.',
};

export default function ContactPage() {
  const settings = getSettings();
  const content = getSiteContent();

  return (
    <div className="w-full pt-32 pb-24 text-white max-w-[112.5rem] mx-auto px-6 sm:px-12">
      {/* Header */}
      <header className="max-w-4xl mb-16 sm:mb-24">
        <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-4">
          {content.contactEyebrow}
        </div>
        <h1 className="hero-title font-display text-white mb-6">
          {content.contactTitle}
        </h1>
        <p className="editorial-body text-white/82 max-w-2xl font-normal">
          {content.contactIntro}
        </p>
      </header>

      {/* Grid: Details Left, Interactive Form Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Coordinates & Information */}
        <div data-reveal className="lg:col-span-5 flex flex-col gap-10 font-mono text-xs">
          {/* Physical Address */}
          <div className="border border-white/10 p-8 rounded-sm bg-white/[0.01]">
            <div className="flex items-center gap-3 text-skyblue mb-3">
              <MapPin className="w-4 h-4" />
              <span className="tracking-widest uppercase">PHYSICAL ATELIER</span>
            </div>
            <div className="text-base font-display text-white mb-2">
              {settings.companyName}
            </div>
            <p className="text-white/82 text-sm font-normal leading-relaxed mb-4">
              {settings.addressLine1}
              <br />
              {settings.addressLine2}
            </p>
            <div className="text-[13px] text-white/62 tracking-wider">
              COORDINATES: {settings.latitude}° N, {settings.longitude}° E
            </div>
          </div>

          {/* Direct Comms */}
          <div className="border border-white/10 p-8 rounded-sm bg-white/[0.01]">
            <div className="flex items-center gap-3 text-skyblue mb-3">
              <Phone className="w-4 h-4" />
              <span className="tracking-widest uppercase">DIRECT CHANNELS</span>
            </div>
            <div className="flex flex-col gap-4 text-sm font-sans">
              <div>
                <span className="text-white/62 block text-xs font-mono mb-1">TELEPHONE / WHATSAPP</span>
                <a
                  href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                  className="text-white hover:text-skyblue transition-colors font-mono text-base"
                >
                  {settings.phone}
                </a>
              </div>
              <div>
                <span className="text-white/62 block text-xs font-mono mb-1">ELECTRONIC MAIL</span>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-white hover:text-skyblue transition-colors font-mono text-base"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {/* Social Channels */}
          <div className="border border-white/10 p-8 rounded-sm bg-white/[0.01]">
            <div className="text-skyblue tracking-widest uppercase mb-4">
              STUDIO NETWORK
            </div>
            <div className="flex flex-col gap-3 font-sans text-sm">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-white/88 hover:text-white group border-b border-white/5 pb-2"
              >
                <span>Instagram (@cvi.arch)</span>
                <ArrowUpRight className="w-4 h-4 text-white/62 group-hover:text-skyblue transition-colors" />
              </a>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-white/88 hover:text-white group border-b border-white/5 pb-2"
              >
                <span>Facebook (CVI Architects)</span>
                <ArrowUpRight className="w-4 h-4 text-white/62 group-hover:text-skyblue transition-colors" />
              </a>
              <a
                href={settings.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-white/88 hover:text-white group border-b border-white/5 pb-2"
              >
                <span>X / Twitter (@CVIarch)</span>
                <ArrowUpRight className="w-4 h-4 text-white/62 group-hover:text-skyblue transition-colors" />
              </a>
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-white/88 hover:text-white group"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-4 h-4 text-white/62 group-hover:text-skyblue transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Google Maps & Interactive Inquiry Form */}
        <div data-reveal className="lg:col-span-7 flex flex-col gap-10">
          {/* Embedded Baghdad Location Map */}
          <div className="w-full aspect-[16/9] rounded-sm overflow-hidden border border-white/10 bg-neutral-900 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3335.081029954734!2d44.38981397626804!3d33.2905430575646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15577f004307ba7f%3A0x73fb413252d01ac6!2sCVI%20Architects!5e0!3m2!1sen!2siq!4v1751286419858!5m2!1sen!2siq"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CVI Architects Location"
            />
          </div>

          {/* Inquiry Form */}
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
