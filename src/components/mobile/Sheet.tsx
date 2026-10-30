'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

/** Bottom sheet: slides up over a dimmed screen, tap outside to close. */
export function Sheet({
  title,
  onClose,
  children,
  className = '',
  tall,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Takes the whole screen but a strip on top (receipts). */
  tall?: boolean;
}) {
  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] animate-[scrim-in_.25s_ease_both] bg-[var(--scrim)]" />
        <Dialog.Content
          aria-describedby={undefined}
          // Focusing the first button would scroll the sheet and flash a ring on touch screens.
          onOpenAutoFocus={e => e.preventDefault()}
          className={`fixed inset-x-0 bottom-0 z-[160] mx-auto flex max-w-[560px] animate-[sheet-in_.38s_cubic-bezier(.22,.8,.3,1)_both] flex-col rounded-t-[28px] text-ink shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.4)] outline-none ${
            tall ? 'top-[max(60px,env(safe-area-inset-top))] bg-panel' : 'max-h-[calc(100dvh-40px)] overflow-y-auto bg-modal'
          } ${className}`}
          style={tall ? undefined : { paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="mx-auto mt-2.5 h-[5px] w-[38px] shrink-0 rounded-[3px] bg-line" />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
