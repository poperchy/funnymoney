import { LiveWall, PigShow, StartLink, WallSkins } from '@/components/landing/islands';
import { BILL_PAL } from '@/scene/palette';

/** Falling behind the last call: position, spin, how long and how late, all fixed so the page prerenders the same. */
const RAIN = Array.from({ length: 12 }, (_, n) => ({
  v: [5, 10, 20, 50, 100, 200][n % 6],
  i: n % 6,
  left: (n * 37 + 4) % 96,
  spin: ((n * 53) % 60) - 30,
  time: 7 + ((n * 13) % 7),
  delay: -((n * 29) % 13),
}));

function CssBill({ v, i }: { v: number; i: number }) {
  const [p0, p1] = BILL_PAL[i];
  return (
    <div
      className="relative h-[60px] w-[120px] overflow-hidden rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.22),0_14px_22px_-8px_rgba(40,20,0,0.45)]"
      style={{ background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 6px), linear-gradient(135deg, ${p0}, ${p1})` }}
    >
      <div className="absolute inset-[3px] rounded-[3px] border border-white/50" />
      <div className="absolute top-2 left-2 h-10 w-10 rounded-full border-[1.5px] border-white/75 bg-white/30" />
      <div className="absolute right-2 bottom-0.5 text-2xl font-bold tracking-[-0.03em] text-white">{v}</div>
    </div>
  );
}

const POINTS = [
  ['Зарплата приходит пачкой', 'Набираешь сумму кликами по купюрам, пачка толстеет. Рука разжимается, деньги падают на стол. Самый приятный клик в месяце.'],
  ['Раскладываешь по ячейкам', 'Еда, аренда, котик, подушка. Сразу видно, где пачка толстая, а где уже на донышке.'],
  ['Тратишь, и пачка худеет', 'Вписал сумму, купюра улетела в «Потрачено», сдача вернулась, мелочь в кошельке. Цифру так не жалко, а её — жалко.'],
];

const CTA = 'inline-flex h-[58px] items-center rounded-full bg-accent px-8 text-[17px] font-semibold text-accent-ink shadow-[0_14px_30px_-14px_rgba(30,70,50,0.95)] transition-transform hover:-translate-y-0.5';

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative px-4 pt-6 pb-16 md:pb-24" style={{ background: 'radial-gradient(ellipse 1100px 640px at 30% 0%, var(--spot), transparent 70%), var(--page)' }}>
        <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between">
          <span className="text-xl font-bold tracking-[-0.02em]">наличка</span>
          <StartLink className="text-[15px] font-semibold text-accent underline-offset-4 hover:underline" label="Начать →" back="Моя стена →" />
        </header>

        <div className="relative z-10 mx-auto mt-10 grid max-w-[1180px] items-center gap-12 md:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h1 className="m-0 text-[52px] leading-[0.98] font-bold tracking-[-0.045em] text-balance md:text-[76px] lg:text-[64px] xl:text-[76px]">Деньги, которые видно</h1>
            <p className="m-0 max-w-[520px] text-lg leading-normal text-balance text-ink2 md:text-xl">
              Цифра в приложении не ощущается. А пачка купюр, которая худеет на глазах, очень даже. Зарплата висит на стене наличными, а свинка всё комментирует.
            </p>
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <StartLink className={CTA} />
              <span className="text-sm text-ink2">Без регистрации и банков. Всё хранится у тебя в браузере.</span>
            </div>
          </div>
          <LiveWall />
        </div>
      </section>

      <section className="wood px-4 py-10 md:py-12">
        <div className="mx-auto grid max-w-[1100px] gap-5 md:grid-cols-3">
          {POINTS.map(([t, d], i) => (
            <div key={t} className="relative rounded-[4px] bg-tag p-6 pt-7 text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_10px_18px_-8px_rgba(0,0,0,0.45)]" style={{ transform: `rotate(${(i - 1) * 0.8}deg)` }}>
              <span className="absolute top-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #ff8a6a, #b8321b)' }} />
              <div className="mb-2 text-xl font-bold tracking-[-0.02em]">{t}</div>
              <p className="m-0 text-[15px] leading-normal opacity-80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mb-8 flex flex-col gap-3 px-4 text-center">
          <h2 className="m-0 text-4xl leading-[1.05] font-bold tracking-[-0.035em] text-balance md:text-[56px]">Вот такая стена</h2>
          <p className="m-0 mx-auto max-w-[600px] text-lg leading-normal text-balance text-ink2">Девять ячеек для старта. Переименуй, поменяй размер, добавь свои. А стену, кошелёк и свинку переодень: шляпа, цепь, всё как у людей.</p>
        </div>
        <WallSkins />
      </section>

      <section className="bg-panel px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)] items-center gap-x-16 gap-y-8 md:grid-cols-2">
          <div className="flex flex-col gap-3 text-center md:self-end md:text-left">
            <h2 className="m-0 text-4xl leading-[1.05] font-bold tracking-[-0.035em] text-balance md:text-[56px]">Свинка всё видит</h2>
            <p className="m-0 mx-auto max-w-[560px] text-lg leading-normal text-balance text-ink2 md:mx-0">Копилка «Нужная мусорка». Добрая, но с комментариями. Чтобы забрать деньги, придётся её разбить и посмотреть в глаза.</p>
          </div>
          <PigShow />
        </div>
      </section>

      <section className="relative flex min-h-[520px] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-20 text-center text-[#f6efe3]" style={{ background: 'var(--till)' }}>
        {RAIN.map((b, n) => (
          <div key={n} aria-hidden className="rain-bill absolute -top-[90px]" style={{ left: `${b.left}%`, '--r': `${b.spin}deg`, animationDuration: `${b.time}s`, animationDelay: `${b.delay}s` } as React.CSSProperties}>
            <CssBill v={b.v} i={b.i} />
          </div>
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse min(92vw, 820px) 340px at 50% 50%, rgba(25,18,12,0.96) 55%, transparent 100%)' }} />
        <h2 className="relative m-0 max-w-[760px] text-[44px] leading-[1.02] font-bold tracking-[-0.04em] text-balance md:text-[68px]">Пока ты читал, деньги разлетелись</h2>
        <p className="relative m-0 max-w-[480px] text-lg leading-normal text-balance text-[rgba(246,239,227,0.75)]">Поймай их и разложи. Минута, и ты впервые видишь свою зарплату целиком.</p>
        <StartLink className={`relative ${CTA}`} label="Поймать и разложить →" back="Вернуться к своей стене →" />
      </section>

      <footer className="px-4 py-10 text-center text-sm text-ink2">Добрый учёт денег без стыда за траты. Ну почти.</footer>
    </main>
  );
}
