potato is a daily change feed for production sites: every morning it diffs a site against yesterday and names what changed — the file, the bytes, the pages it touched. The brand is a calm, near-white page with one violet-to-pink gradient, set entirely in Instrument Sans. It should read like a well-kept engineering notebook that happens to be pretty.

## Content fundamentals

- **Plain, specific, a little dry.** Name the thing: “app.js 142 → 389 KB”, “a 90 KB tracking script marketing added on a Thursday”. Numbers carry units and come from somewhere (“mock data · 500 storefronts · Aug 20 – Sep 19, 2026”).
- **Sentence case everywhere** — headlines, buttons, nav, labels, chips (“Check a site”, “Priced per site, not per seat”, “On this page”). No UPPERCASE and no letter-spaced labels anywhere.
- **No eyebrows.** Nothing sits above a headline: no pill, no kicker, no small label, no “NEW ·” tag. Heroes and every block open with the headline itself.
- **We / you.** “We diff your pages”, “You get sentences”. No exclamation marks, no emoji, no hype words. A dash of wit is allowed where it costs nothing: “This page moved, or never shipped. Either way it loaded fast.”
- **Buttons are verbs** with an arrow when they navigate: “Check a site free →”, “See agency pricing →”, “Apply →”. Done states end in ✓: “Subscribed ✓”, “Registered ✓”, “Copied ✓”.
- **Headlines are claims, ledes are one sentence** (two at most). Card descriptions are one sentence. Stat notes are lowercase fragments: “got slower in 30 days”.
- The wordmark is always lowercase **potato**. Mock people are “Mock Name” until real quotes exist.

## Visual foundations

