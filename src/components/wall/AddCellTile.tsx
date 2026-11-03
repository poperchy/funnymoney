import type { CSSProperties } from 'react';
import { tr } from '@/lib/i18n';

/** Adding a cell: a small pale square with a plus, no words, on both the desktop and the phone wall. */
export function AddCellTile({ style, ink, size, onClick }: { style?: CSSProperties; ink?: string; size: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={tr.wall.addCell}
      title={tr.wall.addCell}
      className={`group pointer-events-auto flex items-center justify-center rounded-[6px] border-2 duration-200 ${
        ink
          ? 'border-current text-[var(--dash-ink)] opacity-30 transition-opacity hover:opacity-70'
          : 'border-[rgba(255,244,225,0.16)] bg-[rgba(255,244,225,0.03)] text-[rgba(255,244,225,0.28)] transition-colors hover:border-[rgba(255,244,225,0.4)] hover:bg-[rgba(255,244,225,0.07)] hover:text-[rgba(255,244,225,0.65)]'
      }`}
      style={{ ...style, width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.45} height={size * 0.45} className="transition-transform duration-200 group-hover:scale-110" aria-hidden>
        <path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
      </svg>
    </button>
  );
}
