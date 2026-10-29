'use client';

import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { $incomeRound, $stop, $theme, $welcomeSeen, toastShown, type Stop } from '@/model/ui';
import { $layout, $wallet } from '@/model/wallet';
import { preload } from '@/sound/sfx';
import { CategoryDialog } from './dialogs/CategoryDialog';
import { ManualSpendDialog } from './dialogs/ManualSpendDialog';
import { PiggyDialog } from './dialogs/PiggyDialog';
import { ExchangeDialog } from './dialogs/ExchangeDialog';
import { ReceiptDialog } from './dialogs/ReceiptDialog';
import { ShopDialog } from './dialogs/ShopDialog';
import { SpendDropDialog } from './dialogs/SpendDropDialog';
import { WelcomeDialog, greeting } from './dialogs/WelcomeDialog';
import { FALL_PAN_S, Onboarding } from './onboarding/Onboarding';
import { DragGhost } from './wall/DragGhost';
import { Toast } from './wall/Toast';
import { Header } from './wall/Header';
import { HEADER_H, Wall, wallHeight } from './wall/Wall';

const DESIGN_W = 1440;
/** Below this the hand screen would not fit; the page then scrolls a little. */
const MIN_STOP_H = 640;

const subscribeResize = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};
/** The app is laid out for 1440px and scaled down on narrower screens. */
const useFit = () => useSyncExternalStore(subscribeResize, () => Math.min(1, window.innerWidth / DESIGN_W), () => 1);
const useViewportH = () => useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 900);

/** Canvas painters read the page font, so wait until it is actually loaded. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const family = getComputedStyle(document.body).fontFamily;
    Promise.all([document.fonts.load(`700 20px ${family}`), document.fonts.load(`400 16px ${family}`)])
      .catch(() => undefined)
      .then(() => setReady(true));
  }, []);
  return ready;
}

const PAN: Record<Stop, { duration: number; delay: number }> = {
  hand: { duration: 1, delay: 0 },
  table: { duration: FALL_PAN_S, delay: 0.25 },
  wall: { duration: 1.2, delay: 0 },
};

const subscribeScroll = (cb: () => void) => {
  window.addEventListener('scroll', cb, { passive: true });
  return () => window.removeEventListener('scroll', cb);
};
const useScrolled = () => useSyncExternalStore(subscribeScroll, () => window.scrollY > 4, () => false);

/**
 * The wall's header, pinned to the top of the window. It can't live inside the stage: the stage is
 * shifted by the camera, so `position: sticky` there would count the hand and table stops above it.
 * It slides in as the camera reaches the wall; the wall keeps an empty HEADER_H gap for it.
 */
function FixedHeader({ show, k }: { show: boolean; k: number }) {
  const scrolled = useScrolled();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          className="fixed inset-x-0 top-0 z-[100] border-b border-line backdrop-blur-md transition-shadow duration-300"
          style={{
            height: HEADER_H * k,
            background: 'color-mix(in srgb, var(--page) 88%, transparent)',
            boxShadow: scrolled ? '0 10px 30px -18px rgba(30,15,0,0.45)' : 'none',
          }}
          initial={{ y: -HEADER_H * k - 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.5, delay: PAN.wall.duration * 0.7, ease: [0.22, 0.8, 0.3, 1] } }}
          exit={{ y: -HEADER_H * k - 12, opacity: 0, transition: { duration: 0.3 } }}
        >
          <div className="mx-auto" style={{ width: DESIGN_W * k }}>
            <div style={{ width: DESIGN_W, transform: `scale(${k})`, transformOrigin: '0 0' }}>
              <Header />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MoneyApp() {
  const [stop, round, theme, layout] = useUnit([$stop, $incomeRound, $theme, $layout]);
  const k = useFit();
  const vh = useViewportH();
  const ready = useFontsReady();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(preload, []);
  // Leaving the wall for the hand: start from the top, the camera does the rest.
  useEffect(() => {
    if (stop !== 'wall') window.scrollTo({ top: 0 });
  }, [stop]);
  // Returning visitors get a hello; first-timers get the welcome card instead.
  useEffect(() => {
    if (!$welcomeSeen.getState() || !$wallet.getState().onboarded) return;
    const t = setTimeout(() => toastShown(greeting()), 900);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  // One stop = one viewport, in design px.
  const hd = Math.max(MIN_STOP_H, vh / k);
  const offset = stop === 'hand' ? 0 : stop === 'table' ? hd : 2 * hd;
  const visibleH = stop === 'wall' ? wallHeight(layout.h) : hd;

  return (
    <>
      {/* The window: exactly as tall as the current stop, so there is nothing to scroll between stops.
          `clip`, not `hidden`: a hidden box can still be scrolled by focus and would shift the camera. */}
      <div className="mx-auto overflow-clip"style={{ width: DESIGN_W * k, height: visibleH * k }}>
        <div style={{ width: DESIGN_W, transform: `scale(${k})`, transformOrigin: '0 0' }}>
          <motion.div initial={false} animate={{ y: -offset }} transition={{ ...PAN[stop], ease: [0.65, 0, 0.35, 1] }}>
            <Onboarding key={round} hd={hd} />
            <Wall />
          </motion.div>
        </div>
      </div>
      <FixedHeader show={stop === 'wall'} k={k} />
      <WelcomeDialog />
      <SpendDropDialog />
      <ManualSpendDialog />
      <PiggyDialog />
      <CategoryDialog />
      <ReceiptDialog />
      <ExchangeDialog />
      <ShopDialog />
      <Toast />
      <DragGhost />
    </>
  );
}
