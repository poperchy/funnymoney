'use client';

import { useEffect, useRef, useState } from 'react';
import { PIG_LINES } from '@/model/defaults';
import { pigShaken, toastShown } from '@/model/ui';
import { play } from '@/sound/sfx';

// Same moves as the canvas pig on the desktop (piggy.ts), as keyframes.
const POKE: Keyframe[] = [
  { transform: 'none' },
  { transform: 'scale(1.08, 0.88)', offset: 0.15 },
  { transform: 'translateY(-12px) scale(0.96, 1.06)', offset: 0.38 },
  { transform: 'translateY(0) scale(1.03, 0.97)', offset: 0.62 },
  { transform: 'translateY(-3px) scale(0.99, 1.01)', offset: 0.8 },
  { transform: 'none' },
];
const TALK: Keyframe[] = [
  { transform: 'none' },
  { transform: 'scale(1.04, 0.95)', offset: 0.2 },
  { transform: 'scale(0.98, 1.03)', offset: 0.45 },
  { transform: 'scale(1.03, 0.96)', offset: 0.65 },
  { transform: 'none' },
];
const SHAKE: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translateX(-8px) rotate(-9deg)', offset: 0.17 },
  { transform: 'translateX(8px) rotate(8deg)', offset: 0.38 },
  { transform: 'translateX(-4px) rotate(-6deg)', offset: 0.58 },
  { transform: 'translateX(3px) rotate(3deg)', offset: 0.78 },
  { transform: 'none' },
];

let pokes = 0;
/** Poking the pig: it oinks, coins jingle, and every fourth poke it has something to say. */
function pokeSounds() {
  play('oinkoink');
  play('clink', 0.06);
  if (++pokes % 4 === 0) toastShown(PIG_LINES[(pokes / 4 - 1) % PIG_LINES.length]);
}

/**
 * Animates a DOM pig: `ref` goes on the element that squashes (origin at its feet), `jolt` into PigArt.
 * It chatters on every notification and shakes when the piggy ritual shakes it.
 */
export function usePig() {
  const ref = useRef<HTMLDivElement>(null);
  const [jolt, setJolt] = useState(0);
  const busyUntil = useRef(0);

  useEffect(() => {
    const run = (frames: Keyframe[], ms: number) => {
      busyUntil.current = Date.now() + ms;
      ref.current?.animate(frames, { duration: ms, easing: 'ease-out' });
    };
    const talk = toastShown.watch(() => {
      // A poke already makes it move; don't cut that short.
      if (Date.now() > busyUntil.current) run(TALK, 420);
    });
    const shake = pigShaken.watch(() => {
      run(SHAKE, 520);
      setJolt(j => j + 1);
    });
    return () => {
      talk.unsubscribe();
      shake.unsubscribe();
    };
  }, []);

  const poke = () => {
    busyUntil.current = Date.now() + 760;
    ref.current?.animate(POKE, { duration: 760, easing: 'ease-out' });
    setJolt(j => j + 1);
    pokeSounds();
  };

  return { ref, jolt, poke };
}
