'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  width?: number;
  children: ReactNode;
  /** Without a backdrop the wall stays interactive (used for the piggy). */
  bare?: boolean;
  className?: string;
};

export function Modal({ open, onClose, title, description, width = 560, children, bare, className = '' }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()} modal={!bare}>
      <Dialog.Portal>
        {!bare && <Dialog.Overlay className="fixed inset-0 z-[200] bg-[rgba(25,16,8,0.45)] backdrop-blur-[4px]" />}
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          onInteractOutside={bare ? e => e.preventDefault() : undefined}
          className={`fixed z-[210] max-w-[calc(100vw-32px)] ${bare ? 'top-6 left-1/2 -translate-x-1/2' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}`}
          style={{ width }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 0.8, 0.3, 1] }}
            className={`flex max-h-[calc(100vh-48px)] flex-col gap-5 overflow-auto rounded-3xl bg-modal p-7 text-ink shadow-[0_40px_80px_-30px_rgba(20,10,0,0.6)] ${className}`}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {description ? <Dialog.Description className="sr-only">{description}</Dialog.Description> : null}
            {children}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
