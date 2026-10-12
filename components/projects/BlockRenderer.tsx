import React from 'react';
import Image from 'next/image';
import type { ProjectBlockRecord } from '@/lib/db/types';
import { BeforeAfterSlider } from './blocks/BeforeAfterSlider';
import ArchitecturalPlanViewer from './blocks/ArchitecturalPlanViewer';

interface BlockRendererProps {
  blocks: ProjectBlockRecord[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="flex flex-col w-full">
      {blocks.map((block) => {
        let content: Record<string, any> = {};
        try {
          content = typeof block.content_json === 'string' ? JSON.parse(block.content_json) : block.content_json;
        } catch {
          content = {};
        }

        switch (block.block_type) {
          case 'text':
            return (
              <section key={block.id} className="max-w-4xl mx-auto px-6 py-8 sm:py-12 w-full">
                {content.leadParagraph && (
                  <p className="editorial-body text-white/90 leading-relaxed font-light mb-6">
                    {content.leadParagraph}
                  </p>
                )}
                {content.body && (
                  <div className="text-base text-white/70 leading-relaxed font-normal whitespace-pre-line">
                    {content.body}
                  </div>
                )}
              </section>
            );

          case 'heading':
            return (
              <div key={block.id} className="max-w-6xl mx-auto px-6 pt-16 pb-6 w-full border-t border-white/10 mt-12">
                {content.eyebrow && (
                  <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-2">
                    {content.eyebrow}
                  </div>
                )}
                <h3 className="section-title text-white font-display">
                  {content.title || content.heading}
                </h3>
                {content.subtitle && (
                  <p className="text-white/60 text-lg font-light mt-2 max-w-2xl">
                    {content.subtitle}
                  </p>
                )}
              </div>
            );

          case 'full_bleed_image':
            return (
              <div key={block.id} className="w-full my-12 sm:my-20">
                <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-neutral-900">
                  <Image
                    src={content.url}
                    alt={content.caption || 'Architectural Perspective'}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={false}
                  />
                </div>
                {content.caption && (
                  <div className="max-w-6xl mx-auto px-6 mt-3 text-right font-mono text-[11px] text-white/40 tracking-wider">
                    {content.caption}
                  </div>
                )}
              </div>
            );

          case 'image':
            return (
              <div key={block.id} className="max-w-5xl mx-auto px-6 my-10 w-full">
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-sm bg-neutral-900 border border-white/10">
                  <Image
                    src={content.url}
                    alt={content.caption || 'Project Perspective'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                  />
                </div>
                {content.caption && (
                  <div className="mt-2 text-left font-mono text-[11px] text-white/50 tracking-wider">
                    {content.caption}
                  </div>
                )}
              </div>
            );

          case 'two_column':
            return (
              <section key={block.id} className="max-w-6xl mx-auto px-6 py-12 sm:py-20 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className={content.mediaPosition === 'left' ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}>
                    {content.heading && (
                      <h4 className="card-title text-white mb-6 font-display">
                        {content.heading}
                      </h4>
                    )}
                    <p className="text-white/70 text-base leading-relaxed whitespace-pre-line font-light">
                      {content.text}
                    </p>
                  </div>
                  <div className={`relative aspect-[4/3] rounded-sm overflow-hidden bg-neutral-900 border border-white/10 ${
                    content.mediaPosition === 'left' ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
                  }`}>
                    {content.imageUrl && (
                      <Image
                        src={content.imageUrl}
                        alt={content.imageCaption || 'Architectural View'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 600px"
                      />
                    )}
                  </div>
                </div>
              </section>
            );

          case 'gallery':
            return (
              <section key={block.id} className="max-w-7xl mx-auto px-6 my-16 w-full">
                {content.title && (
                  <div className="font-mono text-xs text-white/50 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">
                    {content.title}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {(content.images || []).map((img: any, i: number) => (
                    <div key={i} className="group relative flex flex-col gap-2">
                      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900 border border-white/10 rounded-sm">
                        <Image
                          src={img.url}
                          alt={img.caption || `Gallery ${i + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      {img.caption && (
                        <p className="text-[11px] font-mono text-white/50 line-clamp-2">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'horizontal_gallery':
            return (
              <section key={block.id} className="w-full my-16 overflow-x-auto no-scrollbar py-6">
                <div className="flex gap-6 px-6 sm:px-12 w-max">
                  {(content.images || []).map((img: any, i: number) => (
                    <div key={i} className="relative w-[340px] sm:w-[480px] aspect-[16/10] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 flex-shrink-0">
                      <Image
                        src={img.url}
                        alt={img.caption || `Strip item ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="480px"
                      />
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'stats':
            return (
              <section key={block.id} className="max-w-6xl mx-auto px-6 my-12 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-8 border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                  {(content.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col">
                      <span className="font-mono text-xs tracking-widest text-white/50 uppercase mb-2">
                        {item.label}
                      </span>
                      <span className="font-display text-2xl sm:text-3xl font-semibold text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'quote':
            return (
              <section key={block.id} className="max-w-4xl mx-auto px-6 my-16 text-center">
                <blockquote className="font-display text-2xl sm:text-4xl text-white font-medium italic leading-relaxed mb-6">
                  &ldquo;{content.quote}&rdquo;
                </blockquote>
                {(content.author || content.role) && (
                  <div className="font-mono text-xs tracking-widest text-skyblue uppercase">
                    {content.author} {content.role && `• ${content.role}`}
                  </div>
                )}
              </section>
            );

          case 'before_after':
            return (
              <div key={block.id} className="max-w-6xl mx-auto px-6 w-full">
                <BeforeAfterSlider
                  title={content.title}
                  beforeImage={content.beforeImage}
                  beforeLabel={content.beforeLabel}
                  afterImage={content.afterImage}
                  afterLabel={content.afterLabel}
                  initialPosition={content.initialPosition || 50}
                />
              </div>
            );

          case 'video':
            return (
              <div key={block.id} className="max-w-6xl mx-auto px-6 my-12 w-full">
                <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-neutral-900 border border-white/10">
                  <video
                    src={content.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                {content.caption && (
                  <div className="mt-2 font-mono text-[11px] text-white/40 tracking-wider">
                    {content.caption}
                  </div>
                )}
              </div>
            );

          case 'spatial_3d':
          case 'three_d_viewer':
          case 'three_d_model':
            const drawingsList = content.drawings || (content.imageUrl || content.url ? [{
              label: content.drawingLabel || 'Architectural Documentation',
              url: content.imageUrl || content.url,
              type: content.drawingType || 'plan',
              caption: content.caption || content.description,
            }] : []);

            return (
              <section key={block.id} className="max-w-6xl mx-auto px-6 w-full">
                <ArchitecturalPlanViewer
                  title={content.title || 'Architectural Drawing & Spatial Plan'}
                  subtitle={content.subtitle || 'AUTHENTIC CVI CAD & MASTERPLAN DOCUMENTATION'}
                  drawings={drawingsList}
                  verifiedArea={content.verifiedArea}
                  verifiedLocation={content.verifiedLocation}
                  verifiedYear={content.verifiedYear}
                  verifiedClient={content.verifiedClient}
                />
              </section>
            );

          case 'spacer':
            return (
              <div
                key={block.id}
                className="w-full"
                style={{ height: `${content.height || 64}px` }}
              >
                {content.hasDivider && <div className="max-w-6xl mx-auto h-[1px] bg-white/10" />}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
