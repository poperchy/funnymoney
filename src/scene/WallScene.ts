// The wall scene. It never changes money itself: it renders the wallet, animates the difference
// between two wallet states, and reports drags back to the model.
import gsap from 'gsap';
import { Application, Container, type FederatedPointerEvent, Rectangle, Sprite, Texture } from 'pixi.js';
import { CURRENCIES, type Currency } from '@/lib/money/currency';
import { moneyShort } from '@/lib/money/format';
import { billMoved, coinMoved } from '@/model/wallet';
import { PIG_LINES } from '@/model/defaults';
import { dragChanged, draftStarted, exchangeOpened, pigShaken, toastShown, type Theme } from '@/model/ui';
import { coinLocation, inPiggy, slotKey, type Bill, type BillLocation, type Coin, type DropTarget, type Pose, type Wallet } from '@/model/types';
import { play } from '@/sound/sfx';
import { BH, BW, computeLayout, inRect, type Layout, layoutKey, pointToPose, poseToPoint, SCENE_W } from './layout';
import { coinLook, paintBackground, paintBill, paintCoin, paintCrumpled, paintPurseBack, paintPurseFront, paintShadow, RES } from './paint';
import { Piggy } from './piggy';

type BillView = {
  id: string;
  value: number;
  root: Container;
  face: Sprite;
  shadow: Sprite;
  loc: BillLocation;
  pose: Pose;
  inPig: boolean;
  /** Balled-up small bill lying on the wallet's pocket. */
  crumpled: boolean;
};

/** A coin lying loose: in the wallet's coin pocket or in a cell. Piggy coins belong to the physics sim. */
type LooseCoin = { id: string; value: number; sprite: Sprite; loc: BillLocation };

/** What is being dragged: a bill from anywhere, or a coin from the wallet pocket. */
type Grab = { kind: 'bill'; view: BillView } | { kind: 'coin'; coin: LooseCoin };
type DragState = { grab: Grab; ox: number; oy: number; k: number; target: DropTarget | null };

/** On-screen size of a coin in the wallet pocket. */
const PURSE_COIN_SCALE = 1.35;
/** What the pig says when you keep poking it. */
/** At most this many small bills lie crumpled on the wallet. */
const MAX_CRUMPLED = 2;
/** Ghost diameter of a dragged coin, in scene px (DragGhost draws the same). */
export const COIN_GHOST = 24;

/** The DOM "Потрачено" zone lives outside the canvas; the scene asks it for hit tests. */
let spentZone: HTMLElement | null = null;
export const setSpentZone = (el: HTMLElement | null) => {
  spentZone = el;
};

export class WallScene {
  private readonly bg = new Sprite();
  private readonly bills = new Container({ sortableChildren: true });
  // The big wallet, back to front: back panel, bills tucked inside, pocket coins, pockets, crumpled bills on top.
  private readonly purseBack = new Sprite();
  private readonly purseBills = new Container({ sortableChildren: true });
  private readonly purseCoins = new Container({ sortableChildren: true });
  private readonly purseFront = new Sprite();
  private readonly purseTop = new Container({ sortableChildren: true });
  private readonly looseCoins = new Map<string, LooseCoin>();
  private readonly piggy: Piggy;
  private readonly views = new Map<string, BillView>();
  private readonly coins = new Map<string, number>();
  private readonly textures = new Map<string, Texture>();
  private shadowTex: Texture;
  private wallet: Wallet | null = null;
  private hidden = new Set<string>();
  private pending: { grab: Grab; sx: number; sy: number } | null = null;
  private drag: DragState | null = null;
  private locked = false;
  private layout: Layout = computeLayout([]);
  private layoutSig = '';
  private theme: Theme = 'light';
  private skins = { board: 'cork', purse: 'leather' };
  /** For telling a double click from two separate clicks. */
  private lastClick = { id: '', at: 0 };

