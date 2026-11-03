'use client';

// Draws the shop's pictures: `npm run skins:previews` photographs these (see `SkinRender`), the shop shows the files.
// Nothing here is a sketch of a skin: the painters and components are the ones the wall uses. The desktop and the
// phone draw walls differently, so each gets its own.
import { useUnit } from 'effector-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Denoms } from '@/lib/money/denominations';
import { money, moneyShort } from '@/lib/money/format';
import { useMobile } from '@/lib/useMobile';
import { billsIn, crumpledInWallet, piggyCoins, pileTotal } from '@/model/ops';
import { $skins } from '@/model/skins';
import type { Bill, Wallet } from '@/model/types';
import { $theme, type Theme } from '@/model/ui';
import { $denoms, $layout, $wallet } from '@/model/wallet';
import { BH, BW, layoutKey, poseToPoint, SCENE_W, type Layout, type Rect } from '@/scene/layout';
import { desktopRegion, PHONE_H, PHONE_W, TILL_W, TILL_X, type PreviewPart } from './previewBox';
import { crumpledUrl, paintBackground, paintPurseBack, paintPurseFront } from '@/scene/paint';
import { boardVars, purseCss } from '@/scene/skinCss';
import { boardSkin, pageSkin, purseSkin, tillSkin, type PageLook, type SkinSet } from '@/scene/skins';
import { demoBill, MiniBoard } from '@/components/landing/MiniBoard';
import { billImg, PigArt } from '@/components/mobile/parts';
import { BillImg } from '@/components/money/BillImg';
import { PurseFace, PurseTrim } from '@/components/money/PurseTrim';
import { spentThisMonth, TillDock, TillFace } from '@/components/money/TillArt';
import { AddCellTile } from '@/components/wall/AddCellTile';
import { CellLabels } from '@/components/wall/WallOverlay';
import { tr } from '@/lib/i18n';

/** A card is far narrower than the wall, so this is sharp enough and paints much faster. */
const PREVIEW_RES = 1;

