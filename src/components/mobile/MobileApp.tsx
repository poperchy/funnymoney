'use client';

import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { $sheet } from '@/model/mobile';
import { $incomeRound, $pigFlow, $spendDraft, $stop, $toast, toastHidden } from '@/model/ui';
import { CategoryDialog } from '@/components/dialogs/CategoryDialog';
import { ExchangeDialog } from '@/components/dialogs/ExchangeDialog';
import { ReceiptDialog } from '@/components/dialogs/ReceiptDialog';
import { ShopDialog } from '@/components/dialogs/ShopDialog';
import { WelcomeDialog } from '@/components/dialogs/WelcomeDialog';
import { PigFace } from '@/components/wall/Toast';
import { CellSheet } from './CellSheet';
import { DistributeSheet } from './DistributeSheet';
import { ManualSpendSheet } from './ManualSpendSheet';
import { MenuSheet } from './MenuSheet';
import { MobileOnboarding } from './MobileOnboarding';
import { MobileWall } from './MobileWall';
import { PigSheet } from './PigSheet';
import { ReceiptsSheet } from './ReceiptsSheet';
import { SpendSheet } from './SpendSheet';

/** Where the bubble's tail points: the dock pig's head, in screen px. Null when the pig can't be seen. */
function pigAnchor() {
  // Any dialog (shop, receipt, cell editor…) covers the dock.
  if (document.querySelector('[role="dialog"]')) return null;
  const el = document.querySelector('[data-pig]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width * 0.82, top: r.top };
}

const TAIL = 8;

/**
 * Notifications are the pig talking, as on the desktop: a speech bubble above the dock pig, its tail
 * pointing at the head. While a sheet covers the pig, the bubble moves to the top, with its face.
 */
function MobileToast({ onWall, sheetUp }: { onWall: boolean; sheetUp: boolean }) {
  const toast = useUnit($toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => toastHidden(), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  const anchor = toast && onWall && !sheetUp ? pigAnchor() : null;
  const covered = !!toast && onWall && !anchor;
  const vw = typeof window === 'undefined' ? 390 : window.innerWidth;
  const right = 12;
  // Keep the tail over the head, but within the bubble's rounded corner.
  const tailRight = anchor ? Math.max(18, vw - anchor.x - right - TAIL) : 0;
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          className="pointer-events-none fixed z-[300] max-w-[330px]"
          style={
            anchor
              ? { right, bottom: window.innerHeight - anchor.top + 4, transformOrigin: `calc(100% - ${tailRight + TAIL}px) 100%` }
              : sheetUp || covered
                ? { left: 16, right: 16, top: 'calc(env(safe-area-inset-top) + 12px)', marginInline: 'auto', width: 'max-content', transformOrigin: '50% 0' }
                : { left: 16, bottom: 'calc(env(safe-area-inset-bottom) + 96px)', transformOrigin: '0 100%' }
          }
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
          exit={{ opacity: 0, scale: 0.9, y: -4, transition: { duration: 0.2 } }}
        >
          <div className="relative flex items-center gap-2.5 rounded-[18px] bg-modal px-4 py-3 text-sm leading-snug text-ink shadow-[0_18px_36px_-16px_rgba(30,15,0,0.55),0_0_0_1px_var(--line)]">
            {!anchor && <PigFace />}
            <span>{toast.text}</span>
            {anchor && (
              // The tail, pointing down at the pig.
              <span className="absolute -bottom-[7px] h-4 w-4 rotate-45 rounded-[3px] bg-modal shadow-[1px_1px_0_0_var(--line)]" style={{ right: tailRight }} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Phone layout: the same wallet and model, laid out for one thumb. No canvas: the wall is plain DOM. */
export function MobileApp() {
  const [stop, round, sheet, draft, pigFlow] = useUnit([$stop, $incomeRound, $sheet, $spendDraft, $pigFlow]);
  const onWall = stop === 'wall';

  return (
    <>
      {onWall ? <MobileWall /> : <MobileOnboarding key={round} />}
      {draft && <SpendSheet key={draft.billIds[0]} />}
      {sheet?.type === 'cell' && <CellSheet loc={sheet.loc} sel={sheet.sel} />}
      {pigFlow && <PigSheet />}
      {sheet?.type === 'receipts' && <ReceiptsSheet tab={sheet.tab ?? 'receipts'} />}
      {sheet?.type === 'menu' && <MenuSheet />}
      {sheet?.type === 'spend' && <ManualSpendSheet source={sheet.source} />}
      {sheet?.type === 'distribute' && <DistributeSheet key={sheet.source} source={sheet.source} />}
      <WelcomeDialog />
      <CategoryDialog />
      <ReceiptDialog />
      <ExchangeDialog />
      <ShopDialog />
      <MobileToast onWall={onWall} sheetUp={!!sheet || !!draft || !!pigFlow} />
    </>
  );
}
