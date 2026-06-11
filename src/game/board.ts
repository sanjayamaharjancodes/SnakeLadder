// Board geometry. The board lives in a 1000x1000 SVG viewBox, 10x10 cells of 100 units.
// Cell 1 is bottom-left; numbering snakes boustrophedon up to 100 at top-left.

export const BOARD_UNITS = 1000;
export const CELL = 100;

export interface Point {
  x: number;
  y: number;
}

/** Center of a cell (1..100) in board units. */
export function cellCenter(cell: number): Point {
  const idx = cell - 1;
  const row = Math.floor(idx / 10); // 0 = bottom row
  let col = idx % 10;
  if (row % 2 === 1) col = 9 - col;
  return { x: col * CELL + CELL / 2, y: (9 - row) * CELL + CELL / 2 };
}

export interface Transition {
  from: number;
  to: number;
}

const CLASSIC_LADDERS: Transition[] = [
  { from: 4, to: 25 },
  { from: 13, to: 46 },
  { from: 33, to: 49 },
  { from: 42, to: 63 },
  { from: 50, to: 69 },
  { from: 62, to: 81 },
  { from: 74, to: 92 },
];

const CLASSIC_SNAKES: Transition[] = [
  { from: 27, to: 5 },
  { from: 40, to: 3 },
  { from: 43, to: 18 },
  { from: 54, to: 31 },
  { from: 66, to: 45 },
  { from: 76, to: 58 },
  { from: 89, to: 53 },
  { from: 99, to: 41 },
];

// ---------------------------------------------------------------------------
// Snake curves: a wavy cubic-bezier chain from head (at `from`) to tail (at `to`).
// The same control points drive both the SVG path and the token slide animation.

export interface SnakeCurve {
  from: number;
  to: number;
  /** SVG path `d` for the spine */
  d: string;
  /** Densely sampled points along the spine, head -> tail */
  samples: Point[];
  head: Point;
  tail: Point;
  headAngle: number; // degrees, direction the head faces
}

function cubicPoint(p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
}

