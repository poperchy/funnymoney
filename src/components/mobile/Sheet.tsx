'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState, type ReactNode } from 'react';
import { useSwipeDown } from '@/components/ui/useSwipeDown';

/** Height of the on-screen keyboard: it covers fixed elements instead of resizing the page. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

/** Bottom sheet: slides up over a dimmed screen, tap outside or pull it down to close. Rides above the keyboard. */
export function Sheet({
  title,
  onClose,
  children,
  className = '',
  tall,
  flush,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Takes the whole screen but a strip on top (receipts). */
  tall?: boolean;
  /** No padding at the bottom: for a sticky footer that keeps its own, or the list would show under it. */
  flush?: boolean;
}) {
  const swipe = useSwipeDown(onClose);
  const keyboard = useKeyboardInset();
  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] animate-[scrim-in_.25s_ease_both] bg-[var(--scrim)]" />
        <Dialog.Content
          ref={swipe}
          aria-describedby={undefined}
          // Focusing the first button would scroll the sheet and flash a ring on touch screens.
          onOpenAutoFocus={e => e.preventDefault()}
          // One sheet often replaces another: giving focus back would steal it from the next sheet's input.
          onCloseAutoFocus={e => e.preventDefault()}
          className={`fixed inset-x-0 z-[160] mx-auto flex max-w-[560px] animate-[sheet-in_.38s_cubic-bezier(.22,.8,.3,1)_both] flex-col overscroll-contain rounded-t-[28px] text-ink shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.4)] outline-none ${
            tall ? 'top-[max(60px,env(safe-area-inset-top))] bg-panel' : 'overflow-y-auto bg-modal'
          } ${className}`}
          style={
            tall
              ? { bottom: keyboard }
              : {
                  bottom: keyboard,
                  maxHeight: `calc(100dvh - 40px - ${keyboard}px)`,
                  paddingBottom: flush ? 0 : keyboard ? 14 : 'calc(env(safe-area-inset-bottom) + 28px)',
                }
          }
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="mx-auto mt-2.5 mb-1 h-[5px] w-[38px] shrink-0 rounded-[3px] bg-line" />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
