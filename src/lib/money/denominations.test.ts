import { describe, expect, it } from 'vitest';
import { guessScale, SCALES } from './denominations';

describe('guessScale', () => {
  it('the clock beats the browser language where the language says little', () => {
    expect(guessScale('ru-RU', 'Europe/Minsk')).toBe('small');
    expect(guessScale('ru', 'Asia/Almaty')).toBe('large');
  });

  it('otherwise the region decides', () => {
    expect(guessScale('ru-RU', 'Europe/Moscow')).toBe('medium');
    expect(guessScale('en-US', 'America/New_York')).toBe('small');
    expect(guessScale('ja-JP', 'Asia/Tokyo')).toBe('large');
  });

  it('with no region, the language', () => {
    expect(guessScale('ru', 'Asia/Vladivostok')).toBe('medium');
    expect(guessScale('de', 'Europe/Berlin')).toBe('small');
  });
});

describe('scales', () => {
  it('has six bills each, and coins that fit under the biggest one', () => {
    for (const s of Object.values(SCALES)) {
      expect(s.bills).toHaveLength(6);
      expect(Math.max(...s.coins)).toBeLessThan(s.bills[5]);
    }
  });
});
