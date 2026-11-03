import { LanguageLink, LiveWall, PigShow, StartLink, WallSkins } from '@/components/landing/islands';
import { dictionaries, LOCALES, type Locale } from '@/lib/i18n';
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

const CTA = 'inline-flex h-[58px] items-center rounded-full bg-accent px-8 text-[17px] font-semibold text-accent-ink shadow-[0_14px_30px_-14px_rgba(30,70,50,0.95)] transition-transform hover:-translate-y-0.5';

/** The landing page. Its text is rendered on the server for search engines, so it takes the language from the route and not from `tr`. */
export function Landing({ lang }: { lang: Locale }) {
  const d = dictionaries[lang];
  const t = d.landing;
  const other = LOCALES.find(l => l !== lang)!;
  return (
    <main className="overflow-hidden">
      <section className="relative px-4 pt-6 pb-16 md:pb-24" style={{ background: 'radial-gradient(ellipse 1100px 640px at 30% 0%, var(--spot), transparent 70%), var(--page)' }}>
        <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <span className="text-xl font-bold tracking-[-0.02em]">{d.brand}</span>
          <div className="flex items-center gap-5">
            <LanguageLink to={other} className="text-[15px] font-medium text-ink2 underline-offset-4 hover:underline">
              {d.language.names[other]}
            </LanguageLink>
            <StartLink className="text-[15px] font-semibold text-accent underline-offset-4 hover:underline" label={t.start} back={t.myWall} />
          </div>
        </header>

        <div className="relative z-10 mx-auto mt-10 grid max-w-[1180px] items-center gap-12 md:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h1 className="m-0 text-[52px] leading-[0.98] font-bold tracking-[-0.045em] text-balance md:text-[76px] lg:text-[64px] xl:text-[76px]">{t.h1}</h1>
            <p className="m-0 max-w-[520px] text-lg leading-normal text-balance text-ink2 md:text-xl">{t.lead}</p>
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <StartLink className={CTA} label={t.hang} back={t.backToWall} />
              <span className="text-sm text-ink2">{t.noSignup}</span>
            </div>
          </div>
          <LiveWall />
        </div>
      </section>

      <section className="wood px-4 py-10 md:py-12">
        <div className="mx-auto grid max-w-[1100px] gap-5 md:grid-cols-3">
          {t.points.map(([title, text], i) => (
            <div key={title} className="relative rounded-[4px] bg-tag p-6 pt-7 text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_10px_18px_-8px_rgba(0,0,0,0.45)]" style={{ transform: `rotate(${(i - 1) * 0.8}deg)` }}>
              <span className="absolute top-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #ff8a6a, #b8321b)' }} />
              <div className="mb-2 text-xl font-bold tracking-[-0.02em]">{title}</div>
              <p className="m-0 text-[15px] leading-normal opacity-80">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mb-8 flex flex-col gap-3 px-4 text-center">
          <h2 className="m-0 text-4xl leading-[1.05] font-bold tracking-[-0.035em] text-balance md:text-[56px]">{t.wallTitle}</h2>
          <p className="m-0 mx-auto max-w-[600px] text-lg leading-normal text-balance text-ink2">{t.wallText}</p>
        </div>
        <WallSkins />
      </section>

      <section className="bg-panel px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)] items-center gap-x-16 gap-y-8 md:grid-cols-2">
          <div className="flex flex-col gap-3 text-center md:self-end md:text-left">
            <h2 className="m-0 text-4xl leading-[1.05] font-bold tracking-[-0.035em] text-balance md:text-[56px]">{t.pigTitle}</h2>
            <p className="m-0 mx-auto max-w-[560px] text-lg leading-normal text-balance text-ink2 md:mx-0">{t.pigText}</p>
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
        <h2 className="relative m-0 max-w-[760px] text-[44px] leading-[1.02] font-bold tracking-[-0.04em] text-balance md:text-[68px]">{t.lastTitle}</h2>
        <p className="relative m-0 max-w-[480px] text-lg leading-normal text-balance text-[rgba(246,239,227,0.75)]">{t.lastText}</p>
        <StartLink className={`relative ${CTA}`} label={t.catchThem} back={t.backToWall} />
      </section>

      <footer className="px-4 py-10 text-center text-sm text-ink2">{t.footer}</footer>
    </main>
  );
}