/** Deterministic pseudo-random in [0,1) seeded per snake so layout is stable. */
function seeded(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildSnakeCurve(t: Transition): SnakeCurve {
  const head = cellCenter(t.from);
  const tail = cellCenter(t.to);
  const rand = seeded(t.from * 100 + t.to);

  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Unit perpendicular to the head->tail axis
  const px = -dy / len;
  const py = dx / len;

  // Anchor points along the axis with alternating perpendicular offsets -> S shape
  const waves = len > 450 ? 3 : 2;
  const anchors: Point[] = [head];
  for (let i = 1; i <= waves; i++) {
    const f = i / (waves + 1);
    const amp = (len * 0.16 + 30) * (i % 2 === 0 ? 1 : -1) * (0.8 + rand() * 0.5);
    anchors.push({ x: head.x + dx * f + px * amp, y: head.y + dy * f + py * amp });
  }
  anchors.push(tail);

  // Catmull-Rom -> cubic bezier through the anchors for a smooth spine
  const segs: { p0: Point; c1: Point; c2: Point; p1: Point }[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const p0 = anchors[Math.max(0, i - 1)];
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const p3 = anchors[Math.min(anchors.length - 1, i + 2)];
    segs.push({
      p0: p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p1: p2,
    });
  }

  let d = `M ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
  for (const s of segs) {
    d += ` C ${s.c1.x.toFixed(1)} ${s.c1.y.toFixed(1)}, ${s.c2.x.toFixed(1)} ${s.c2.y.toFixed(1)}, ${s.p1.x.toFixed(1)} ${s.p1.y.toFixed(1)}`;
  }

  const samples: Point[] = [];
  const perSeg = 10;
  for (const s of segs) {
    for (let i = 0; i < perSeg; i++) {
      samples.push(cubicPoint(s.p0, s.c1, s.c2, s.p1, i / perSeg));
    }
  }
  samples.push(tail);

  const second = samples[2];
  const headAngle = (Math.atan2(head.y - second.y, head.x - second.x) * 180) / Math.PI;

  return { from: t.from, to: t.to, d, samples, head, tail, headAngle };
}

export interface LadderGeom {
  from: number;
  to: number;
  bottom: Point;
  top: Point;
  angle: number; // degrees
  length: number;
}

export function buildLadderGeom(t: Transition): LadderGeom {
  const bottom = cellCenter(t.from);
  const top = cellCenter(t.to);
  const dx = top.x - bottom.x;
  const dy = top.y - bottom.y;
  return {
    from: t.from,
    to: t.to,
    bottom,
    top,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    length: Math.sqrt(dx * dx + dy * dy),
  };
}

/** Points a token follows when climbing a ladder (straight line, bounce per rung handled by animator). */
export function ladderSamples(g: LadderGeom, n = 14): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    pts.push({
      x: g.bottom.x + ((g.top.x - g.bottom.x) * i) / n,
      y: g.bottom.y + ((g.top.y - g.bottom.y) * i) / n,
    });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Board layouts: classic (fixed) or shuffled per game.

export interface BoardLayout {
  snakes: SnakeCurve[];
  ladders: LadderGeom[];
}

export function makeLayout(snakes: Transition[], ladders: Transition[]): BoardLayout {
  return {
    snakes: snakes.map(buildSnakeCurve),
    ladders: ladders.map(buildLadderGeom),
  };
}

export const CLASSIC_LAYOUT: BoardLayout = makeLayout(CLASSIC_SNAKES, CLASSIC_LADDERS);

function cellDistance(a: number, b: number): number {
  const pa = cellCenter(a);
  const pb = cellCenter(b);
  return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
}

/**
 * A fresh random board: 8 snakes + 7 ladders.
 * Constraints: every transition endpoint is unique (no chains, no shared cells),
 * cells 1 and 100 stay clear, and each snake/ladder spans enough distance to draw well.
 */
function pointToSegDist(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const o = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

/** Min distance between two segments (0 when they intersect). */
function segDist(a: Point, b: Point, c: Point, d: Point): number {
  if (segmentsCross(a, b, c, d)) return 0;
  return Math.min(pointToSegDist(a, c, d), pointToSegDist(b, c, d), pointToSegDist(c, a, b), pointToSegDist(d, a, b));
}

export function makeRandomLayout(): BoardLayout {
  const used = new Set<number>([1, 100]);
  const segments: [Point, Point][] = [];
  const snakes: Transition[] = [];
  const ladders: Transition[] = [];

  // reject candidates whose axis crosses or squeezes against an accepted one;
  // relax the gap if the board gets too crowded to finish
  const clear = (from: number, to: number, gap: number) => {
    const a = cellCenter(from);
    const b = cellCenter(to);
    return segments.every(([c, d]) => segDist(a, b, c, d) >= gap);
  };
  const accept = (from: number, to: number) => {
    used.add(from);
    used.add(to);
    segments.push([cellCenter(from), cellCenter(to)]);
  };

  const fill = (count: number, make: () => Transition | null, out: Transition[]) => {
    for (const gap of [95, 65, 38]) {
      let guard = 0;
      while (out.length < count && guard++ < 700) {
        const t = make();
        if (!t || used.has(t.from) || used.has(t.to)) continue;
        const dist = cellDistance(t.from, t.to);
        if (dist < 200 || dist > 580) continue;
        if (!clear(t.from, t.to, gap)) continue;
        accept(t.from, t.to);
        out.push(t);
      }
      if (out.length >= count) break;
    }
  };

  fill(8, () => {
    const from = 20 + Math.floor(Math.random() * 80); // 20..99
    const to = from - (12 + Math.floor(Math.random() * 33));
    return to >= 2 ? { from, to } : null;
  }, snakes);

  fill(7, () => {
    const from = 2 + Math.floor(Math.random() * 78); // 2..79
    const to = from + 12 + Math.floor(Math.random() * 33);
    return to <= 99 ? { from, to } : null;
  }, ladders);

  // extremely unlikely, but never start a game with a near-empty board
  if (snakes.length < 5 || ladders.length < 4) return CLASSIC_LAYOUT;
  return makeLayout(snakes, ladders);
}

export function transitionAt(cell: number, layout: BoardLayout): { kind: 'snake' | 'ladder'; to: number } | null {
  const l = layout.ladders.find((t) => t.from === cell);
  if (l) return { kind: 'ladder', to: l.to };
  const s = layout.snakes.find((t) => t.from === cell);
  if (s) return { kind: 'snake', to: s.to };
  return null;
}