/** Lays out at real size, then scales to fit the card, so nothing has to be redrawn smaller. */
function Scaled({ w, h, page, children }: { w: number; h: number; page: PageLook; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return (
    <div ref={setEl} inert className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: `${w} / ${h}` }}>
      {width > 0 && (
        <div
          style={{ width: w, height: h, transform: `scale(${width / w})`, transformOrigin: '0 0', backgroundColor: page.color, backgroundImage: page.image, backgroundSize: page.size, '--page': page.color } as CSSProperties}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Painting a wall takes a moment, so paints run one at a time and the shop stays responsive. Each is kept for good.
const painted = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();

function usePainted(key: string, paint: () => HTMLCanvasElement) {
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    if (painted.has(key)) return;
    let cancelled = false;
    queue = queue.then(
      () =>
        new Promise<void>(resolve =>
          setTimeout(() => {
            if (cancelled) return resolve();
            // Cards often share a picture: whoever came first has already painted it.
            if (painted.has(key)) {
              setDone(key);
              return resolve();
            }
            // The encoding happens off the main thread, so only the painting itself holds the page up.
            paint().toBlob(
              blob => {
                if (blob) {
                  painted.set(key, URL.createObjectURL(blob));
                  setDone(key);
                }
                resolve();
              },
              'image/webp',
              0.85,
            );
          }),
        ),
    );
    return () => {
      cancelled = true;
    };
    // `key` names everything the paint depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return done === key || painted.has(key) ? painted.get(key) : undefined;
}

/** Your own money where you have it; where you don't, a few bills so the skin isn't shown empty. */
function previewBills(w: Wallet, denoms: Denoms) {
  const onBoard = w.bills.filter(b => b.location.type === 'cell');
  const cells: Bill[] = onBoard.length ? onBoard : w.categories.slice(0, 5).flatMap((c, i) => [demoBill(`${c.id}-a`, denoms.bills[(i + 2) % denoms.bills.length], c.id, i * 2), demoBill(`${c.id}-b`, denoms.bills[i % denoms.bills.length], c.id, i * 2 + 1)]);
  const inPile = billsIn(w, { type: 'pile' });
  const pile: Bill[] = inPile.length
    ? inPile
    : [3, 2, 1].map((n, i) => ({ id: 'demo-pile' + i, value: denoms.bills[n % denoms.bills.length], location: { type: 'pile' }, pose: { x: 0.15 + i * 0.3, y: 0.4, r: (i - 1) * 9 }, z: i }));
  return { cells, pile };
}


/** The desktop wall, whole: board, wallet, pig and till, in the same coordinates as the real scene. */
function DesktopWall({ skins, theme, L, w, denoms, region }: { skins: SkinSet; theme: Theme; L: Layout; w: Wallet; denoms: Denoms; region: Rect }) {
  const sig = `${theme}|${layoutKey(L)}`;
  const bg = usePainted(`bg|${skins.board}|${sig}`, () => paintBackground(theme, L, skins.board, PREVIEW_RES));
  const back = usePainted(`back|${skins.purse}|${sig}`, () => paintPurseBack(theme, L, skins.purse, PREVIEW_RES));
  const front = usePainted(`front|${skins.purse}|${sig}`, () => paintPurseFront(theme, L, skins.purse, PREVIEW_RES));
  const { cells, pile } = previewBills(w, denoms);
  const crumpled = crumpledInWallet({ ...w, bills: pile });
  const purse = purseSkin(skins.purse), walletLook = purse.look[theme];
  const boardLook = boardSkin(skins.board).look[theme];
  const { pocket, coinPocket } = L.purse;

  const bill = (b: Bill) => {
    const p = poseToPoint(b.location, b.pose, L);
    return (
      <div key={b.id} className="absolute" style={{ left: p.x - BW / 2, top: p.y - BH / 2, zIndex: b.z, transform: `rotate(${b.pose.r}deg)` }}>
        <BillImg value={b.value} />
      </div>
    );
  };

  return (
    <div className="absolute" style={{ left: -region.x, top: -region.y, width: TILL_X + TILL_W, height: L.h, ...boardVars(boardLook) }}>
      {bg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- painted just now */}
          <img src={bg} alt="" width={SCENE_W} height={L.h} className="absolute top-0 left-0" />
          <div className="absolute inset-0 isolate">{cells.map(bill)}</div>
          {w.categories.map((c, i) => {
            const r = L.cells.get(c.id);
            const k = cells.filter(b => b.location.type === 'cell' && b.location.cellId === c.id).reduce((a, b) => a + b.value, 0);
            return r ? (
              <div key={c.id} className="absolute" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                <CellLabels cat={c} index={i} total={k} />
              </div>
            ) : null;
          })}
          {L.addCell && <AddCellTile style={{ position: 'absolute', left: L.addCell.x, top: L.addCell.y }} size={L.addCell.w} ink={boardLook.ink} />}
        </>
      ) : (
        <div className="absolute animate-pulse rounded-[20px] bg-field" style={{ left: L.board.x, top: L.board.y, width: L.board.w, height: L.board.h }} />
      )}

      <div className="absolute" style={{ left: L.piggy.x, top: L.piggy.y, width: L.piggy.w, height: L.piggy.h }}>
        <PigArt coins={piggyCoins(w)} bills={billsIn(w, { type: 'piggy' })} wear={skins} />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- painted just now */}
      {back && <img src={back} alt="" width={L.pile.w} className="absolute" style={{ left: L.pile.x, top: L.pile.y }} />}
      <div className="absolute inset-0 isolate">{pile.filter(b => !crumpled.has(b.id)).slice(-14).map(bill)}</div>
      {/* eslint-disable-next-line @next/next/no-img-element -- painted just now */}
      {front && <img src={front} alt="" width={L.pile.w} className="absolute" style={{ left: L.pile.x, top: L.pile.y }} />}
      {pile
        .filter(b => crumpled.has(b.id))
        .map(b => (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URL
          <img
            key={b.id}
            src={crumpledUrl(b.value, denoms)}
            alt=""
            width={82}
            height={44}
            className="absolute"
            style={{ left: pocket.x + 40 + b.pose.x * (coinPocket.x - 84 - pocket.x) - 41, top: pocket.y + 4 + (b.pose.y - 0.5) * 8 - 22, transform: `rotate(${b.pose.r}deg)` }}
          />
        ))}
      <div
        className="absolute flex items-center justify-center text-center text-[13px] font-medium"
        style={{ color: walletLook.ink ?? 'rgba(255,236,205,0.75)', left: pocket.x, top: pocket.y + 18, width: coinPocket.x - pocket.x, height: pocket.h - 24 }}
      >
        {tr.common.idleBills}
      </div>
      {purse.trim === 'clasp' && (
        <div className="absolute" style={{ left: pocket.x + 22, top: pocket.y + 26 }}>
          <PurseFace />
        </div>
      )}

      <div className="absolute top-0" style={{ left: TILL_X, width: TILL_W }}>
        <TillFace skin={tillSkin(skins.till)} caption={tr.wall.tillIdle} total={tr.common.perMonth(money(spentThisMonth(w.receipts)))} />
      </div>
    </div>
  );
}

