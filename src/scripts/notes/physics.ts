// How a note swings while it is carried and after it is let go. The note is treated as a weight
// hanging from the point it is held by: the weight trails the direction of travel, lags on a start,
// swings forward on a stop, and droops when the note is held off-centre. Angles are in radians.

const HANG = 70; // how far below the note's centre its weight sits, px
const GYRATION = 40; // keeps the moment of inertia sane for grabs near the weight
const GRAVITY = 900; // droop when held off-centre
const DRAG = 3; // weight trails behind the direction of travel
const INERTIA = 0.3; // weight lags on a start and swings forward on a stop
const ANG_K = 60, ANG_C = 4.6; // the grip pulling the note level (damping ratio 0.3)
const MAX_ANG = 0.75;
const SC_K = 300, SC_C = 14;
const LIFT_SCALE = 1.06;

export interface Swing {
  /** Held point, from the note's centre, px. It is the pivot. */
  gx: number;
  gy: number;
  /** Velocity of the note across the page, px/s. The caller keeps this current. */
  vx: number;
  vy: number;
  pvx: number;
  pvy: number;
  ang: number;
  angV: number;
  sc: number;
  scV: number;
}

export const newSwing = (gx = 0, gy = 0): Swing => ({ gx, gy, vx: 0, vy: 0, pvx: 0, pvy: 0, ang: 0, angV: 0, sc: 1, scV: 0 });

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A CSS cubic-bezier() timing function as a plain function of progress 0..1. */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid; else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/** Advance angle and scale by `dt` seconds. Returns true once both are at rest. */
export function stepSwing(s: Swing, dt: number, held: boolean): boolean {
  const ax = clamp((s.vx - s.pvx) / dt, -20000, 20000);
  const ay = clamp((s.vy - s.pvy) / dt, -20000, 20000);
  s.pvx = s.vx;
  s.pvy = s.vy;
  // c is the arm from the held point to the weight, turned by the current angle.
  const c0x = -s.gx, c0y = HANG - s.gy;
  const cos = Math.cos(s.ang), sin = Math.sin(s.ang);
  const cx = c0x * cos - c0y * sin, cy = c0x * sin + c0y * cos;
  // Forces on the weight: drag against travel, inertia against acceleration, gravity while held.
  const fx = -DRAG * s.vx - INERTIA * ax;
  const fy = -DRAG * s.vy - INERTIA * ay + (held ? GRAVITY : 0);
  const torque = (cx * fy - cy * fx) / (c0x * c0x + c0y * c0y + GYRATION * GYRATION);
  s.angV += (torque - s.ang * ANG_K - s.angV * ANG_C) * dt;
  s.ang += s.angV * dt;
  if (Math.abs(s.ang) > MAX_ANG) { s.ang = Math.sign(s.ang) * MAX_ANG; s.angV = 0; }

  s.scV += (-(s.sc - (held ? LIFT_SCALE : 1)) * SC_K - s.scV * SC_C) * dt;
  s.sc += s.scV * dt;

  return !held && Math.abs(s.ang) < 0.001 && Math.abs(s.angV) < 0.01 && Math.abs(s.sc - 1) < 0.002 && Math.abs(s.scV) < 0.02;
}

/** Landing squash on release: deeper the faster the note was moving. */
export function release(s: Swing) {
  s.vx = clamp(s.vx, -1800, 1800);
  s.vy = clamp(s.vy, -1800, 1800);
  s.scV -= 0.5 + Math.hypot(s.vx, s.vy) * 0.0012;
}

/** The shift that makes the rotation happen about the held point instead of the note's centre. */
export function pivotShift(s: Swing) {
  const cos = Math.cos(s.ang), sin = Math.sin(s.ang);
  return { tx: s.gx - (s.gx * cos - s.gy * sin), ty: s.gy - (s.gx * sin + s.gy * cos) };
}
