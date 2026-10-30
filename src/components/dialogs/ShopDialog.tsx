'use client';

import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { $ownedSkins, $shopOpen, $skins, shopToggled, skinSelected, skinUnlocked, type SkinKind } from '@/model/skins';
import { toastShown } from '@/model/ui';
import { BOARD_SKINS, PURSE_SKINS, type BoardSkin, type PurseSkin } from '@/scene/skins';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';

type Skin = (BoardSkin | PurseSkin) & { kind: SkinKind };

/** Thumbnail: a tiny board (frame + three cells) or a tiny wallet. */
function Preview({ skin }: { skin: Skin }) {
  if (skin.kind === 'board') {
    const look = (skin as BoardSkin).look.light;
    return (
      <span className="grid h-16 w-full grid-cols-3 gap-1 rounded-lg p-1.5" style={{ background: look.frame, boxShadow: `inset 0 0 0 4px ${look.inner}` }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="rounded-[3px]" style={{ background: skin.swatch }} />
        ))}
      </span>
    );
  }
  const look = (skin as PurseSkin).look.light;
  return (
    <span className="relative block h-16 w-full">
      <span className="absolute inset-x-2 top-2 bottom-2 rounded-xl" style={{ background: look.back }} />
      <span className="absolute inset-x-1 top-7 bottom-1 rounded-xl" style={{ background: skin.swatch, boxShadow: `inset 0 0 0 2px ${look.stitch}` }} />
    </span>
  );
}

/** Skins shop. Donations are a test flow for now: nothing is charged. */
export function ShopDialog() {
  const open = useUnit($shopOpen);
  return open ? <Shop /> : null;
}

function Shop() {
  const [selected, owned] = useUnit([$skins, $ownedSkins]);
  const [paying, setPaying] = useState<Skin | null>(null);
  const [state, setState] = useState<'ask' | 'processing'>('ask');
  const close = () => shopToggled(false);

  const pick = (s: Skin) => {
    skinSelected({ kind: s.kind, id: s.id });
    play('rustle');
  };

  const donate = () => {
    if (!paying) return;
    setState('processing');
    // Pretend to talk to a payment provider.
    setTimeout(() => {
      skinUnlocked(paying.id);
      skinSelected({ kind: paying.kind, id: paying.id });
      play('till');
      toastShown(`Спасибо! «${paying.name}» теперь твой. Я в восторге, хрю`);
      setPaying(null);
      setState('ask');
    }, 1200);
  };

  if (paying) {
    return (
      <Modal open onClose={() => state === 'ask' && setPaying(null)} title="Донат" width={440} className="items-center text-center">
        <span className="rounded-full bg-[rgba(224,115,94,0.14)] px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-danger uppercase">Тестовый режим</span>
        <div className="w-40">
          <Preview skin={paying} />
        </div>
        <span className="text-[26px] leading-tight font-bold tracking-[-0.025em]">«{paying.name}» за {paying.price} ₽</span>
        <span className="text-[15px] leading-normal text-balance text-ink2">
          Оплата пока понарошку: ничего не спишется, скин просто откроется. Когда донаты станут настоящими, тут будет нормальная касса.
        </span>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button variant="outline" size="lg" disabled={state === 'processing'} onClick={() => setPaying(null)}>
            Передумал
          </Button>
          <Button variant="primary" size="lg" disabled={state === 'processing'} onClick={donate}>
            {state === 'processing' ? (
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }}>
                Проводим…
              </motion.span>
            ) : (
              `Задонатить ${paying.price} ₽`
            )}
          </Button>
        </div>
      </Modal>
    );
  }

  const section = (title: string, list: Skin[]) => (
    <section className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold text-ink2">{title}</span>
      <div className="grid grid-cols-3 gap-2.5">
        {list.map(s => {
          const isOwned = owned.includes(s.id), isOn = selected[s.kind] === s.id;
          return (
            <div key={s.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-2.5 ${isOn ? 'border-accent bg-accent-wash' : 'border-line'}`}>
              <Preview skin={s} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{s.name}</span>
                <span className="min-h-[34px] text-xs leading-snug text-ink2">{s.blurb}</span>
              </div>
              {isOn ? (
                <span className="flex h-9 items-center justify-center text-sm font-semibold text-accent">✓ Выбран</span>
              ) : isOwned ? (
                <Button variant="secondary" className="!h-9 border border-line" onClick={() => pick(s)}>
                  Выбрать
                </Button>
              ) : (
                <Button variant="primary" className="!h-9 !px-3" onClick={() => setPaying(s)}>
                  ♥ {s.price} ₽
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <Modal open onClose={close} title="Скины" width={640}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[26px] font-bold tracking-[-0.025em]">Скины</span>
          <span className="text-sm text-ink2">Денег от этого больше не станет, но лежать они будут красивее. Донат помогает проекту жить.</span>
        </div>
        <button onClick={close} aria-label="Закрыть" className="h-11 w-11 shrink-0 rounded-full bg-btn2 text-base">
          ✕
        </button>
      </div>
      {section('Доска', BOARD_SKINS.map(s => ({ ...s, kind: 'board' as const })))}
      {section('Кошелёк', PURSE_SKINS.map(s => ({ ...s, kind: 'purse' as const })))}
    </Modal>
  );
}
