'use client';

import { useEffect, useRef, useState } from 'react';

/** How far (px) a slow pull has to go, and how far a quick flick (px/ms) has to go, to dismiss. */
const PULL = 100;
const FLICK = 40;
const FLICK_SPEED = 0.5;
const OUT_MS = 180;

/**
 * Pull a sheet or a dialog down to close it. Returns a callback ref for the moving element.
 * Works through the CSS `translate` property: `transform` there belongs to the entry animations.
 * Scrolled content scrolls first, sideways swipes stay with their chip rows, sliders stay sliders.
 */
export function useSwipeDown(onClose: () => void) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!el) return;
    let mode: 'idle' | 'armed' | 'pull' = 'idle';
    let x0 = 0, y0 = 0, t0 = 0, dy = 0;

    const scrolled = (from: EventTarget | null) => {
      for (let n = from as HTMLElement | null; n; n = n.parentElement) {
        if (n.scrollTop > 0) return true;
        if (n === el) break;
      }
      return false;
    };
    const start = (e: TouchEvent) => {
      const onSlider = (e.target as HTMLElement).closest?.('input[type="range"]');
      mode = e.touches.length === 1 && !onSlider && !scrolled(e.target) ? 'armed' : 'idle';
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      dy = 0;
    };
    const move = (e: TouchEvent) => {
      if (mode === 'idle') return;
      const t = e.touches[0];
      if (mode === 'armed') {
        const dx = Math.abs(t.clientX - x0), down = t.clientY - y0;
        if (dx < 4 && Math.abs(down) < 4) return;
        // Too late to take over once the browser has started scrolling.
        if (down <= dx || !e.cancelable) {
          mode = 'idle';
          return;
        }
        mode = 'pull';
        y0 = t.clientY;
        t0 = e.timeStamp;
        el.style.transition = 'none';
      }
      if (e.cancelable) e.preventDefault();
      dy = Math.max(0, t.clientY - y0);
      el.style.translate = `0 ${dy}px`;
    };
    const end = (e: TouchEvent) => {
      if (mode !== 'pull') {
        mode = 'idle';
        return;
      }
      mode = 'idle';
      const speed = dy / Math.max(1, e.timeStamp - t0);
      const away = dy > PULL || (dy > FLICK && speed > FLICK_SPEED);
      el.style.transition = `translate ${OUT_MS}ms ${away ? 'ease-in' : 'cubic-bezier(.22,.8,.3,1)'}`;
      el.style.translate = away ? `0 ${window.innerHeight}px` : '0 0';
      if (away) setTimeout(() => close.current(), OUT_MS);
    };

    // Not passive: once the pull starts, the finger moves the sheet and not the page behind it.
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [el]);

  return setEl;
}
