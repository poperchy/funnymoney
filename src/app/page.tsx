import { pageHref } from '@/lib/paths';
import { BILL_PAL } from '@/scene/palette';

const FLOAT = [
  { v: 200, i: 5, x: 8, y: 18, r: -14 },
  { v: 50, i: 3, x: 74, y: 10, r: 11 },
  { v: 20, i: 2, x: 84, y: 62, r: -8 },
  { v: 100, i: 4, x: 4, y: 66, r: 9 },
  { v: 10, i: 1, x: 62, y: 80, r: -18 },
];

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
  ['Зарплата — пачкой', 'Набираешь сумму кликами по купюрам. Рука разжимается, деньги падают на стол.'],
  ['Раскладываешь по ячейкам', 'Еда, аренда, кафе, подушка. Видно, где пачка толстая, а где уже на донышке.'],
  ['Тратишь — вытаскиваешь', 'Бросаешь купюру в «Потрачено», отмечаешь сдачу. Мелочь падает в свинку.'],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section
        className="relative flex min-h-[86vh] flex-col items-center justify-center gap-7 px-4 py-24 text-center"
        style={{ background: 'radial-gradient(ellipse 900px 560px at 50% 0%, var(--spot), transparent 70%), var(--page)' }}
      >
        <span className="absolute top-6 left-7 text-lg font-bold tracking-[-0.02em]">наличка</span>
        {FLOAT.map(b => (
          <div key={b.v} aria-hidden className="absolute hidden md:block" style={{ left: `${b.x}%`, top: `${b.y}%`, transform: `rotate(${b.r}deg)` }}>
            <CssBill v={b.v} i={b.i} />
          </div>
        ))}
        <h1 className="m-0 max-w-[820px] text-5xl leading-[1.02] font-bold tracking-[-0.04em] text-balance md:text-7xl">
          Деньги, которые видно
        </h1>
        <p className="m-0 max-w-[560px] text-lg leading-normal text-balance text-ink2 md:text-xl">
          Цифра в приложении не ощущается. А пачка купюр, которая худеет на глазах, — очень даже. Учёт финансов, где зарплата лежит на стене наличными.
        </p>
        <a
          href={pageHref('/app/')}
          className="inline-flex h-[54px] items-center rounded-full bg-accent px-[30px] text-[17px] font-semibold text-accent-ink shadow-[0_12px_26px_-14px_rgba(30,70,50,0.9)] transition-transform hover:-translate-y-0.5"
        >
          Повесить зарплату на стену →
        </a>
        <span className="text-sm text-ink2">Без регистрации. Всё хранится у тебя в браузере.</span>
      </section>

      <section className="wood px-4 py-16">
        <div className="mx-auto grid max-w-[1100px] gap-5 md:grid-cols-3">
          {POINTS.map(([t, d], i) => (
            <div key={t} className="rounded-[4px] bg-tag p-6 text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_10px_18px_-8px_rgba(0,0,0,0.45)]" style={{ transform: `rotate(${(i - 1) * 0.8}deg)` }}>
              <div className="mb-2 text-xl font-bold tracking-[-0.02em]">{t}</div>
              <p className="m-0 text-[15px] leading-normal opacity-80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 py-10 text-center text-sm text-ink2">Добрый учёт денег без стыда за траты. Ну почти.</footer>
    </main>
  );
}