  private constructor(private readonly app: Application) {
    this.shadowTex = Texture.from(paintShadow());
    this.piggy = new Piggy(this.layout.piggy);
    app.stage.addChild(this.bg, this.piggy.root, this.purseBack, this.purseBills, this.purseCoins, this.purseFront, this.purseTop, this.bills);
    app.ticker.add(t => this.piggy.update(t.deltaMS));
    // Right click opens the exchange dialog, not the browser menu.
    app.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  static async create(host: HTMLElement, height: number) {
    const app = new Application();
    await app.init({
      width: SCENE_W,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
    });
    app.canvas.style.display = 'block';
    host.appendChild(app.canvas);
    return new WallScene(app);
  }

  destroy() {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    for (const v of this.views.values()) gsap.killTweensOf([v.root, v.root.scale, v.face, v.shadow]);
    this.piggy.destroy();
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
  }

  // ── Rendering state ─────────────────────────────────────────────

  setTheme(theme: Theme) {
    this.theme = theme;
    this.paintBg();
    this.paintPurse();
  }

  private paintPurse() {
    for (const [sprite, paint] of [[this.purseBack, paintPurseBack], [this.purseFront, paintPurseFront]] as const) {
      const old = sprite.texture;
      sprite.texture = Texture.from(paint(this.theme, this.layout, this.skins.purse));
      sprite.scale.set(0.5);
      sprite.position.set(this.layout.pile.x, this.layout.pile.y);
      if (old && old !== Texture.EMPTY) old.destroy(true);
    }
  }

  setSkins(skins: { board: string; purse: string }) {
    this.skins = skins;
    this.paintBg();
    this.paintPurse();
  }

  private paintBg() {
    const old = this.bg.texture;
    this.bg.texture = Texture.from(paintBackground(this.theme, this.layout, this.skins.board));
    this.bg.scale.set(0.5);
    if (old && old !== Texture.EMPTY) old.destroy(true);
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  /** Bills in an open spend draft are off the wall; when the draft is cancelled they pop back. */
  setHidden(ids: Set<string>) {
    for (const [id, v] of this.views) {
      const hide = ids.has(id);
      if (hide === !v.root.visible) continue;
      v.root.visible = !hide;
      if (!hide) {
        gsap.fromTo(v.root, { alpha: 0 }, { alpha: 1, duration: 0.3 });
        gsap.fromTo(v.root.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2)' });
      }
    }
    this.hidden = ids;
  }

  setPigStep(step: 'ask' | 'shake' | 'broken' | null) {
    // While the take-out ritual asks for shakes, a tap shakes; otherwise it's just a poke for a "хрю-хрю".
    this.piggy.setInteractive(step !== 'broken', () => (step === 'shake' ? pigShaken() : this.pokePig()));
    if (step === 'broken' && !this.piggy.broken) {
      this.piggy.smash();
      play('crack');
    }
    if (step === null && this.piggy.broken) gsap.delayedCall(0.5, () => this.piggy.rebuild());
  }

  /** Notifications come from the pig, so it moves when one appears. */
  pigTalk() {
    this.piggy.talk();
  }

  private pokes = 0;

  private pokePig() {
    if (this.piggy.broken) return;
    this.piggy.poke();
    play('oinkoink');
    play('clink', 0.06);
    // Every few pokes the pig has something to say.
    if (++this.pokes % 4 === 0) toastShown(PIG_LINES[(this.pokes / 4 - 1) % PIG_LINES.length]);
  }

  shakePig() {
    this.piggy.shake();
    play('oink');
    play('clink', 0.08);
  }

  private tex(cur: Currency, value: number) {
    const key = cur.code + value;
    let t = this.textures.get(key);
    if (!t) {
      t = Texture.from(paintBill(value, cur));
      this.textures.set(key, t);
    }
    return t;
  }

  private coinTex(cur: Currency, value: number) {
    const key = 'coin' + cur.code + value;
    let t = this.textures.get(key);
    if (!t) {
      t = Texture.from(paintCoin(value, cur));
      this.textures.set(key, t);
    }
    return t;
  }

  private crumpledTex(cur: Currency, value: number) {
    const key = 'crumpled' + cur.code + value;
    let t = this.textures.get(key);
    if (!t) {
      t = Texture.from(paintCrumpled(value, cur));
      this.textures.set(key, t);
    }
    return t;
  }

  /** A couple of the smallest bills in the wallet get balled up. Stable: the oldest ones. */
  private crumpledIds(w: Wallet, cur: Currency) {
    const small = new Set(cur.bills.slice(0, 2));
    return new Set(
      w.bills
        .filter(b => b.location.type === 'pile' && small.has(b.value))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, MAX_CRUMPLED)
        .map(b => b.id),
    );
  }

  /** Puts a view into the right layer with the right face for where it lies. */
  private mount(v: BillView, cur: Currency, crumpled: boolean) {
    v.crumpled = crumpled;
    v.face.texture = crumpled ? this.crumpledTex(cur, v.value) : this.tex(cur, v.value);
    v.shadow.scale.set(crumpled ? 0.36 : 0.5);
    v.shadow.alpha = crumpled ? 0.55 : 0.75;
    const layer = v.loc.type !== 'pile' ? this.bills : crumpled ? this.purseTop : this.purseBills;
    if (v.root.parent !== layer) layer.addChild(v.root);
  }

  /** Where a bill's centre goes; crumpled ones sit on the pocket's top edge. */
  private pointFor(v: Pick<BillView, 'loc' | 'pose' | 'crumpled'>) {
    if (!v.crumpled) return poseToPoint(v.loc, v.pose, this.layout);
    const { pocket, coinPocket } = this.layout.purse;
    const x0 = pocket.x + 40, x1 = coinPocket.x - 44;
    return { x: x0 + v.pose.x * (x1 - x0), y: pocket.y + 4 + (v.pose.y - 0.5) * 8 };
  }

  /** Applies a new wallet state, animating whatever changed since the previous one. */
  apply(w: Wallet) {
    let prev = this.wallet;
    if (prev && prev.currency !== w.currency) {
      for (const id of [...this.views.keys()]) this.dropView(id);
      for (const id of [...this.coins.keys()]) this.piggy.take(id)?.view.destroy();
      this.coins.clear();
      prev = null;
    }
    this.wallet = w;
    const instant = !prev;
    const L = computeLayout(w.categories);
    const sig = layoutKey(L);
    // Cells were added, removed or resized: every bill slides to its cell's new place.
    const relaid = sig !== this.layoutSig;
    if (relaid) this.relayout(L, sig);
    const cur = CURRENCIES[w.currency];
    const crumpled = this.crumpledIds(w, cur);
    const gone = new Set(this.views.keys());
    let entering = 0;

    for (const b of w.bills) {
      gone.delete(b.id);
      const v = this.views.get(b.id);
      if (!v) {
        this.addView(b, cur, instant, entering, crumpled.has(b.id));
        if (!instant && b.location.type !== 'piggy') entering++;
        continue;
      }
      v.root.zIndex = b.z;
      const crush = crumpled.has(b.id);
      if (slotKey(v.loc) === slotKey(b.location) && v.pose === b.pose && v.crumpled === crush && !relaid) continue;
      if (v.inPig && b.location.type !== 'piggy') this.takeFromPig(v);
      v.loc = b.location;
      v.pose = b.pose;
      if (b.location.type === 'piggy') {
        if (!v.inPig) this.putInPig(v, false);
        continue;
      }
      this.mount(v, cur, crush);
      const p = this.pointFor(v);
      gsap.to(v.root, { x: p.x, y: p.y, rotation: rad(b.pose.r), duration: 0.55, ease: 'power3.out', delay: Math.min(entering++, 30) * 0.04 });
    }
    if (entering && !instant) play('flutter');

    for (const id of gone) {
      const v = this.views.get(id)!;
      if (this.hidden.has(id) || v.inPig) this.dropView(id);
      else this.flyAway(v);
    }

    this.applyCoins(w, cur, instant);
    if (instant) this.piggy.settle();
  }

  private relayout(L: Layout, sig: string) {
    this.layout = L;
    this.layoutSig = sig;
    if (this.app.renderer.height !== L.h) this.app.renderer.resize(SCENE_W, L.h);
    this.paintBg();
    this.paintPurse();
    this.piggy.setOrigin(L.piggy.x, L.piggy.y);
    if (this.wallet) this.placeLooseCoins(this.wallet, false);
  }

  private addView(b: Bill, cur: Currency, instant: boolean, order: number, crumpled: boolean) {
    const root = new Container();
    const shadow = new Sprite(this.shadowTex);
    shadow.anchor.set(0.5);
    shadow.scale.set(0.5);
    shadow.position.set(0, 3);
    shadow.alpha = 0.75;
    shadow.eventMode = 'none';
    const face = new Sprite(this.tex(cur, b.value));
    face.anchor.set(0.5);
    face.scale.set(1 / RES);
    root.addChild(shadow, face);
    root.zIndex = b.z;
    root.hitArea = new Rectangle(-BW / 2, -BH / 2, BW, BH);
    root.eventMode = 'static';
    root.cursor = 'grab';
    root.visible = !this.hidden.has(b.id);
    const v: BillView = { id: b.id, value: b.value, root, face, shadow, loc: b.location, pose: b.pose, inPig: false, crumpled: false };
    this.views.set(b.id, v);
    root.on('pointerdown', e => this.onDown({ kind: 'bill', view: v }, e));
    root.on('rightclick', () => this.openExchange({ kind: 'bill', view: v }));
    root.on('pointerover', () => this.hover(v, true));
    root.on('pointerout', () => this.hover(v, false));

    if (b.location.type === 'piggy') {
      this.putInPig(v, instant);
      return;
    }
    this.mount(v, cur, crumpled);
    const p = this.pointFor(v);
    root.position.set(p.x, p.y);
    root.rotation = rad(b.pose.r);
    if (instant) return;
    // Change and income drop in from above, one after another.
    const delay = 0.15 + Math.min(order, 40) * 0.07;
    gsap.fromTo(root, { y: p.y - 130, rotation: rad(b.pose.r - 30), alpha: 0 }, { y: p.y, rotation: rad(b.pose.r), alpha: 1, duration: 0.7, ease: 'back.out(1.6)', delay });
  }

  private dropView(id: string) {
    const v = this.views.get(id);
    if (!v) return;
    if (v.inPig) this.piggy.take(id);
    gsap.killTweensOf([v.root, v.root.scale, v.face, v.shadow]);
    v.root.destroy({ children: true });
    this.views.delete(id);
  }

  /** Spent without a drag: the bill jumps and flies off towards the till. */
  private flyAway(v: BillView) {
    this.views.delete(v.id);
    v.root.eventMode = 'none';
    v.root.zIndex = 1e6;
    gsap
      .timeline({ onComplete: () => v.root.destroy({ children: true }) })
      .to(v.root, { y: '-=24', duration: 0.16, ease: 'power2.out' })
      .to(v.root.scale, { x: 1.08, y: 1.08, duration: 0.16 }, 0)
      .to(v.root, { x: '+=300', y: '-=260', rotation: 0.42, alpha: 0, duration: 0.5, ease: 'power2.in' });
    play('rustle');
  }

  private putInPig(v: BillView, instant: boolean) {
    v.root.removeFromParent();
    v.root.scale.set(0.5);
    v.root.alpha = 1;
    v.root.eventMode = 'none';
    v.inPig = true;
    this.piggy.add(v.id, v.root, BW * 0.5, BH * 0.5, { drop: !instant });
  }

  private takeFromPig(v: BillView) {
    const t = this.piggy.take(v.id);
    v.inPig = false;
    v.root.eventMode = 'static';
    v.root.scale.set(1);
    if (t) {
      const g = this.piggy.inside.toGlobal({ x: t.x, y: t.y });
      v.root.position.set(g.x, g.y);
      v.root.rotation = t.angle;
    }
    this.bills.addChild(v.root);
  }

  /** Where a loose coin rests: a jumble peeking out of the wallet's coin pocket, or scattered low in a cell. */
  private coinSpot(c: Coin, indexInPocket: number) {
    const h = [...c.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const loc = coinLocation(c);
    const cell = loc.type === 'cell' ? this.layout.cells.get(loc.cellId) : undefined;
    if (cell) {
      const fx = (h % 997) / 997, fy = ((h >>> 10) % 991) / 991;
      return { x: cell.x + 16 + fx * (cell.w - 32), y: cell.y + cell.h - 14 - fy * Math.min(46, cell.h - 70), r: ((h % 9) - 4) * 0.08, z: 9e4 + (h % 1000) };
    }
    const cp = this.layout.purse.coinPocket, i = indexInPocket;
    return { x: cp.x + 16 + ((i * 29 + (h % 23)) % (cp.w - 32)), y: cp.y + 3 - (i % 3) * 3 - (h % 3), r: ((h % 7) - 3) * 0.06, z: i };
  }

  /** Moves every loose coin to its spot; `animate` slides the ones that changed place. */
  private placeLooseCoins(w: Wallet, animate: boolean) {
    let pocketIndex = 0;
    for (const c of w.coins) {
      const lc = this.looseCoins.get(c.id);
      if (!lc) continue;
      const spot = this.coinSpot(c, c.location === 'wallet' ? pocketIndex++ : 0);
      const layer = lc.loc.type === 'cell' ? this.bills : this.purseCoins;
      if (lc.sprite.parent !== layer) layer.addChild(lc.sprite);
      lc.sprite.zIndex = spot.z;
      if (animate) gsap.to(lc.sprite, { x: spot.x, y: spot.y, rotation: spot.r, duration: 0.45, ease: 'power3.out' });
      else {
        lc.sprite.position.set(spot.x, spot.y);
        lc.sprite.rotation = spot.r;
      }
    }
  }

  private applyLooseCoins(w: Wallet, cur: Currency, instant: boolean) {
    const loose = w.coins.filter(c => !inPiggy(c)).slice(0, 120);
    const gone = new Set(this.looseCoins.keys());
    let moved = false;
    const fresh: LooseCoin[] = [];
    for (const c of loose) {
      gone.delete(c.id);
      const loc = coinLocation(c);
      const lc = this.looseCoins.get(c.id);
      if (lc) {
        if (slotKey(lc.loc) !== slotKey(loc)) {
          lc.loc = loc;
          moved = true;
        }
        continue;
      }
      const sprite = new Sprite(this.coinTex(cur, c.value));
      sprite.anchor.set(0.5);
      sprite.scale.set(PURSE_COIN_SCALE / 4);
      sprite.eventMode = 'static';
      sprite.cursor = 'grab';
      const coin: LooseCoin = { id: c.id, value: c.value, sprite, loc };
      sprite.on('pointerdown', e => this.onDown({ kind: 'coin', coin }, e));
      sprite.on('rightclick', () => this.openExchange({ kind: 'coin', coin }));
      this.looseCoins.set(c.id, coin);
      fresh.push(coin);
    }
    for (const id of gone) {
      const lc = this.looseCoins.get(id)!;
      gsap.killTweensOf(lc.sprite);
      lc.sprite.destroy();
      this.looseCoins.delete(id);
    }
    // Existing coins slide to new spots; new ones are placed, then drop in from above.
    this.placeLooseCoins({ ...w, coins: loose }, moved);
    fresh.forEach((c, n) => {
      if (instant) return;
      const delay = 0.4 + n * 0.09;
      gsap.from(c.sprite, { y: c.sprite.y - 120, alpha: 0, duration: 0.6, ease: 'bounce.out', delay });
      play('clink', delay + 0.3);
    });
  }

  private applyCoins(w: Wallet, cur: Currency, instant: boolean) {
    this.applyLooseCoins(w, cur, instant);
    const gone = new Set(this.coins.keys());
    let n = 0;
    for (const c of w.coins.filter(inPiggy)) {
      gone.delete(c.id);
      if (this.coins.has(c.id)) continue;
      this.coins.set(c.id, c.value);
      const look = coinLook(c.value, cur);
      const s = new Sprite(this.coinTex(cur, c.value));
      s.anchor.set(0.5);
      s.scale.set(1 / 4);
      const h = look.size * 0.5 + Math.max(1.5, look.size * 0.12);
      if (instant) this.piggy.add(c.id, s, look.size, h);
      else {
        const delay = 0.35 + n++ * 0.11;
        this.piggy.add(c.id, s, look.size, h, { drop: true, delay, onLand: () => play('clink') });
      }
    }
    // Coins leave only when the piggy is emptied: they roll over to the pile.
    let i = 0;
    for (const id of gone) {
      this.coins.delete(id);
      const t = this.piggy.take(id);
      if (!t) continue;
      const g = this.piggy.inside.toGlobal({ x: t.x, y: t.y });
      t.view.position.set(g.x, g.y);
      this.bills.addChild(t.view);
      t.view.zIndex = 1e6;
      gsap.to(t.view, {
        x: this.layout.pile.x + this.layout.pile.w * (0.3 + Math.random() * 0.4),
        y: this.layout.pile.y + this.layout.pile.h * 0.6,
        alpha: 0,
        duration: 0.6,
        delay: Math.min(i++, 40) * 0.015,
        ease: 'power2.in',
        onComplete: () => t.view.destroy(),
      });
    }
  }

  // ── Hover and drag ──────────────────────────────────────────────

  private hover(v: BillView, on: boolean) {
    if (!v.root.parent) return;
    if (v.inPig || (on && (this.drag || this.locked))) return;
    gsap.to(v.face, { y: on ? -5 : 0, duration: 0.22, ease: 'power3.out' });
    gsap.to(v.shadow, { y: on ? 9 : 3, alpha: on ? 0.95 : 0.75, duration: 0.22 });
    gsap.to(v.root.scale, { x: on ? 1.06 : 1, y: on ? 1.06 : 1, duration: 0.22, ease: 'power3.out' });
    v.root.zIndex = on ? 1e5 : (this.wallet?.bills.find(b => b.id === v.id)?.z ?? 0);
  }

  private viewport() {
    const r = this.app.canvas.getBoundingClientRect();
    return { r, k: r.width / SCENE_W };
  }

  private toScene(cx: number, cy: number) {
    const { r, k } = this.viewport();
    return { x: (cx - r.left) / k, y: (cy - r.top) / k };
  }

  hitTest(cx: number, cy: number): DropTarget | null {
    if (spentZone) {
      const r = spentZone.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return { type: 'spent' };
    }
    const p = this.toScene(cx, cy);
    const L = this.layout;
    if (inRect(L.piggy, p.x, p.y)) return { type: 'piggy' };
    if (inRect(L.pile, p.x, p.y)) return { type: 'pile' };
    for (const [cellId, r] of L.cells) if (inRect(r, p.x, p.y)) return { type: 'cell', cellId };
    return null;
  }

  private onDown(grab: Grab, e: FederatedPointerEvent) {
    if (this.locked || (grab.kind === 'bill' && grab.view.inPig) || e.button !== 0) return;
    this.pending = { grab, sx: e.clientX, sy: e.clientY };
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
  }

  private onMove = (e: PointerEvent) => {
    const p = this.pending;
    if (!p) return;
    if (!this.drag) {
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 4) return;
      const { r, k } = this.viewport();
      const g = p.grab;
      if (g.kind === 'bill') {
        this.hover(g.view, false);
        const left = r.left + (g.view.root.x - BW / 2) * k, top = r.top + (g.view.root.y - BH / 2) * k;
        this.drag = { grab: g, ox: p.sx - left, oy: p.sy - top, k, target: null };
        g.view.root.visible = false;
        play('rustle');
      } else {
        // Coins are held by the middle.
        const half = (COIN_GHOST / 2) * k;
        this.drag = { grab: g, ox: half, oy: half, k, target: null };
        g.coin.sprite.visible = false;
        play('clink');
      }
    }
    const d = this.drag;
    d.target = this.hitTest(e.clientX, e.clientY);
    const g = d.grab;
    dragChanged({
      kind: g.kind,
      billId: g.kind === 'bill' ? g.view.id : g.coin.id,
      value: g.kind === 'bill' ? g.view.value : g.coin.value,
      from: g.kind === 'bill' ? g.view.loc : { type: 'pile' },
      x: e.clientX,
      y: e.clientY,
      ox: d.ox,
      oy: d.oy,
      k: d.k,
      target: d.target,
    });
  };

  /** Double click or right click on money: offer to break it or gather it, right where it lies. */
  private openExchange(g: Grab) {
    if (this.locked) return;
    const loc = g.kind === 'bill' ? g.view.loc : g.coin.loc;
    if (loc.type === 'piggy' || (g.kind === 'bill' && g.view.inPig)) return;
    exchangeOpened(loc);
  }

  private onUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    const d = this.drag, p = this.pending;
    this.pending = null;
    this.drag = null;
    if (!d && p) {
      // A click without a drag: the second one in quick succession on the same money is a double click.
      const id = p.grab.kind === 'bill' ? p.grab.view.id : p.grab.coin.id, now = performance.now();
      if (this.lastClick.id === id && now - this.lastClick.at < 350) {
        this.lastClick = { id: '', at: 0 };
        this.openExchange(p.grab);
      } else this.lastClick = { id, at: now };
      return;
    }
    if (!d || !this.wallet) return;
    dragChanged(null);
    const target = this.hitTest(e.clientX, e.clientY);
    if (d.grab.kind === 'coin') return this.dropCoin(d.grab.coin, target, this.toScene(e.clientX, e.clientY));
    const v = d.grab.view, cats = this.wallet.categories;
    const tl = this.toScene(e.clientX - d.ox, e.clientY - d.oy);
    const cx = tl.x + BW / 2, cy = tl.y + BH / 2;
    v.root.position.set(cx, cy);
    v.root.rotation = 0;

    if (!target) {
      v.root.visible = true;
      const p = this.pointFor(v);
      gsap.to(v.root, { x: p.x, y: p.y, rotation: rad(v.pose.r), duration: 0.45, ease: 'power3.out' });
      return;
    }
    if (target.type === 'spent') {
      draftStarted({ billId: v.id, from: v.loc });
      play('till');
      return;
    }
    v.root.visible = true;
    if (target.type === 'piggy') {
      billMoved({ id: v.id, to: { type: 'piggy' } });
      toastShown('Свинка довольна: +' + moneyShort(v.value) + '. Хрю');
      play('oink', 0.3);
      return;
    }
    const to: BillLocation = target.type === 'pile' ? { type: 'pile' } : { type: 'cell', cellId: target.cellId };
    const tilt = (Math.random() - 0.5) * (to.type === 'pile' ? 60 : 20);
    gsap.fromTo(v.root, { rotation: 0 }, { rotation: rad(tilt), duration: 0.3, ease: 'power2.out' });
    const fromKey = slotKey(v.loc), toKey = slotKey(to);
    billMoved({ id: v.id, to, pose: pointToPose(to, cx, cy, tilt, this.layout) });
    play('rustle');
    if (fromKey !== toKey) {
      const name = (key: string) => (key === 'pile' ? 'кошелька' : '«' + (cats.find(c => c.id === key)?.name ?? '') + '»');
      toastShown(
        to.type === 'pile'
          ? 'Вернул в кошелёк. Подумаем ещё'
          : 'Переезд: ' + moneyShort(v.value) + ' из ' + name(fromKey) + ' в ' + name(toKey) + '. Прошёл успешно',
      );
    }
  };

  /** Coins go into a cell, back into the wallet, or into the piggy. The till only takes bills. */
  private dropCoin(c: LooseCoin, target: DropTarget | null, at: { x: number; y: number }) {
    c.sprite.visible = true;
    if (!target || target.type === 'spent' || slotKey(target) === slotKey(c.loc)) {
      gsap.from(c.sprite, { y: c.sprite.y - 30, duration: 0.4, ease: 'bounce.out' });
      if (target?.type === 'spent') toastShown('Касса берёт только купюры. Мелочь — в ячейку или свинке');
      return;
    }
    if (target.type === 'piggy') {
      coinMoved({ id: c.id, to: { type: 'piggy' } });
      toastShown('Мелочь в свинку: +' + moneyShort(c.value) + '. Хрю');
      play('oink', 0.35);
      return;
    }
    // Start the slide from where it was let go.
    c.sprite.position.set(at.x, at.y);
    coinMoved({ id: c.id, to: target.type === 'pile' ? { type: 'pile' } : { type: 'cell', cellId: target.cellId } });
    play('clink');
  }
}

const rad = (deg: number) => (deg * Math.PI) / 180;
