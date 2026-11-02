import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { picturePath, previewItems, type PreviewDevice } from './previewBox';

const PUBLIC = path.resolve('public');
const DEVICES: PreviewDevice[] = ['desktop', 'phone'];
const THEMES = ['light', 'dark'] as const;

describe('shop pictures', () => {
  const expected = DEVICES.flatMap(d => THEMES.flatMap(t => previewItems().map(i => picturePath(d, t, i))));

  // A new skin without a picture would be a broken image in the shop.
  it('every skin has a picture for every theme and device: npm run skins:previews', () => {
    expect(expected.filter(p => !existsSync(path.join(PUBLIC, p)))).toEqual([]);
  });

  it('there are no pictures of skins that are gone', () => {
    const actual = readdirSync(path.join(PUBLIC, 'skins'), { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('.webp'))
      .map(f => 'skins/' + f.replaceAll('\\', '/'));
    expect(actual.sort()).toEqual([...expected].sort());
  });
});