/** The phone's wallet plaque, as it looks above the wall. */
function PhonePlaque({ skins, theme, pile, total, denoms }: { skins: SkinSet; theme: Theme; pile: Bill[]; total: number; denoms: Denoms }) {
  const purse = purseSkin(skins.purse), look = purse.look[theme];
  return (
    <div className="relative rounded-[20px] px-3.5 pt-3.5 pb-2.5" style={purseCss(look)}>
      <PurseTrim skin={purse} look={look} faceWidth={48} />
      {!look.outline && <div className="pointer-events-none absolute inset-[5px] rounded-[16px] border-[1.5px] border-dashed" style={{ borderColor: look.stitch }} />}
      <div className="relative flex flex-col gap-0.5">
        <span className="text-[15px]">
          {tr.common.inWallet} <b className="text-[22px] tracking-[-0.02em] whitespace-nowrap">{moneyShort(total)}</b>
        </span>
        <span className="text-[13px] opacity-75">{tr.common.idleBills}</span>
      </div>
      <div className="relative mt-2.5 flex gap-2">
        <span className="flex h-11 flex-1 items-center justify-center rounded-full bg-[rgba(255,248,235,0.94)] text-sm font-semibold whitespace-nowrap text-[#2a231b]">{tr.common.likeLastTime}</span>
        <span className="flex h-11 flex-1 items-center justify-center rounded-full border-[1.5px] text-sm font-semibold whitespace-nowrap" style={{ borderColor: look.ink ?? 'rgba(255,240,220,0.5)' }}>
          {tr.mobile.typeAmounts}
        </span>
      </div>
      <div className="relative mt-2.5 flex h-[46px] items-center">
        {pile.slice(-5).map((b, i) => (
          <div key={b.id} className="absolute" style={{ left: i * 34, top: 5 + (i % 2) * 5, transform: `rotate(${(((i * 37) % 7) - 3) * 2}deg)`, zIndex: i }}>
            {billImg(b.value, denoms, 72)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneDock({ skins, w }: { skins: SkinSet; w: Wallet }) {
  return <TillDock skin={tillSkin(skins.till)} height={70} caption={tr.common.perMonth(money(spentThisMonth(w.receipts)))} />;
}

function PhonePig({ skins, w, scale }: { skins: SkinSet; w: Wallet; scale: number }) {
  return (
    <div className="origin-top-left" style={{ width: 232, height: 182, transform: `scale(${scale})` }}>
      <PigArt coins={piggyCoins(w)} bills={billsIn(w, { type: 'piggy' })} wear={skins} />
    </div>
  );
}

function PhonePreview({ skins, theme, part, w, denoms, page }: { skins: SkinSet; theme: Theme; part: PreviewPart; w: Wallet; denoms: Denoms; page: PageLook }) {
  const { cells, pile } = previewBills(w, denoms);
  const total = pileTotal(w) || pile.reduce((a, b) => a + b.value, 0);
  const cats = w.categories.map(({ id, name, budget, colSpan, rowSpan }) => ({ id, name, budget, colSpan, rowSpan }));
  const skin = boardSkin(skins.board).id;
  const board = <MiniBoard skin={skin} theme={theme} cells={cats} bills={cells} coins={w.coins.filter(c => c.location === 'cell')} show />;
  if (part === 'board') {
    return (
      <Scaled w={PHONE_W} h={PHONE_H.board} page={page}>
        {board}
      </Scaled>
    );
  }
  if (part === 'purse') {
    return (
      <Scaled w={PHONE_W} h={PHONE_H.purse} page={page}>
        <div className="p-2 pt-2.5">
          <PhonePlaque skins={skins} theme={theme} pile={pile} total={total} denoms={denoms} />
        </div>
      </Scaled>
    );
  }
  if (part === 'till') {
    return (
      <Scaled w={PHONE_W} h={PHONE_H.till} page={page}>
        <div className="p-3">
          <PhoneDock skins={skins} w={w} />
        </div>
      </Scaled>
    );
  }
  if (part === 'hat' || part === 'neck') {
    return (
      <Scaled w={PHONE_W} h={PHONE_H.hat} page={page}>
        <div className="flex h-full justify-center pt-1.5">
          <PhonePig skins={skins} w={w} scale={1} />
        </div>
      </Scaled>
    );
  }
  return (
    <Scaled w={PHONE_W} h={PHONE_H.pack} page={page}>
      <div className="flex h-[500px] flex-col gap-2.5 p-1">
        <PhonePlaque skins={skins} theme={theme} pile={pile} total={total} denoms={denoms} />
        <div className="min-h-0 flex-1 overflow-hidden rounded-[18px]">{board}</div>
        <div className="flex items-end gap-2.5">
          <div className="min-w-0 flex-1">
            <PhoneDock skins={skins} w={w} />
          </div>
          <div className="h-[70px] w-[90px] flex-none">
            <PhonePig skins={skins} w={w} scale={0.38} />
          </div>
        </div>
      </div>
    </Scaled>
  );
}

/** What a skin or a pack looks like on the wall, on the device this runs on. */
export function SkinPreview({ skins, part, pageId }: { skins: SkinSet; part: PreviewPart; pageId?: string }) {
  const [w, denoms, L, theme, worn] = useUnit([$wallet, $denoms, $layout, $theme, $skins]);
  const mobile = useMobile();
  // Whatever is on sale stands on the page you have now, unless the page itself is on sale.
  const page = pageSkin(pageId ?? worn.page).look[theme];
  if (mobile) return <PhonePreview skins={skins} theme={theme} part={part} w={w} denoms={denoms} page={page} />;
  const region = desktopRegion(part, L);
  return (
    <Scaled w={region.w} h={region.h} page={page}>
      <DesktopWall skins={skins} theme={theme} L={L} w={w} denoms={denoms} region={region} />
    </Scaled>
  );
}
