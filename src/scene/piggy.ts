// The piggy bank: a glass pig drawn with Pixi, coins inside simulated with matter.js.
// Physics runs in the pig's local coordinates (design px).
import gsap from 'gsap';
import Matter from 'matter-js';
import { Container, Graphics, type Sprite } from 'pixi.js';
import { PIG } from './palette';
import { PIG_FLOOR_Y, PIG_PILE_X } from './layout';

const { Bodies, Body, Composite, Engine, Sleeping } = Matter;

// Glass body ellipse, as in the design.
const CX = 106, CY = 88, RX = 90, RY = 62;
const SPLIT_X = CX;
const SLOT = { x: 84, y: 26, w: 46, h: 8 };
const PIVOT = { x: CX, y: 166 };
/** More bodies than this and the pig just looks full; the rest is still counted. */
const MAX_BODIES = 180;

type Item = { body: Matter.Body; view: Container | Sprite; size: number };

export class Piggy {
  readonly root = new Container();
  private readonly backL = new Container();
  private readonly backR = new Container();
  private readonly frontL = new Container();
  private readonly frontR = new Container();
  readonly inside = new Container();
  private readonly insideMask = new Graphics();
  private readonly engine = Engine.create({ enableSleeping: true });
  private walls: Matter.Body[] = [];
  private floor: Matter.Body[] = [];
  private items = new Map<string, Item>();
  private waiting: (() => void)[] = [];
  broken = false;
  /** Top-left of the piggy box in scene coordinates; moves down when the board grows. */
  private origin = { x: 0, y: 0 };

  constructor(origin: { x: number; y: number }) {
    // Pivot at the feet, so shaking rocks the pig on the shelf.
    this.root.pivot.set(PIVOT.x, PIVOT.y);
    this.setOrigin(origin.x, origin.y);
    this.engine.gravity.y = 1;
    this.draw();
    this.root.addChild(this.backL, this.backR, this.inside, this.insideMask, this.frontL, this.frontR);
    this.inside.mask = this.insideMask;
    this.walls = this.makeWalls();
    Composite.add(this.engine.world, this.walls);
  }

  setOrigin(x: number, y: number) {
    this.origin = { x, y };
    gsap.killTweensOf(this.root);
    this.root.rotation = 0;
    this.root.alpha = 1;
    this.root.position.set(x + PIVOT.x, y + PIVOT.y);
  }

  private draw() {
    const fill = PIG.fill, edge = PIG.edge;
    const leg = (g: Graphics, x: number) => g.roundRect(x, 134, 24, 30, 7).fill(fill).stroke({ color: edge, width: 3 });

    const tail = new Graphics().arc(12, 76, 11, Math.PI * 0.9, Math.PI * 1.9).stroke({ color: edge, width: 4, cap: 'round' });
    const legsL = new Graphics();
    leg(legsL, 42);
    leg(legsL, 68);
    const legsR = new Graphics();
    leg(legsR, 128);
    leg(legsR, 154);
    const glass = () => new Graphics().ellipse(CX, CY, RX, RY).fill(PIG.glass);
    const halfMask = (left: boolean) => new Graphics().rect(left ? -40 : SPLIT_X, -40, left ? SPLIT_X + 40 : 200, 260).fill(0xffffff);

    const bodyL = glass(), bodyR = glass();
    const mBL = halfMask(true), mBR = halfMask(false);
    bodyL.mask = mBL;
    bodyR.mask = mBR;
    this.backL.addChild(tail, legsL, bodyL, mBL);
    this.backR.addChild(legsR, bodyR, mBR);

    this.insideMask.ellipse(CX, CY, RX - 1.5, RY - 1.5).fill(0xffffff);

    const front = () =>
      new Graphics()
        .ellipse(CX - 34, CY - 46, 35, 14)
        .fill({ color: 0xffffff, alpha: 0.35 })
        .ellipse(CX + 44, CY + 44, 20, 6)
        .fill({ color: 0xffffff, alpha: 0.22 })
        .ellipse(CX, CY, RX, RY)
        .stroke({ color: edge, width: 3 })
        .roundRect(SLOT.x, SLOT.y, SLOT.w, SLOT.h, 4)
        .fill(PIG.dark);
    const fL = front(), fR = front();
    const mFL = halfMask(true), mFR = halfMask(false);
    fL.mask = mFL;
    fR.mask = mFR;
    const ear = (x: number, y: number, s: number, rot: number) => {
      const g = new Graphics().roundRect(-s / 2, -s / 2, s, s, s * 0.35).fill(fill).stroke({ color: edge, width: 3 });
      g.position.set(x + s / 2, y + s / 2);
      g.rotation = rot;
      return g;
    };
    const snout = new Graphics()
      .ellipse(204, 93, 18, 21)
      .fill(fill)
      .stroke({ color: edge, width: 3 })
      .ellipse(198, 91, 3, 5.5)
      .fill(PIG.dark)
      .ellipse(209, 91, 3, 5.5)
      .fill(PIG.dark);
    const eye = new Graphics().ellipse(168, 65, 4, 5).fill(PIG.eye);
    this.frontL.addChild(fL, mFL);
    this.frontR.addChild(fR, mFR, ear(140, 20, 26, -0.6), ear(160, 32, 22, 0.35), snout, eye);
  }

