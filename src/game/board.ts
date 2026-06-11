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
 * Overlap rejection runs against the ACTUAL drawn geometry (the snake's wavy spine,
 * the ladder's rail line), not just the straight head->tail axis — so bodies never
 * cross or squeeze against each other.
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

/** Min distance between two polylines (0 when any segments intersect). */
function polylineDist(a: Point[], b: Point[]): number {
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      if (segmentsCross(a[i], a[i + 1], b[j], b[j + 1])) return 0;
    }
  }
  let min = Infinity;
  for (const p of a) for (let j = 0; j < b.length - 1; j++) min = Math.min(min, pointToSegDist(p, b[j], b[j + 1]));
  for (const p of b) for (let i = 0; i < a.length - 1; i++) min = Math.min(min, pointToSegDist(p, a[i], a[i + 1]));
  return min;
}

export function makeRandomLayout(): BoardLayout {
  const used = new Set<number>([1, 100]);
  const shapes: Point[][] = []; // accepted drawn spines
  const snakes: Transition[] = [];
  const ladders: Transition[] = [];

  // the real spine a candidate would be drawn with (snake curves are seeded by
  // their endpoints, so this is exactly what would end up on the board)
  const spineFor = (t: Transition, kind: 'snake' | 'ladder'): Point[] =>
    kind === 'snake'
      ? buildSnakeCurve(t).samples.filter((_, i) => i % 3 === 0)
      : ladderSamples(buildLadderGeom(t), 6);

  const fill = (count: number, make: () => Transition | null, out: Transition[], kind: 'snake' | 'ladder') => {
    // bodies are ~24 units wide, ladders ~36: relax the breathing room between
    // spines only if the board gets too crowded to finish
    for (const gap of [60, 44, 34, 26]) {
      let guard = 0;
      while (out.length < count && guard++ < 900) {
        const t = make();
        if (!t || used.has(t.from) || used.has(t.to)) continue;
        const dist = cellDistance(t.from, t.to);
        if (dist < 200 || dist > 580) continue;
        const spine = spineFor(t, kind);
        if (!shapes.every((s) => polylineDist(spine, s) >= gap)) continue;
        used.add(t.from);
        used.add(t.to);
        shapes.push(spine);
        out.push(t);
      }
      if (out.length >= count) break;
    }
  };

  fill(8, () => {
    const from = 20 + Math.floor(Math.random() * 80); // 20..99
    const to = from - (12 + Math.floor(Math.random() * 33));
    return to >= 2 ? { from, to } : null;
  }, snakes, 'snake');

  fill(7, () => {
    const from = 2 + Math.floor(Math.random() * 78); // 2..79
    const to = from + 12 + Math.floor(Math.random() * 33);
    return to <= 99 ? { from, to } : null;
  }, ladders, 'ladder');

  // extremely unlikely, but never start a game with a near-empty board
  if (snakes.length < 5 || ladders.length < 4) return CLASSIC_LAYOUT;
  return makeLayout(snakes, ladders);
}

// dev hook: lets tests/console sample many random layouts (stripped from release builds)
if (__DEV__) {
  (globalThis as { __makeRandomLayout?: typeof makeRandomLayout }).__makeRandomLayout = makeRandomLayout;
}

export function transitionAt(cell: number, layout: BoardLayout): { kind: 'snake' | 'ladder'; to: number } | null {
  const l = layout.ladders.find((t) => t.from === cell);
  if (l) return { kind: 'ladder', to: l.to };
  const s = layout.snakes.find((t) => t.from === cell);
  if (s) return { kind: 'snake', to: s.to };
  return null;
}
