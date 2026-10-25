import React from 'react';

/**
 * Re-mounts on every navigation, so each page fades in instead of snapping.
 * Opacity only: a transform on this wrapper would shift fixed and scroll-pinned content.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
