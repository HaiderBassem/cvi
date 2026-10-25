'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Soft entrance for page content as it scrolls into view.
 *
 * Mark an element with `data-reveal` and it fades and rises in once; mark a container with
 * `data-reveal-group` and each of its direct children does so in a short stagger. Anything already
 * on screen when the page opens is left alone (no flash), and nothing is hidden for visitors who
 * prefer reduced motion. Styles live in globals.css ([data-reveal-state]).
 */
export function RevealOnScroll() {
  const pathname = usePathname();

  useIsoLayoutEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => items.push(el));
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        const el = child as HTMLElement;
        el.style.setProperty('--rd', `${Math.min(i, 6) * 90}ms`);
        items.push(el);
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.revealState = 'in';
          io.unobserve(el);
          // drop the compositing hint once the entrance is over
          window.setTimeout(() => el.removeAttribute('data-reveal-state'), 1800);
        }
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.06 },
    );

    for (const el of items) {
      const r = el.getBoundingClientRect();
      const onScreen = r.top < window.innerHeight * 0.94 && r.bottom > 0;
      if (onScreen) continue; // already visible: leave it exactly as it is
      el.dataset.revealState = 'pending';
      io.observe(el);
    }

    return () => {
      io.disconnect();
      for (const el of items) {
        el.removeAttribute('data-reveal-state');
        el.style.removeProperty('--rd');
      }
    };
  }, [pathname]);

  return null;
}
