'use client';

import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { $welcomeSeen, welcomeClosed } from '@/model/ui';
import { $currency } from '@/model/wallet';
import { BillImg } from '@/components/money/BillImg';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';

const POINTS = [
  ['Зарплата приходит пачкой', 'Кликаешь по купюрам — пачка толстеет. Самый приятный клик в жизни. После «Отменить подписку», конечно.'],
  ['Раскладываешь по ячейкам', 'Еда, аренда, котик. Котику побольше — он проверит.'],
  ['Тратишь — вытаскиваешь', 'Купюру в кассу, сдачу обратно, мелочь в свинку. Свинка всё видит, но молчит. Пока.'],
];

const PROMISES = [
  ['Не буду врать стене, что кофе — это «еда»', 'Стена тебе верит. Не подведи'],
  ['Не буду плакать над пустой ячейкой', 'Можно чуть-чуть. Мы отвернёмся'],
];

/** What bills say when you poke them. */
const QUIPS = ['Эй, не мни!', 'Пересчитай меня', 'Я не на кофе. Я на мечту', 'Щекотно', 'Положи где взял', 'Меня печатали не для этого', 'Ещё раз — и уйду в «Потрачено»'];

const GREETINGS = [
  'С возвращением! Купюры на месте, я пересчитал. Дважды',
  'О, привет. Деньги никуда не убежали. Пока',
  'Стена скучала. Свинка тоже, но она гордая и не скажет',
  'Заходи, не стесняйся. Ничего не тратили, пока тебя не было. Честно',
  'Снова ты! Купюры приосанились',
  'Привет! Пока тебя не было, сотня пыталась сбежать в «Кафе». Поймали',
];
export const greeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

/** First visit: what this is, in a few jokes and a contract nobody has to sign. */
export function WelcomeDialog() {
  const seen = useUnit($welcomeSeen);
  const [promised, setPromised] = useState<boolean[]>(PROMISES.map(() => false));
  if (seen) return null;
  const all = promised.every(Boolean), none = promised.every(p => !p);
  const close = () => {
    welcomeClosed();
    play('rustle');
  };

  return (
    <Modal open onClose={close} title="Привет" width={560}>
      <WelcomeBills />
      <div className="flex flex-col gap-2 text-center">
        <span className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em] text-balance">Привет! Теперь твои деньги висят на стене</span>
        <span className="text-[15px] leading-normal text-balance text-ink2">
          Как бабушкина заначка в серванте, только с анимацией и без нафталина. Цифры не чувствуются — а вот худеющая пачка очень даже.
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {POINTS.map(([t, d], i) => (
          <div key={t} className="flex gap-3.5 rounded-2xl bg-field px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">{i + 1}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{t}</span>
              <span className="text-sm leading-snug text-ink2">{d}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line px-4 py-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-ink2 uppercase">Договор, который ни к чему не обязывает</span>
        {PROMISES.map(([text, reply], i) => (
          <label key={text} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={promised[i]}
              onChange={() => {
                setPromised(p => p.map((v, j) => (j === i ? !v : v)));
                play('rustle');
              }}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span className="flex flex-col">
              <span className="font-medium">{text}</span>
              <AnimatePresence>
                {promised[i] && (
                  <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[13px] text-ink2">
                    {reply}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button variant="primary" size="lg" className="!px-8" onClick={close}>
          {all ? 'Погнали, я готов' : none ? 'Погнали без обещаний' : 'Погнали, пообещал наполовину'}
        </Button>
        <span className="text-center text-[12px] leading-snug text-ink2">
          Регистрации нет. Всё живёт в твоём браузере — мы не знаем, сколько ты тратишь на кофе. И знать не хотим. Ладно, немного хотим.
        </span>
      </div>
    </Modal>
  );
}

/** A fan of the current currency's bills. Poke one — it talks back. */
function WelcomeBills() {
  const cur = useUnit($currency);
  const fan = [cur.bills[1], cur.bills[3], cur.bills[5]];
  // Each poke takes the next line, so they never repeat back to back.
  const [poked, setPoked] = useState<{ i: number; n: number } | null>(null);
  const quip = poked && { text: QUIPS[(poked.n - 1) % QUIPS.length], i: poked.i, key: poked.n };
  const wiggle = poked && { i: poked.i, key: poked.n };

  const poke = (i: number) => {
    setPoked(p => ({ i, n: (p?.n ?? 0) + 1 }));
    play('rustle');
  };

  return (
    <div className="relative mx-auto mt-6 h-[86px] w-[240px]">
      <AnimatePresence>
        {quip && (
          <motion.div
            key={quip.key}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute -top-9 z-10 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold whitespace-nowrap text-page shadow-md"
            style={{ left: 120 + (quip.i - 1) * 50, translateX: '-50%' }}
          >
            {quip.text}
          </motion.div>
        )}
      </AnimatePresence>
      {fan.map((v, i) => (
        <motion.button
          key={v}
          onClick={() => poke(i)}
          aria-label={`Потыкать купюру ${i + 1}`}
          className="absolute top-3 left-[70px] cursor-pointer"
          initial={{ rotate: 0, y: 20, opacity: 0 }}
          animate={{
            rotate: wiggle?.i === i ? [(i - 1) * 14, (i - 1) * 14 - 10, (i - 1) * 14 + 8, (i - 1) * 14] : (i - 1) * 14,
            x: (i - 1) * 46,
            y: wiggle?.i === i ? [Math.abs(i - 1) * 6, -14, Math.abs(i - 1) * 6] : Math.abs(i - 1) * 6,
            opacity: 1,
          }}
          transition={wiggle?.i === i ? { duration: 0.45 } : { delay: 0.15 + i * 0.08, type: 'spring', stiffness: 260, damping: 16 }}
          whileHover={{ y: -6 }}
        >
          <BillImg key={wiggle?.i === i ? wiggle.key : 0} value={v} />
        </motion.button>
      ))}
    </div>
  );
}
