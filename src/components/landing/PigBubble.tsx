'use client';

import { AnimatePresence, motion } from 'motion/react';

/** What the pig just said: a speech bubble with its tail pointing down, popping in on every new line. */
export function PigBubble({ line, tailRight = 36, className = '' }: { line: { text: string; key: number }; tailRight?: number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={line.key}
        role="status"
        initial={{ opacity: 0, scale: 0.6, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.12 } }}
        className={`relative rounded-[18px] bg-modal px-4 py-2.5 text-left text-sm leading-snug font-medium text-ink shadow-[0_18px_36px_-16px_rgba(30,15,0,0.55),0_0_0_1px_var(--line)] ${className}`}
        style={{ transformOrigin: `calc(100% - ${tailRight}px) 100%` }}
      >
        {line.text}
        <span className="absolute -bottom-[7px] h-4 w-4 rotate-45 rounded-[3px] bg-modal shadow-[1px_1px_0_0_var(--line)]" style={{ right: tailRight }} />
      </motion.div>
    </AnimatePresence>
  );
}
