import { BASE_PATH, pageHref } from '@/lib/paths';
import { en } from './en';
import { ru, type Dict } from './ru';

export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const dictionaries: Record<Locale, Dict> = { ru, en };

const KEY = 'nalichka:locale';
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** The landing page's URL says its language. Elsewhere: what you chose, else what your browser speaks. */
export function resolveLocale(path: string, saved: unknown, browser: string): Locale {
  if (path === '/en' || path.startsWith('/en/')) return 'en';
  if (path === '' || path === '/') return 'ru';
  if (isLocale(saved)) return saved;
  return /^(ru|be|uk|kk)\b/i.test(browser) ? 'ru' : 'en';
}

function detect(): Locale {
  if (typeof window === 'undefined') return 'ru';
  const path = location.pathname.slice(BASE_PATH.length);
  const saved = localStorage.getItem(KEY);
  const found = resolveLocale(path, saved, navigator.language);
  // Came in through the English landing: the app behind it should speak the same.
  if (!saved && (path === '/en' || path.startsWith('/en/'))) localStorage.setItem(KEY, found);
  return found;
}

/**
 * Picked once per page load, so plain modules, the Pixi scene and painted bills can all just read `tr`.
 * Changing the language reloads the page (`changeLocale`), and nothing has to redraw itself.
 */
export const locale = detect();
export const tr = dictionaries[locale];

export const saveLocale = (next: Locale) => localStorage.setItem(KEY, next);

export function changeLocale(next: Locale) {
  if (next === locale) return;
  saveLocale(next);
  location.reload();
}

export const landingHref = (l: Locale = locale) => pageHref(l === 'en' ? '/en/' : '/');
