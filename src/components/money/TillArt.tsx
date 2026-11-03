import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import { money } from '@/lib/money/format';
import type { Receipt } from '@/model/types';
import type { TillSkin } from '@/scene/skins';
import { tr } from '@/lib/i18n';

const INK = '#1a1a1a';
const KEYS = ['#c8452f', '#e9dcc0', '#e9dcc0', '#3a2a18', '#e9dcc0', '#c8452f'];
const TRAYS = ['#f2c230', '#6fb48d', '#7cb8ff', '#ff9ec4'];

/** What a till skin adds on top of its colours: keys, hazard tape, eyes or coin trays. */
function TillDeco({ skin, small, top }: { skin: TillSkin; small?: boolean; top?: number }) {
  const k = small ? 0.7 : 1;
  const corner = 'pointer-events-none absolute z-[1]';
  const spot = { top: top ?? 12 * k, right: 14 * k };
  switch (skin.deco) {
    case 'keys':
      return (
        <span className={`${corner} grid grid-cols-3`} style={{ ...spot, gap: 3 * k }}>
          {KEYS.map((c, i) => (
            <span key={i} className="block rounded-full border border-[rgba(58,42,24,0.6)]" style={{ width: 11 * k, height: 11 * k, background: c }} />
          ))}
        </span>
      );
    case 'hazard':
      return <span className={`${corner} inset-x-0 top-0 block`} style={{ height: 7 * k, background: 'repeating-linear-gradient(135deg, #f2c230 0 9px, #1d1d1b 9px 18px)' }} />;
    case 'eyes':
      return (
        <span className={`${corner} flex`} style={{ ...spot, gap: 8 * k }}>
          {[0, 1].map(i => (
            <span key={i} className="block rounded-full" style={{ width: 10 * k, height: 14 * k, background: INK }} />
          ))}
        </span>
      );
    case 'trays':
      return (
        <span className={`${corner} flex`} style={{ ...spot, gap: 3 * k }}>
          {TRAYS.map(c => (
            <span key={c} className="block rounded-[2px] bg-[#1c1e1c] p-[2px]" style={{ width: 13 * k, height: 26 * k }}>
              <span className="block h-full w-full rounded-[1px]" style={{ background: c }} />
            </span>
          ))}
        </span>
      );
    default:
      return null;
  }
}

const sameMonth = (iso: string, now = new Date()) => {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};
export const spentThisMonth = (receipts: Receipt[]) => receipts.filter(r => sameMonth(r.at)).reduce((a, r) => a + r.amount, 0);
const monthName = () => new Date().toLocaleString(tr.intl, { month: 'long' });
/** What the till says it has swallowed. */
export const tillTotal = (receipts: Receipt[]) => tr.wall.tillTotal(money(spentThisMonth(receipts)), monthName());

const shadows = (...list: (string | false | undefined)[]) => list.filter(Boolean).join(', ');

/** The desktop till. The wall and the shop draw this same thing, so a preview can't drift from the real one. */
export function TillFace({ skin, over, caption, total, children, ref }: { skin: TillSkin; over?: boolean; caption: string; total: string; children?: ReactNode; ref?: Ref<HTMLDivElement> }) {
  const { look } = skin;
  return (
    <div
      ref={ref}
      className="relative h-[168px] overflow-hidden rounded-[20px] px-[18px] py-4 transition-[box-shadow,transform] duration-200"
      style={{
        background: look.background,
        color: look.ink,
        boxShadow: shadows(over ? '0 0 0 3px var(--accent), 0 24px 40px -20px rgba(0,0,0,0.6)' : '0 24px 40px -24px rgba(0,0,0,0.55)', look.outline && `inset 0 0 0 3px ${look.outline}`),
        transform: over ? 'scale(1.02)' : 'none',
      }}
    >
      <TillDeco skin={skin} />
      <div className="relative z-[3] flex flex-col gap-0.5">
        <span className="text-lg font-bold tracking-[-0.01em]">{tr.common.spent}</span>
        <span className="text-[13px]" style={{ color: look.inkSoft }}>
          {caption}
        </span>
      </div>
      <div className="absolute inset-x-[22px] bottom-[30px] h-[62px] rounded-xl shadow-[inset_0_3px_8px_rgba(0,0,0,0.5)]" style={{ background: look.well }}>
        <div className="absolute inset-x-3.5 top-3 h-2 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.12)]" style={{ background: look.slit }} />
        {children}
        <div className="absolute bottom-2.5 left-3.5 text-xs" style={{ color: look.inkSoft }}>
          {total}
        </div>
      </div>
    </div>
  );
}

/** The till in the phone's dock; the shop's phone preview and the landing page draw the same one. */
export function TillDock({
  skin,
  ring = '0 10px 20px -14px rgba(0,0,0,0.6)',
  height,
  caption,
  className = '',
  style,
  ...rest
}: { skin: TillSkin; ring?: string; height: number; caption: string; style?: CSSProperties } & HTMLAttributes<HTMLDivElement>) {
  const { look } = skin;
  return (
    <div
      {...rest}
      className={`relative overflow-hidden rounded-[22px] px-4 py-3 ${className}`}
      style={{
        ...style,
        height,
        background: look.background,
        color: look.ink,
        boxShadow: shadows(ring, look.outline && `inset 0 0 0 2.5px ${look.outline}`),
        transition: 'height .25s cubic-bezier(.22,.8,.3,1), box-shadow .2s ease',
      }}
    >
      <TillDeco skin={skin} small top={19} />
      <div className="absolute inset-x-4 top-[9px] h-1 rounded-sm shadow-[0_1px_0_rgba(255,255,255,0.1)]" style={{ background: look.slit }} />
      <div className="relative mt-2 flex flex-col gap-0.5">
        <span className="text-[17px] font-bold">{tr.common.spent}</span>
        <span className="truncate text-[13px]" style={{ color: look.inkSoft }}>
          {caption}
        </span>
      </div>
    </div>
  );
}
