'use client';

import * as RadixSelect from '@radix-ui/react-select';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  /** Second, quieter line in the list. */
  hint?: string;
  /** What the closed pill shows instead of the value. */
  short?: string;
};

const SIZES = { sm: 'h-10', md: 'h-11' };

/** The pill from the header's button row, with a list that matches the app's dialogs. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
}: {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** For screen readers: the pill itself shows only the current value. */
  label: string;
  size?: keyof typeof SIZES;
}) {
  const current = options.find(o => o.value === value);
  return (
    <RadixSelect.Root value={value} onValueChange={v => onChange(v as T)}>
      <RadixSelect.Trigger
        aria-label={label}
        className={`group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line bg-transparent pr-3 pl-3.5 text-sm font-medium whitespace-nowrap text-ink transition-colors outline-none hover:bg-btn2 focus-visible:border-accent data-[state=open]:border-accent data-[state=open]:bg-accent-wash ${SIZES[size]}`}
      >
        <RadixSelect.Value>{current?.short ?? current?.value}</RadixSelect.Value>
        <RadixSelect.Icon asChild>
          <svg viewBox="0 0 12 12" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink2 transition-transform duration-200 group-data-[state=open]:rotate-180">
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="select-pop z-[230] min-w-[190px] overflow-hidden rounded-[20px] border border-line bg-modal text-ink shadow-[0_24px_48px_-20px_rgba(20,10,0,0.55)]"
        >
          <RadixSelect.Viewport className="flex flex-col gap-0.5 p-1.5">
            {options.map(o => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-[14px] py-2 pr-3 pl-3 outline-none select-none data-[highlighted]:bg-field data-[state=checked]:bg-accent-wash"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <RadixSelect.ItemText>
                    <span className="text-sm font-semibold">{o.label}</span>
                  </RadixSelect.ItemText>
                  {o.hint && <span className="truncate text-xs text-ink2">{o.hint}</span>}
                </span>
                <RadixSelect.ItemIndicator>
                  <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3 8.5 3.2 3.2L13 5" />
                  </svg>
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
