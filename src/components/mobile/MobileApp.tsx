'use client';

import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { $sheet } from '@/model/mobile';
import { $incomeRound, $spendDraft, $stop, $toast, toastHidden } from '@/model/ui';
import { CategoryDialog } from '@/components/dialogs/CategoryDialog';
import { ExchangeDialog } from '@/components/dialogs/ExchangeDialog';
import { ReceiptDialog } from '@/components/dialogs/ReceiptDialog';
import { WelcomeDialog } from '@/components/dialogs/WelcomeDialog';
import { PigFace } from '@/components/wall/Toast';
import { CellSheet } from './CellSheet';
import { MenuSheet } from './MenuSheet';
import { MobileOnboarding } from './MobileOnboarding';
import { MobileWall } from './MobileWall';
import { PigSheet } from './PigSheet';
import { ReceiptsSheet } from './ReceiptsSheet';
import { SpendSheet } from './SpendSheet';

/** The pig still does the talking, just from a bubble above the dock (or on top, while a sheet is up). */
function MobileToast({ onWall, sheetUp }: { onWall: boolean; sheetUp: boolean }) {
  const toast = useUnit($toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => toastHidden(), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          className="pointer-events-none fixed inset-x-0 z-[300] flex justify-center px-5"
          style={sheetUp ? { top: 'calc(env(safe-area-inset-top) + 12px)' } : { bottom: `calc(env(safe-area-inset-bottom) + ${onWall ? 124 : 96}px)` }}
          initial={{ opacity: 0, y: sheetUp ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex max-w-[350px] items-center gap-2.5 rounded-2xl bg-toast py-2.5 pr-[18px] pl-3 text-sm leading-[1.35] text-toast-ink shadow-[0_18px_36px_-18px_rgba(0,0,0,0.6)]">
            <PigFace />
            <span>{toast.text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Phone layout: the same wallet and model, laid out for one thumb. No canvas: the wall is plain DOM. */
export function MobileApp() {
  const [stop, round, sheet, draft] = useUnit([$stop, $incomeRound, $sheet, $spendDraft]);
  const onWall = stop === 'wall';

  return (
    <>
      {onWall ? <MobileWall /> : <MobileOnboarding key={round} />}
      {draft && <SpendSheet key={draft.billIds[0]} />}
      {sheet?.type === 'cell' && <CellSheet loc={sheet.loc} sel={sheet.sel} />}
      {sheet?.type === 'pig' && <PigSheet />}
      {sheet?.type === 'receipts' && <ReceiptsSheet />}
      {sheet?.type === 'menu' && <MenuSheet />}
      <WelcomeDialog />
      <CategoryDialog />
      <ReceiptDialog />
      <ExchangeDialog />
      <MobileToast onWall={onWall} sheetUp={!!sheet || !!draft} />
    </>
  );
}
