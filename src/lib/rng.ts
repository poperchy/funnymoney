/** Small seeded PRNG (mulberry32) so layouts are stable between renders. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Roughly normal value in about [-1, 1]. */
export const gauss = (r: () => number) => (r() + r() + r() - 1.5) / 1.5;

let counter = 0;
export const uid = (prefix: string) => prefix + Date.now().toString(36) + (counter++).toString(36);
