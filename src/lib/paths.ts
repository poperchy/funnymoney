/** Base path the site is served from (e.g. /funnymoney on GitHub Pages); empty locally. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Plain URL for a link between the landing and the app. These are separate pages with nothing to
 * prefetch, and in a static export Next's segment prefetch asks for files the export doesn't write.
 */
export const pageHref = (path: string) => `${BASE_PATH}${path}`;
