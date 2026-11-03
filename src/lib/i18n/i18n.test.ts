import { describe, expect, it } from 'vitest';
import { amountNumber } from '@/lib/money/format';
import { en } from './en';
import { resolveLocale } from './index';

/** Every string in a dictionary, with functions called so their templates are checked too. */
function strings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (typeof node === 'function') return strings((node as (...a: number[]) => unknown)(1, 1, 1));
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}

describe('resolveLocale', () => {
  it('the landing URL decides, whatever was saved', () => {
    expect(resolveLocale('/en/', 'ru', 'ru-RU')).toBe('en');
    expect(resolveLocale('/', 'en', 'en-US')).toBe('ru');
  });

  it('in the app a saved choice beats the browser', () => {
    expect(resolveLocale('/app/', 'en', 'ru-RU')).toBe('en');
    expect(resolveLocale('/app/', 'ru', 'en-US')).toBe('ru');
  });

  it('with no choice the browser decides, and post-Soviet languages get Russian', () => {
    expect(resolveLocale('/app/', null, 'be-BY')).toBe('ru');
    expect(resolveLocale('/app/', null, 'de-DE')).toBe('en');
    expect(resolveLocale('/app/', 'fr', 'ru')).toBe('ru');
  });

  it('a path that only starts like /en is not English', () => {
    expect(resolveLocale('/english/', null, 'ru')).toBe('ru');
  });
});

describe('English dictionary', () => {
  it('has no Russian left in it, except the name of the language itself', () => {
    const left = strings({ ...en, language: { label: en.language.label } }).filter(s => /[А-Яа-яЁё]/.test(s));
    expect(left).toEqual([]);
  });
});

describe('amountNumber', () => {
  it('reads both decimal marks and spaces', () => {
    expect(amountNumber('1 234,50', ',')).toBe(1234.5);
    expect(amountNumber('12.5', ',')).toBe(12.5);
    expect(amountNumber('12,5', '.')).toBe(12.5);
  });

  it('in English a comma before three digits groups thousands', () => {
    expect(amountNumber('1,000', '.')).toBe(1000);
    expect(amountNumber('1,234,567.5', '.')).toBe(1234567.5);
  });

  it('in Russian the same comma stays a decimal mark', () => {
    expect(amountNumber('1,000', ',')).toBe(1);
  });

  it('nonsense stays NaN', () => {
    expect(amountNumber('', ',')).toBeNaN();
  });
});
