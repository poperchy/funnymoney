'use client';

import dynamic from 'next/dynamic';

// The check goes first so a production build drops the renderer and everything it pulls in.
export const RenderClient =
  process.env.NODE_ENV === 'development' ? dynamic(() => import('@/components/shop/SkinRender').then(m => m.SkinRender), { ssr: false }) : () => null;
