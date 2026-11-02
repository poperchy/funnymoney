'use client';

import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { $ownedSkins, $shopOpen, $skins, shopToggled, skinSelected, skinsSelected, skinsUnlocked, skinUnlocked, type SkinKind } from '@/model/skins';
import { toastShown } from '@/model/ui';
import { BOARD_SKINS, HAT_SKINS, NECK_SKINS, PAGE_SKINS, packPrice, packSkinIds, PURSE_SKINS, SKIN_PACKS, TILL_SKINS, type BoardSkin, type PageSkin, type PigWear, type PurseSkin, type TillSkin } from '@/scene/skins';
import { SkinPicture } from '@/components/shop/SkinPicture';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';

type Skin = (BoardSkin | PurseSkin | PigWear | TillSkin | PageSkin) & { kind: SkinKind };
/** What is being paid for: one skin or a whole pack. */
type Offer = { name: string; price: number; preview: ReactNode; thanks: string; apply: () => void };

type Tab = 'packs' | 'board' | 'purse' | 'till' | 'pig' | 'page';
const TABS: { id: Tab; label: string }[] = [
  { id: 'packs', label: 'Паки' },
  { id: 'board', label: 'Доски' },
  { id: 'purse', label: 'Кошельки' },
  { id: 'till', label: 'Кассы' },
  { id: 'pig', label: 'Свинка' },
  { id: 'page', label: 'Фон' },
];

/** Skins shop. Donations are a test flow for now: nothing is charged. */
export function ShopDialog() {
  const open = useUnit($shopOpen);
  return open ? <Shop /> : null;
}

function Shop() {
  const [selected, owned] = useUnit([$skins, $ownedSkins]);
  const [paying, setPaying] = useState<Offer | null>(null);
  const [state, setState] = useState<'ask' | 'processing'>('ask');
  const [tab, setTab] = useState<Tab>('packs');
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
      paying.apply();
      play('till');
      toastShown(paying.thanks);
      setPaying(null);
      setState('ask');
    }, 1200);
  };

  if (paying) {
    return (
      <Modal open onClose={() => state === 'ask' && setPaying(null)} title="Донат" width={440} className="items-center text-center">
        <span className="rounded-full bg-[rgba(224,115,94,0.14)] px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-danger uppercase">Тестовый режим</span>
        <div className="w-full">{paying.preview}</div>
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
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {list.map(s => {
          const isOwned = s.price === 0 || owned.includes(s.id), isOn = selected[s.kind] === s.id;
          return (
            <div key={s.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-2.5 ${isOn ? 'border-accent bg-accent-wash' : 'border-line'}`}>
              <SkinPicture part={s.kind} id={s.id} />
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
                <Button
                  variant="primary"
                  className="!h-9 !px-3"
                  onClick={() =>
                    setPaying({
                      name: s.name,
                      price: s.price,
                      preview: <SkinPicture part={s.kind} id={s.id} />,
                      thanks: `Спасибо! «${s.name}» теперь твой. Я в восторге, хрю`,
                      apply: () => {
                        skinUnlocked(s.id);
                        skinSelected({ kind: s.kind, id: s.id });
                      },
                    })
                  }
                >
                  ♥ {s.price} ₽
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  const packs = (
    <section className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold text-ink2">Паки: всё сразу и почти на треть дешевле</span>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SKIN_PACKS.map(p => {
          const { full, price } = packPrice(p, owned);
          const isOn = (['board', 'purse', 'till', 'hat', 'neck'] as const).every(k => selected[k] === p.skins[k]);
          return (
            <div key={p.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-2.5 ${isOn ? 'border-accent bg-accent-wash' : 'border-line'}`}>
              <SkinPicture part="pack" id={p.id} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{p.name}</span>
                <span className="min-h-[34px] text-xs leading-snug text-ink2">{p.blurb}</span>
              </div>
              {isOn ? (
                <span className="flex h-9 items-center justify-center text-sm font-semibold text-accent">✓ Надет</span>
              ) : !price ? (
                <Button
                  variant="secondary"
                  className="!h-9 border border-line"
                  onClick={() => {
                    skinsSelected(p.skins);
                    play('rustle');
                  }}
                >
                  Надеть
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="!h-9 !px-3"
                  title={`По отдельности ${full} ₽`}
                  onClick={() =>
                    setPaying({
                      name: p.name,
                      price,
                      preview: <SkinPicture part="pack" id={p.id} />,
                      thanks: `Спасибо! Пак «${p.name}» твой, я уже переоделась. Хрю`,
                      apply: () => {
                        skinsUnlocked(packSkinIds(p));
                        skinsSelected(p.skins);
                      },
                    })
                  }
                >
                  ♥ {price} ₽ <span className="font-normal line-through opacity-60">{full}</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <Modal open onClose={close} title="Скины" width={760} className="!pt-0">
      {/* Stays on top while the goods scroll: the tabs and the way out. */}
      <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-3 bg-modal px-5 pt-5 pb-3 sm:-mx-7 sm:px-7 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[26px] font-bold tracking-[-0.025em]">Скины</span>
            <span className="text-sm text-ink2">Денег от этого больше не станет, но лежать они будут красивее. Донат помогает проекту жить.</span>
          </div>
          <button onClick={close} aria-label="Закрыть" className="h-11 w-11 shrink-0 rounded-full bg-btn2 text-base">
            ✕
          </button>
        </div>
        <div role="tablist" aria-label="Что смотрим" className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 flex-none rounded-full px-4 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-accent text-accent-ink' : 'border border-line text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'packs' && packs}
      {tab === 'board' && section('Вся доска целиком', BOARD_SKINS.map(s => ({ ...s, kind: 'board' as const })))}
      {tab === 'purse' && section('Кошелёк под доской', PURSE_SKINS.map(s => ({ ...s, kind: 'purse' as const })))}
      {tab === 'till' && section('Сюда улетают деньги', TILL_SKINS.map(s => ({ ...s, kind: 'till' as const })))}
      {tab === 'pig' && section('На голову', HAT_SKINS.map(s => ({ ...s, kind: 'hat' as const })))}
      {tab === 'pig' && section('На шею', NECK_SKINS.map(s => ({ ...s, kind: 'neck' as const })))}
      {tab === 'page' && section('Фон за стеной. В паки не входит, это по желанию', PAGE_SKINS.map(s => ({ ...s, kind: 'page' as const })))}
    </Modal>
  );
}
