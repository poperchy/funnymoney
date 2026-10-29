// Synthesizes the app's sound effects into public/sounds/*.wav, so there are no licensing questions.
// Run: npm run sounds
//
// Goal: soft and warm, never shrill. Everything is low-passed, short, with gentle attacks and fades,
// and quieter than full scale — these play dozens of times per session.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');
mkdirSync(out, { recursive: true });

// Seeded, so regenerating gives the same files.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const chance = () => (rand() + 1) / 2;
const len = s => Math.round(s * RATE);

/** Writes 16-bit mono PCM, normalised to `peak` of full scale, with a short fade-in/out against clicks. */
function wav(name, samples, peak = 0.55) {
  const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const fade = Math.min(len(0.004), samples.length >> 2);
  for (let i = 0; i < fade; i++) {
    samples[i] *= i / fade;
    samples[samples.length - 1 - i] *= i / fade;
  }
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round((v / max) * peak * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(join(out, name + '.wav'), Buffer.concat([h, data]));
}

/** One-pole low-pass, `a` in 0..1 (smaller = darker). */
function lowpass(s, a) {
  let y = 0;
  for (let i = 0; i < s.length; i++) s[i] = y += (s[i] - y) * a;
  return s;
}

/** A short soft "тык": a muted wooden tap, ~40 ms, no hiss. Used when a bill is picked up or put down. */
function tick(pitch = 1) {
  const n = len(0.045), s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    s[i] =
      Math.sin(2 * Math.PI * 950 * pitch * t) * Math.exp(-t * 110) +
      Math.sin(2 * Math.PI * 2100 * pitch * t) * Math.exp(-t * 190) * 0.25 +
      rand() * Math.exp(-t * 900) * 0.35;
  }
  return lowpass(s, 0.4);
}

/** "Тык-тык-тык": a few ticks settling, for a batch of bills moving at once. */
function ticks(count, spacing) {
  const one = len(0.045), gap = len(spacing), s = new Float64Array(gap * (count - 1) + one);
  for (let k = 0; k < count; k++) {
    const t = tick(1 + (chance() - 0.5) * 0.12), amp = 1 - k * 0.15;
    for (let i = 0; i < t.length; i++) s[k * gap + i] += t[i] * amp;
  }
  return s;
}

/** Small round "tink": low partials, fast decay, soft mallet attack. */
function coin() {
  const n = len(0.22), s = new Float64Array(n);
  const partials = [[1320, 1], [1980, 0.35], [3150, 0.12]];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const attack = Math.min(1, t / 0.003);
    let v = 0;
    for (const [f, a] of partials) v += Math.sin(2 * Math.PI * f * t) * a * Math.exp(-t * (22 + f / 300));
    s[i] = v * attack;
  }
  return s;
}

/** Muffled ceramic pop: a low thump and a few soft taps of shards, no hiss. */
function crack() {
  const n = len(0.6), s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    s[i] = Math.sin(2 * Math.PI * (140 - 60 * t) * t) * Math.exp(-t * 14) * 0.9 + rand() * Math.exp(-t * 40) * 0.5;
  }
  lowpass(s, 0.18);
  for (let k = 0; k < 7; k++) {
    const at = len(0.06 + chance() * 0.4), f = 700 + chance() * 600;
    for (let i = 0; i < len(0.07) && at + i < n; i++) {
      const t = i / RATE;
      s[at + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 60) * 0.18;
    }
  }
  return s;
}

/** Warm two-note marimba "ta-dam" instead of a shrill bell. */
function till() {
  const n = len(0.55), s = new Float64Array(n);
  const note = (f, start, amp) => t => {
    if (t < start) return 0;
    const x = t - start;
    return (Math.sin(2 * Math.PI * f * x) + Math.sin(2 * Math.PI * f * 4 * x) * 0.08) * Math.exp(-x * 9) * amp * Math.min(1, x / 0.004);
  };
  const a = note(523, 0, 0.8), b = note(784, 0.09, 0.7);
  for (let i = 0; i < n; i++) s[i] = a(i / RATE) + b(i / RATE);
  return s;
}

/** A cute short "хрю": two soft vowel-ish formants on a sliding pitch, no buzz. */
function oink() {
  const n = len(0.22), s = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f0 = 210 + 70 * Math.sin(Math.PI * t * 0.9) - 40 * t;
    ph += (2 * Math.PI * f0) / RATE;
    const voice = Math.sin(ph) + Math.sin(ph * 2) * 0.45 + Math.sin(ph * 3) * 0.2;
    const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8;
    s[i] = voice * env;
  }
  return lowpass(s, 0.22);
}

// "rustle"/"flutter" keep their names, but bills now go "тык" rather than rustle.
/** One snorty grunt: a pitch slide through soft harmonics, with a fast flutter for the nasal rasp. */
function grunt(duration, fromHz, toHz) {
  const n = len(duration), s = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, sec = i / RATE;
    ph += (2 * Math.PI * (fromHz + (toHz - fromHz) * t)) / RATE;
    const voice = Math.sin(ph) + Math.sin(ph * 2) * 0.6 + Math.sin(ph * 3) * 0.35 + Math.sin(ph * 4) * 0.18;
    const rasp = 0.65 + 0.35 * Math.sin(2 * Math.PI * 32 * sec);
    s[i] = (voice * rasp + rand() * 0.12) * Math.sin(Math.PI * t) ** 0.7;
  }
  return lowpass(s, 0.25);
}

/** "Хрю-хрю" for poking the pig: two grunts, the second a touch higher. */
function oinkOink() {
  const a = grunt(0.13, 230, 165), b = grunt(0.15, 250, 160), gap = len(0.05);
  const s = new Float64Array(a.length + gap + b.length);
  s.set(a, 0);
  s.set(b, a.length + gap);
  return s;
}

wav('rustle', tick(), 0.4);
wav('oinkoink', oinkOink(), 0.42);
wav('flutter', ticks(4, 0.085), 0.36);
wav('clink', coin(), 0.32);
wav('crack', crack(), 0.5);
wav('till', till(), 0.38);
wav('oink', oink(), 0.4);
console.log('sounds written to', out);