**Colour.** The page is `surface` (#fcfcfd); cards are `surface-raised` with a `line` hairline, never a heavy border. Text steps down a warm-grey ink ramp: `ink` for headings and UI, `ink-body` for long reading, `ink-secondary` for leads and descriptions, `ink-nav` for navigation, `ink-muted` and `ink-faint` for metadata only. The one brand colour is the violet `accent` (#6b5ef0); it appears as text in step numbers, check marks and accent labels, and as fill only through gradients.

**Gradients** are the signature and all of them are composed from tokens in `bundle.css`:
- `--grad-primary` (`accent` → `accent-2`, 135°) — the primary button, badge, FAQ open state, switch.
- `--grad-signature` (`accent` → `orchid` → `pink`, 100°) — one highlighted phrase in a hero headline, the 404 numeral.
- `--grad-logo` (`violet-light` → `pink`) — the logo disc only.
- `--grad-dot-1…4` — 34px feature discs, step numbers, avatars, timeline dots, mega-menu squares, always cycled in this order.
- `--grad-tile-1…4` (violet, pink, sky, mint tints) — stat tiles, slider and event heads, gallery tiles, cycled in this order.
- `--grad-media`, `--grad-quote`, `--grad-news`, `--grad-spot`, `--grad-tier` — the named grounds of placeholders, pull quotes, the newsletter, the testimonial and the featured tier.
- Behind heroes and the CTA banner float two blurred blobs (`blob-violet`, `blob-pink`, `blur-blob`), animated slowly (18s / 22s) and frozen under reduced motion.

**Status.** `danger` marks regressions, `success` improvements; both are always paired with the word or the signed number (“LCP +1.3s”, “−87 KB”, “Yes”) because they differ by hue more than lightness. Category chips have fixed tones: Benchmark `accent`, Comparison `cat-comparison`, By role `cat-role`, Engineering `success`.

**Type.** One family, shipped as a file:
- **Instrument Sans** (`sans`) for everything — headlines, text, labels, numbers. Headings are weight 600 with tight negative tracking that grows with size (−0.015em at 19px to −0.045em at 52–60px) and `text-wrap: balance`. Body is 400; UI labels and buttons 500.
- Small labels are `label` (13px, 500, `ink-muted`) and `chip` (12px, 500) — sentence case, no tracking. Dates and numbers use `meta-small` and `numeric` with tabular figures (`.pt-root` turns them on).
- **No monospace in the interface.** The only exception is real code — code blocks and inline `code` — which use the system monospace stack (`code` family, no web font). Never set labels, dates, numbers, file names in UI copy, placeholders or captions in monospace.
- Use the styles by name: `display-xl` (hero), `display-lg` (split hero), `display-md` (page titles, CTA), `section`, `block` for landing headlines; `h1`–`h6`, `lead`, `body`, `pull-quote`, `small` inside articles; `card-title`, `body-ui`, `ui`, `meta`, `label`, `chip` in components.
- One breakpoint at 768px. Below it headings shrink (H1 52 → 34, H2 28 → 24), body barely moves (18 → 17), side padding goes 28 → 20px.
- The shipped font file covers Latin only. Instrument Sans has no Cyrillic at all; for Russian copy pick a fallback deliberately before launch.

**Layout.** Content sits in a 1140px `container` with a 28px gutter; articles and the typography page use the 720px `measure` (65–75 characters), with a 190px sticky TOC beside it from 1240px. Landing blocks are separated by 88px (`space-88`); a block's headline sits 24–28px above its content. Grids use 20px gaps (14–18px for dense tiles). Tables and code scroll inside their box; the page never scrolls sideways. Tap targets in lists and the TOC are at least 44px tall on mobile.

**Shape.** Everything interactive is a pill (`radius-pill`). Containers get larger radii as they get larger: inputs `radius-lg` 12, code and callouts `radius-2xl` 16, tables and tiles `radius-3xl` 18, cards `radius-card` 20, tiers and panels `radius-panel` 22, heroes and bento `radius-hero` 24, the phone frame `radius-device` 32.

**Depth.** Shadows are rare and violet, long and soft, with a strong negative spread so they read as a glow under the card rather than an outline: `shadow-pill` for the active segment, `shadow-card` for the in-article CTA, `shadow-feature` for the highlighted tier and the mega menu, `shadow-float` for the code window and video. Only overlays (cookie banner, lightbox) use the ink-coloured `shadow-overlay`. The sticky header is translucent (`surface-translucent`) behind `blur-header`.

**Motion.** Little and slow: blob drift, a 0.45s slider ease (`cubic-bezier(.22,.8,.3,1)`), 0.2s icon rotation in the FAQ, 0.3s dot widening. A 3px reading-progress bar in `--grad-progress` tops every article.

**Imagery.** Product screenshots and charts only, on rounded media frames. Until they exist, use `MediaPlaceholder` — a dashed frame on a tint with a small caption saying exactly what belongs there. No stock photos, no illustrations, no icons-as-decoration.

**States.** Hover darkens links to `accent-deep`. Keyboard focus is `--focus-ring`: a 2px `surface` gap and a 2px `accent` ring (4.6:1 on `surface`). Selected segments are white pills on a `fill-subtle` track; selected filters are filled `surface-inverse`. Disabled controls drop to 35% opacity.

**Contrast notes.** `ink-muted` (3.4:1), `ink-faint` (2.6:1), `ink-disabled` (2.0:1), `success` (3.4:1), `cat-role` (3.6:1) and `danger` (4.2:1) are below 4.5:1 on `surface` and are kept exactly as the source uses them. Use them for metadata, decoration or beside a word that carries the meaning; when text must pass AA, step up to `ink-nav` or `ink-secondary`.

## Iconography

There is no icon set. The interface uses a handful of typographic glyphs — `→ ← ✕ ✓ ▾ ▶ ❚❚ ★ + · /` — set in the surrounding font and coloured by context (`accent` check marks, `star` stars). Category and feature identity comes from gradient discs and squares (`--grad-dot-N`), not pictograms. Emoji are never used. If a real icon set is introduced later, add it as an asset group and note it here.

## The logo

The mark is a 20px disc in `--grad-logo` next to the wordmark “potato” in Instrument Sans 600, 17px, −0.02em; sub-sites append a small `/ writing` or `/ blocks` in `ink-muted`. There is no image file in the sources — use the `Logo` component, never redraw it.

## Block library

Every landing block maps to one Filament builder block and one Blade component under the same key, and to one component here:

| key | component | key | component |
|---|---|---|---|
| `banner.announce` | AnnouncementBar | `reviews.spotlight` | TestimonialSpotlight |
| `nav.header` | NavBar, SiteHeader | `pricing.tiers` | PricingTiers |
| `hero.centered` | HeroCentered | `compare.table` | ComparisonTable |
| `hero.split` | HeroSplit | `faq.accordion` | FAQ |
| `logos.row` | LogoStrip | `posts.latest` | LatestPosts |
| `features.grid` | FeatureGrid | `form.newsletter` | Newsletter |
| `stats.row` | StatsRow | `form.contact` | ContactForm |
| `steps.numbered` | Steps | `cta.banner` | CTABanner |
| `tabs.media` | TabsMedia | `footer.full` | Footer |
| `code.split` | CodeShowcase | `features.bento` | BentoGrid |
| `gallery.masonry` | Gallery | `media.video` | VideoDemo |
| `slider.cards` | CardSlider | `about.timeline` | Timeline |
| `reviews.grid` | ReviewsGrid | `careers.list` | CareersList |
| `events.upcoming` | EventsGrid | `consent.banner` | CookieConsent |
| `page.error` | ErrorPage | `page.soon` | ComingSoon |

Article bodies (posts, docs) are `Prose` plus the article blocks: `Callout`, `CodeBlock`, `DataTable`, `PullQuote`, `StepList`, `Figure`, `ArticleCTA`, headed by `ArticleHeader` with `TableOfContents` and `ReadingProgress`. The blog index uses `FilterPills`, `FeaturedPost` and `PostCard`.

## Using the components

Components are in `components/bundle.js` as `window.Potato` (React 18 on the page); their styles are in `components/bundle.css`, which also defines the `--grad-*` and `--focus-ring` variables on top of `tokens.css`. Wrap a page in an element with the `pt-root` class so links, focus rings and box sizing apply. Props are documented per component and in `components/index.d.ts`. Preview content is the real site copy; replace it, keep its tone.
