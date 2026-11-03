import { PIG } from '@/scene/palette';

/** The sign prices are written in: a small pig's head. Sized by the text around it. */
export function PigMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`ml-[0.18em] inline-block h-[1.1em] w-[1.1em] shrink-0 align-[-0.2em] ${className}`}>
      <path d="M4.2 9.2 3.4 3.6c-.1-.7.6-1.1 1.2-.8l4.9 3Z" fill={PIG.fill} stroke={PIG.edge} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M19.8 9.2l.8-5.6c.1-.7-.6-1.1-1.2-.8l-4.9 3Z" fill={PIG.fill} stroke={PIG.edge} strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={12} cy={13} r={9.6} fill={PIG.fill} stroke={PIG.edge} strokeWidth={1.2} />
      <circle cx={8} cy={10.6} r={1.25} fill={PIG.eye} />
      <circle cx={16} cy={10.6} r={1.25} fill={PIG.eye} />
      <ellipse cx={12} cy={15.6} rx={4.6} ry={3.3} fill={PIG.body} stroke={PIG.edge} strokeWidth={1} />
      <ellipse cx={10.3} cy={15.6} rx={0.85} ry={1.15} fill={PIG.dark} />
      <ellipse cx={13.7} cy={15.6} rx={0.85} ry={1.15} fill={PIG.dark} />
    </svg>
  );
}