  private makeWalls() {
    const n = 40, t = 12, out: Matter.Body[] = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const p0 = { x: CX + Math.cos(a0) * (RX - 3), y: CY + Math.sin(a0) * (RY - 3) };
      const p1 = { x: CX + Math.cos(a1) * (RX - 3), y: CY + Math.sin(a1) * (RY - 3) };
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      // Leave the slot open so coins can drop in.
      if (my < CY - RY * 0.8 && Math.abs(mx - (SLOT.x + SLOT.w / 2)) < SLOT.w / 2 + 2) continue;
      const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) + 2;
      const nx = Math.cos(am) * (t / 2), ny = Math.sin(am) * (t / 2);
      out.push(Bodies.rectangle(mx + nx, my + ny, len, t, { isStatic: true, angle: Math.atan2(p1.y - p0.y, p1.x - p0.x), friction: 0.6 }));
    }
    return out;
  }

  private makeFloor() {
    const fy = PIG_FLOOR_Y, right = PIG_PILE_X - 6;
    return [
      Bodies.rectangle((right - 14) / 2, fy + 10, right + 40, 20, { isStatic: true, friction: 0.8 }),
      Bodies.rectangle(-24, fy - 60, 20, 160, { isStatic: true }),
      Bodies.rectangle(right + 10, fy - 60, 20, 160, { isStatic: true }),
    ];
  }

  get count() {
    return this.items.size;
  }

  has(id: string) {
    return this.items.has(id);
  }

  /** Puts a coin or a mini bill inside. `drop` sends it through the slot, otherwise it appears settled. */
  add(id: string, view: Container | Sprite, w: number, h: number, opts: { drop?: boolean; delay?: number; from?: { x: number; y: number }; onLand?: () => void } = {}) {
    if (this.items.size >= MAX_BODIES) {
      view.visible = false;
      return;
    }
    const place = () => {
      const start = opts.from
        ? opts.from
        : opts.drop
          ? { x: SLOT.x + SLOT.w / 2 + (Math.random() - 0.5) * 16, y: SLOT.y - 30 }
          : { x: CX + (Math.random() - 0.5) * RX * 1.2, y: CY + Math.random() * RY * 0.5 };
      const body = Bodies.rectangle(start.x, start.y, w, h, {
        chamfer: { radius: Math.min(w, h) * 0.45 },
        friction: 0.35,
        frictionAir: 0.012,
        restitution: 0.25,
        density: 0.003,
        angle: (Math.random() - 0.5) * 0.6,
      });
      if (opts.drop) Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.6, y: 2 });
      Composite.add(this.engine.world, body);
      this.inside.addChild(view);
      view.position.set(start.x, start.y);
      this.items.set(id, { body, view, size: w });
      if (opts.onLand) gsap.delayedCall(0.35, opts.onLand);
    };
    const run = () => (opts.delay ? gsap.delayedCall(opts.delay, place) : place());
    if (this.broken && !opts.from) this.waiting.push(run);
    else run();
  }

  /** Takes an item out; returns its view and position in pig-local coordinates. */
  take(id: string) {
    const it = this.items.get(id);
    if (!it) return null;
    Composite.remove(this.engine.world, it.body);
    this.items.delete(id);
    it.view.removeFromParent();
    return { view: it.view, x: it.body.position.x, y: it.body.position.y, angle: it.body.angle };
  }

  /** Lets existing coins fall into place without animation (first load). */
  settle(steps = 260) {
    for (let i = 0; i < steps; i++) Engine.update(this.engine, 1000 / 60);
    this.sync();
  }

  update(dtMs: number) {
    // matter.js wants steps of at most one 60 fps frame; slow frames get two.
    const step = 1000 / 60;
    const n = dtMs > step * 1.5 ? 2 : 1;
    for (let i = 0; i < n; i++) Engine.update(this.engine, Math.min(step, dtMs / n));
    this.sync();
  }

  private sync() {
    for (const it of this.items.values()) {
      it.view.position.set(it.body.position.x, it.body.position.y);
      it.view.rotation = it.body.angle;
    }
  }

  private jolt(power: number) {
    for (const it of this.items.values()) {
      Sleeping.set(it.body, false);
      Body.setVelocity(it.body, { x: (Math.random() - 0.5) * power, y: -Math.random() * power * 0.9 });
      Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.4);
    }
  }

  shake() {
    gsap.killTweensOf(this.root);
    gsap
      .timeline()
      .to(this.root, { rotation: -0.16, x: '-=8', duration: 0.08 })
      .to(this.root, { rotation: 0.14, x: '+=16', duration: 0.1 })
      .to(this.root, { rotation: -0.1, x: '-=12', duration: 0.1 })
      .to(this.root, { rotation: 0.06, x: '+=7', duration: 0.09 })
      .to(this.root, { rotation: 0, x: this.origin.x + PIVOT.x, duration: 0.12, ease: 'power2.out' });
    this.jolt(7);
  }

  smash() {
    if (this.broken) return;
    this.broken = true;
    Composite.remove(this.engine.world, this.walls);
    this.floor = this.makeFloor();
    Composite.add(this.engine.world, this.floor);
    this.inside.mask = null;
    this.insideMask.visible = false;
    const halves = (left: boolean) => (left ? [this.backL, this.frontL] : [this.backR, this.frontR]);
    for (const left of [true, false]) {
      for (const c of halves(left)) {
        c.pivot.set(left ? 60 : 150, 150);
        c.position.set(left ? 60 : 150, 150);
        gsap.to(c, { x: `+=${left ? -14 : 30}`, y: '+=10', rotation: left ? -0.2 : 0.2, duration: 0.5, ease: 'back.out(2)' });
      }
    }
    this.jolt(9);
  }

  /** A fresh pig drops onto the shelf. */
  rebuild() {
    if (!this.broken) return;
    this.broken = false;
    Composite.remove(this.engine.world, this.floor);
    this.floor = [];
    Composite.add(this.engine.world, this.walls);
    this.inside.mask = this.insideMask;
    this.insideMask.visible = true;
    for (const c of [this.backL, this.backR, this.frontL, this.frontR]) {
      gsap.killTweensOf(c);
      c.pivot.set(0, 0);
      c.position.set(0, 0);
      c.rotation = 0;
    }
    const y = this.origin.y + PIVOT.y;
    gsap.fromTo(this.root, { y: y - 260, alpha: 0 }, { y, alpha: 1, duration: 0.7, ease: 'bounce.out' });
    const queued = this.waiting;
    this.waiting = [];
    gsap.delayedCall(0.6, () => queued.forEach(fn => fn()));
  }

  /** Poked for fun: squash, a little hop, coins jingle inside. */
  poke() {
    if (this.broken) return;
    const y = this.origin.y + PIVOT.y;
    gsap.killTweensOf(this.root.scale);
    gsap
      .timeline()
      .to(this.root.scale, { x: 1.08, y: 0.88, duration: 0.08, ease: 'power2.out' })
      .to(this.root.scale, { x: 0.96, y: 1.06, duration: 0.12, ease: 'power2.out' })
      .to(this.root, { y: y - 12, duration: 0.12, ease: 'power2.out' }, '<')
      .to(this.root, { y, duration: 0.22, ease: 'bounce.out' })
      .to(this.root.scale, { x: 1, y: 1, duration: 0.22, ease: 'elastic.out(1, 0.5)' }, '<');
    this.jolt(2.5);
  }

  /** Says something (a notification): two quick bobs, like chattering. */
  talk() {
    if (this.broken || gsap.isTweening(this.root.scale)) return;
    gsap
      .timeline()
      .to(this.root.scale, { x: 1.04, y: 0.95, duration: 0.07 })
      .to(this.root.scale, { x: 0.98, y: 1.03, duration: 0.08 })
      .to(this.root.scale, { x: 1.03, y: 0.96, duration: 0.07 })
      .to(this.root.scale, { x: 1, y: 1, duration: 0.18, ease: 'elastic.out(1, 0.5)' });
  }

  setInteractive(on: boolean, onTap: () => void) {
    this.root.eventMode = on ? 'static' : 'auto';
    this.root.cursor = on ? 'pointer' : 'default';
    this.root.removeAllListeners('pointertap');
    if (on) this.root.on('pointertap', onTap);
  }

  destroy() {
    Engine.clear(this.engine);
    gsap.killTweensOf(this.root);
  }
}
