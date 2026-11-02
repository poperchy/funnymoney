'use client';

import { useUnit } from 'effector-react';
import { useEffect, useState } from 'react';
import { useFontsReady } from '@/lib/useFontsReady';
import { PIG_LINES } from '@/model/defaults';
import type { Coin } from '@/model/types';
import { $currency } from '@/model/wallet';
import { PigArt } from '@/components/mobile/parts';
import { usePig } from '@/components/mobile/pig';
import { play } from '@/sound/sfx';
import './live';
import { useInView } from './MiniBoard';
import { PigBubble } from './PigBubble';

/** The same lines the app says, in the moments it says them. */
const MOMENTS = [
  ['Пришла зарплата', 'Ого, богач! Ну давай раскладывать, пока не разлетелось'],
  ['Зарплата так себе', 'Ну… бывает. Зато раскладывать быстро'],
  ['Потратил на развлечения', 'Заслужил. Наверное'],
  ['В ячейке почти пусто', 'Осторожно, на донышке'],
  ['Деньги лежат без дела', 'Деньги без дела грустят. Разложи их'],
  ['Решил разбить копилку', 'Ты точно уверен, что хочешь забрать нажитое непосильным трудом?'],
];

const IDLE = ['Хрю. Я всё вижу, но никому не скажу', 'Кофе — это не еда. Я просто напоминаю', 'Без стыда за траты. Но я запомню', 'Хрю. Потыкай меня, не стесняйся'];
const FED = ['Хрю! Ещё!', 'Звенит. Люблю, когда звенит', 'Это всё? Я думала, ты богаче', 'Вот это по-нашему', 'На чёрный день. Или на розовый', 'Вкусно. Дальше'];

const START_COINS = 26;

/** The pig up close: it talks by itself, reacts to pokes and eats whatever you throw at it. */
export function PigShow() {
  const ready = useFontsReady();
  const cur = useUnit($currency);
  const { ref, inView } = useInView(0.3);
  const { ref: pigRef, jolt, poke } = usePig();
  const [line, setLine] = useState<{ text: string; key: number; moment?: number }>({ text: 'Хрю. Я тут главная по мелочи', key: 0 });
  const [count, setCount] = useState(START_COINS);
  const say = (text: string) => setLine(l => ({ text, key: l.key + 1 }));

  useEffect(() => {
    if (!inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Restarts on every line, so whatever was just asked for stays up long enough to read.
    const t = setTimeout(() => setLine(l => ({ text: IDLE[l.key % IDLE.length], key: l.key + 1 })), 4500);
    return () => clearTimeout(t);
  }, [inView, line.key]);

  const coins: Coin[] = Array.from({ length: Math.min(count, 160) }, (_, i) => ({ id: 'cpig' + i * 53, value: cur.coins[(i * 5) % cur.coins.length], location: 'piggy' }));

  const feed = () => {
    setCount(n => n + 1);
    say(FED[(count - START_COINS) % FED.length]);
    play('clink');
    play('oink', 0.35);
  };

  const ask = (moment: number) => {
    poke();
    setLine(l => ({ text: MOMENTS[moment][1], key: l.key + 1, moment }));
  };

  // Its two parts sit in the section's grid, next to the heading that the page renders on the server.
  return (
    <div className="contents">
      <div ref={ref} className="flex flex-col items-center gap-4 md:col-start-2 md:row-span-2 md:row-start-1">
        <div className="flex min-h-[86px] w-full max-w-[340px] items-end justify-center">
          <PigBubble line={line} tailRight={70} />
        </div>
        {ready && (
          <button onClick={() => { poke(); say(PIG_LINES[line.key % PIG_LINES.length]); }} aria-label="Потыкать свинку" className="relative h-[246px] w-[313px] cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">
            <div ref={pigRef} className="pointer-events-none absolute inset-0 origin-bottom">
              <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[1.35]">
                <PigArt coins={coins} bills={[]} jolt={jolt} />
              </div>
            </div>
          </button>
        )}
        <button onClick={feed} className="h-[52px] rounded-full bg-accent px-7 text-base font-semibold text-accent-ink shadow-[0_12px_26px_-14px_rgba(30,70,50,0.9)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
          Кинуть монетку
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 self-start md:col-start-1 md:row-start-2 md:items-start">
        <span className="text-sm font-semibold text-ink2">Что она скажет, если:</span>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          {MOMENTS.map(([when], i) => (
            <button
              key={when}
              onClick={() => ask(i)}
              aria-pressed={line.moment === i}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${line.moment === i ? 'bg-accent text-accent-ink' : 'bg-modal shadow-[0_0_0_1px_var(--line)] hover:bg-accent-wash'}`}
            >
              {when}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
