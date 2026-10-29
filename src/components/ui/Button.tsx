import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'accentOutline' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold shadow-[0_10px_22px_-12px_rgba(30,70,50,0.8)]',
  secondary: 'bg-btn2 text-ink font-semibold',
  outline: 'border border-line bg-transparent text-ink font-medium',
  accentOutline: 'border-[1.5px] border-accent bg-accent-wash text-ink font-semibold',
  link: 'bg-transparent text-ink2 underline underline-offset-[3px] !h-auto !px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-[18px] text-sm',
  lg: 'h-[50px] px-[26px] text-[15px]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    />
  );
}

/** Pill chip that can be selected, used for amounts and categories. */
export function Chip({ on, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      {...props}
      className={`h-[42px] rounded-full border-[1.5px] px-[18px] text-[15px] font-semibold text-ink transition-colors ${on ? 'border-accent bg-accent-wash' : 'border-line bg-transparent'} ${className}`}
    />
  );
}
