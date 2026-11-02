import type { Metadata } from 'next';
import { RenderClient } from './RenderClient';

export const metadata: Metadata = {
  title: 'Рендер скинов',
  robots: { index: false },
};

/** A workbench for `npm run skins:previews`, not a page for people: empty outside `next dev`. */
export default function SkinRenderPage() {
  return <RenderClient />;
}
