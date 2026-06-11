import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BOARD_UNITS, BoardLayout, CELL, cellCenter, LadderGeom, Point, SnakeCurve } from '../game/board';
import { theme } from '../theme';

const AnimatedG = Animated.createAnimatedComponent(G);

// ---------------------------------------------------------------------------
// Realistic snakes: tapered filled body with python blotches + a head whose jaw
// gapes open (crossfade closed/open variants) when a token is being swallowed.

const SNAKE_SKINS = [
  { base: '#4D7C0F', shade: '#365314', blotch: '#1A2E05', belly: '#D9F99D' }, // forest python
  { base: '#92400E', shade: '#5F2A09', blotch: '#3E1C06', belly: '#FDE68A' }, // copperhead
  { base: '#166534', shade: '#0C3D20', blotch: '#052E16', belly: '#BBF7D0' }, // emerald boa
  { base: '#57534E', shade: '#33302C', blotch: '#1C1917', belly: '#E7E5E4' }, // rock python
];

/** Piecewise-linear body width along the spine (t: 0 head-side .. 1 tail). */
function bodyWidth(t: number): number {
  const stops: [number, number][] = [
    [0, 12],
    [0.22, 23],
    [0.6, 19],
    [0.88, 9],
    [1, 2.5],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, w0] = stops[i];
    const [t1, w1] = stops[i + 1];
    if (t <= t1) return w0 + ((t - t0) / (t1 - t0)) * (w1 - w0);
  }
  return 2.5;
}

interface Outline {
  bodyPath: string;
  /** last stretch of the body, drawn separately so it can wag */
  tailPath: string;
  /** point the tail rotates around */
  tailPivot: Point;
  /** spine polyline up to the tail split (for stripes that must not cover the wagging tail) */
  spinePath: string;
  blotches: { p: Point; angle: number; w: number }[];
  spine: Point[];
}

function buildOutline(pts: Point[]): Outline {
  const n = pts.length;
  const blotches: Outline['blotches'] = [];

  // cross-section at sample i: perpendicular offsets scaled by the width profile
  const sect = (i: number, scale = 1) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const tl = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= tl;
    ty /= tl;
    const w = bodyWidth(i / (n - 1)) * scale;
    return {
      l: { x: pts[i].x - ty * w, y: pts[i].y + tx * w },
      r: { x: pts[i].x + ty * w, y: pts[i].y - tx * w },
      angle: (Math.atan2(ty, tx) * 180) / Math.PI,
      w,
    };
  };

  const closedPath = (a: number, b: number, scale: (i: number) => number) => {
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = a; i <= b; i++) {
      const s = sect(i, scale(i));
      left.push(s.l);
      right.push(s.r);
    }
    let d = `M ${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)}`;
    for (let i = 1; i < left.length; i++) d += ` L ${left[i].x.toFixed(1)} ${left[i].y.toFixed(1)}`;
    for (let i = right.length - 1; i >= 0; i--) d += ` L ${right[i].x.toFixed(1)} ${right[i].y.toFixed(1)}`;
    return d + ' Z';
  };

  for (let i = 0; i < n; i++) {
    if (i > 2 && i < n * 0.76 && i % 5 === 0) {
      const s = sect(i);
      blotches.push({ p: pts[i], angle: s.angle, w: s.w });
    }
  }

  // tail = last ~18% of the spine. It pivots at the EDGE of the body overlap so
  // the visible seam never opens, and its hidden under-body samples are slimmed
  // so they cannot peek out sideways while swinging.
  const split = Math.floor(n * 0.82);
  const cover = Math.min(split + 2, n - 1);
  let spinePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i <= split; i++) spinePath += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  return {
    bodyPath: closedPath(0, cover, () => 1),
    tailPath: closedPath(split, n - 1, (i) => (i >= cover ? 1 : i === split ? 0.55 : 0.8)),
    tailPivot: pts[cover],
    spinePath,
    blotches,
    spine: pts,
  };
}

function SnakeHead({ curve, skin, open }: { curve: SnakeCurve; skin: (typeof SNAKE_SKINS)[number]; open: boolean }) {
  const t = `translate(${curve.head.x.toFixed(1)},${curve.head.y.toFixed(1)}) rotate(${curve.headAngle.toFixed(1)}) scale(${open ? 1.45 : 1.18})`;

  // periodic tongue flick (hooks must run regardless of open/closed)
  const flick = useSharedValue(0);
  React.useEffect(() => {
    flick.value = withDelay(
      500 + Math.random() * 2500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 130 }),
          withTiming(0, { duration: 1600 + Math.random() * 1400 }),
        ),
        -1,
        false,
      ),
    );
  }, [flick]);
  const tongueProps = useAnimatedProps(() => ({ opacity: flick.value }));

  // Local space: +x = facing direction (away from body).
  if (!open) {
    return (
      <G transform={t}>
        <Path d="M -16 -15 Q 8 -20 26 -7 Q 33 0 26 7 Q 8 20 -16 15 Q -22 0 -16 -15 Z" fill={skin.base} stroke={skin.shade} strokeWidth={2} />
        <Path d="M -16 -15 Q 8 -20 26 -7 Q 14 -8 -8 -10 Z" fill={skin.shade} opacity={0.45} />
        {/* nostrils */}
        <Circle cx={22} cy={-3.5} r={1.6} fill={skin.shade} />
        <Circle cx={22} cy={3.5} r={1.6} fill={skin.shade} />
        {/* eyes: amber with slit pupil */}
        <Circle cx={6} cy={-9.5} r={5} fill="#FBBF24" stroke={skin.shade} strokeWidth={1.4} />
        <Circle cx={6} cy={9.5} r={5} fill="#FBBF24" stroke={skin.shade} strokeWidth={1.4} />
        <Ellipse cx={6} cy={-9.5} rx={1.2} ry={3.8} fill="#1C1917" />
        <Ellipse cx={6} cy={9.5} rx={1.2} ry={3.8} fill="#1C1917" />
        {/* flicking tongue */}
        <AnimatedG animatedProps={tongueProps}>
          <Path d="M 30 0 L 44 0 M 44 0 L 50 -4 M 44 0 L 50 4" stroke="#DC2626" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </AnimatedG>
      </G>
    );
  }

  // OPEN: gaping jaws, fangs, red mouth, manga impact lines
  return (
    <G transform={t}>
      {/* manga impact lines radiating from the strike */}
      <G stroke="#FFF6E8" strokeWidth={2.6} strokeLinecap="round" opacity={0.9}>
        <Path d="M 34 -22 L 46 -30" fill="none" />
        <Path d="M 40 -6 L 56 -8" fill="none" />
        <Path d="M 40 8 L 56 12" fill="none" />
        <Path d="M 34 24 L 46 33" fill="none" />
        <Path d="M 22 -32 L 28 -44" fill="none" />
        <Path d="M 24 34 L 30 46" fill="none" />
      </G>
      {/* mouth interior */}
      <Path d="M -10 -4 Q 18 -22 34 -24 Q 28 0 34 24 Q 18 22 -10 4 Z" fill="#7F1D1D" stroke="#450A0A" strokeWidth={1.5} />
      <Path d="M -6 0 Q 14 -9 28 -12 Q 24 0 28 12 Q 14 9 -6 0 Z" fill="#B91C1C" />
      {/* tongue lashing out */}
      <Path d="M 6 0 Q 22 2 34 8" stroke="#DC2626" strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* upper jaw */}
      <G transform="rotate(-34)">
        <Path d="M -16 -14 Q 8 -19 27 -6 Q 30 -2 24 1 Q 4 -2 -16 2 Q -21 -6 -16 -14 Z" fill={skin.base} stroke={skin.shade} strokeWidth={2} />
        <Circle cx={7} cy={-9} r={4.6} fill="#FBBF24" stroke={skin.shade} strokeWidth={1.3} />
        <Ellipse cx={7} cy={-9} rx={1.1} ry={3.4} fill="#1C1917" />
        <Circle cx={23} cy={-4} r={1.5} fill={skin.shade} />
        {/* fangs */}
        <Path d="M 19 1 L 16 11 L 12 1 Z" fill="#FAFAF9" stroke="#D6D3D1" strokeWidth={0.8} />
        <Path d="M 26 0 L 23 8 L 20 0 Z" fill="#FAFAF9" stroke="#D6D3D1" strokeWidth={0.8} />
      </G>
      {/* lower jaw */}
      <G transform="rotate(30)">
        <Path d="M -16 14 Q 8 19 26 6 Q 29 2 23 -1 Q 4 2 -16 -2 Q -21 6 -16 14 Z" fill={skin.base} stroke={skin.shade} strokeWidth={2} />
        <Path d="M 17 -1 L 14 -9 L 10 -1 Z" fill="#FAFAF9" stroke="#D6D3D1" strokeWidth={0.8} />
      </G>
    </G>
  );
}

function RealSnake({ curve, index, open }: { curve: SnakeCurve; index: number; open: boolean }) {
  const skin = SNAKE_SKINS[index % SNAKE_SKINS.length];
  const outline = React.useMemo(() => buildOutline(curve.samples), [curve]);
  const gid = `snakeskin${index}`;

  // perpetual tail wag
  const wag = useSharedValue(0);
  React.useEffect(() => {
    const dur = 800 + (index % 4) * 110;
    wag.value = withRepeat(
      withSequence(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), withTiming(-1, { duration: dur, easing: Easing.inOut(Easing.sin) })),
      -1,
      true,
    );
  }, [wag, index]);
  const pivot = outline.tailPivot;
  const tailProps = useAnimatedProps(() => ({
    transform: `rotate(${(wag.value * 7).toFixed(2)} ${pivot.x.toFixed(1)} ${pivot.y.toFixed(1)})`,
  }));

  return (
    <G>
      <Defs>
        <SvgLinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={skin.base} />
          <Stop offset="1" stopColor={skin.shade} />
        </SvgLinearGradient>
      </Defs>
      {/* contact shadow */}
      <G transform="translate(4,7)">
        <Path d={outline.bodyPath} fill="rgba(40,20,5,0.30)" />
        <Path d={outline.tailPath} fill="rgba(40,20,5,0.30)" />
      </G>
      {/* wagging tail (behind body so the seam hides) */}
      <AnimatedG animatedProps={tailProps}>
        <Path d={outline.tailPath} fill={`url(#${gid})`} stroke={skin.shade} strokeWidth={1.5} />
        <Circle cx={curve.tail.x} cy={curve.tail.y} r={4} fill={skin.shade} />
      </AnimatedG>
      {/* body */}
      <Path d={outline.bodyPath} fill={`url(#${gid})`} stroke={skin.shade} strokeWidth={1.5} />
      {/* belly stripe along spine */}
      <Path d={outline.spinePath} stroke={skin.belly} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.32} />
      {/* python blotches */}
      {outline.blotches.map((b, i) => (
        <G key={i} transform={`translate(${b.p.x.toFixed(1)},${b.p.y.toFixed(1)}) rotate(${b.angle.toFixed(1)})`}>
          <Ellipse cx={0} cy={0} rx={b.w * 0.62} ry={b.w * 0.42} fill={skin.blotch} opacity={0.55} />
          <Ellipse cx={0} cy={0} rx={b.w * 0.34} ry={b.w * 0.2} fill={skin.base} opacity={0.5} />
        </G>
      ))}
      {/* highlight along the back */}
      <Path d={outline.spinePath} stroke="rgba(255,255,255,0.16)" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <SnakeHead curve={curve} skin={skin} open={open} />
    </G>
  );
}

// ---------------------------------------------------------------------------
// Wooden ladders

function WoodLadder({ geom, index }: { geom: LadderGeom; index: number }) {
  const railOffset = 14;
  const dx = geom.top.x - geom.bottom.x;
  const dy = geom.top.y - geom.bottom.y;
  const ux = dx / geom.length;
  const uy = dy / geom.length;
  const px = -uy * railOffset;
  const py = ux * railOffset;
  const inset = 16;
  const bx = geom.bottom.x - ux * inset;
  const by = geom.bottom.y - uy * inset;
  const tx = geom.top.x + ux * inset;
  const ty = geom.top.y + uy * inset;

  const rungCount = Math.max(3, Math.floor(geom.length / 58));
  const rungs: React.ReactElement[] = [];
  for (let i = 1; i < rungCount; i++) {
    const f = i / rungCount;
    const cx = bx + (tx - bx) * f;
    const cy = by + (ty - by) * f;
    rungs.push(
      <G key={i}>
        <Line x1={cx + px * 0.94} y1={cy + py * 0.94} x2={cx - px * 0.94} y2={cy - py * 0.94} stroke="#4A2B12" strokeWidth={8.5} strokeLinecap="round" />
        <Line x1={cx + px * 0.86} y1={cy + py * 0.86} x2={cx - px * 0.86} y2={cy - py * 0.86} stroke="#9C6230" strokeWidth={5.5} strokeLinecap="round" />
        <Line x1={cx + px * 0.7} y1={cy + py * 0.7 - 1.4} x2={cx - px * 0.7} y2={cy - py * 0.7 - 1.4} stroke="#C68B4E" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
        {/* nails */}
        <Circle cx={cx + px * 0.82} cy={cy + py * 0.82} r={1.6} fill="#2B1708" />
        <Circle cx={cx - px * 0.82} cy={cy - py * 0.82} r={1.6} fill="#2B1708" />
      </G>,
    );
  }

  const rail = (sx: number, sy: number, ex: number, ey: number, key: string) => (
    <G key={key}>
      <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#4A2B12" strokeWidth={11} strokeLinecap="round" />
      <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke={`url(#wood${index})`} strokeWidth={8} strokeLinecap="round" />
      <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#D9A45F" strokeWidth={2} strokeLinecap="round" opacity={0.65} strokeDasharray="34 26" />
    </G>
  );

  return (
    <G>
      <Defs>
        <SvgLinearGradient id={`wood${index}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#A66A33" />
          <Stop offset="0.5" stopColor="#8A5226" />
          <Stop offset="1" stopColor="#6E3F1B" />
        </SvgLinearGradient>
      </Defs>
      {/* drop shadow */}
      <G transform="translate(5,8)" opacity={0.32}>
        <Line x1={bx + px} y1={by + py} x2={tx + px} y2={ty + py} stroke="#1F1106" strokeWidth={10} strokeLinecap="round" />
        <Line x1={bx - px} y1={by - py} x2={tx - px} y2={ty - py} stroke="#1F1106" strokeWidth={10} strokeLinecap="round" />
      </G>
      {rungs}
      {rail(bx + px, by + py, tx + px, ty + py, 'r1')}
      {rail(bx - px, by - py, tx - px, ty - py, 'r2')}
    </G>
  );
}

// ---------------------------------------------------------------------------
// Board

/** Snakes in their own layer, so jaw state changes never re-render the static board. */
function SnakesLayer({ layout, eating }: { layout: BoardLayout; eating: number }) {
  return (
    <G>
      {layout.snakes.map((s, i) => (
        <RealSnake key={`s${s.from}`} curve={s} index={i} open={eating === s.from} />
      ))}
    </G>
  );
}

interface Props {
  size: number;
  layout: BoardLayout;
  /** cell number of the snake currently swallowing (its jaws gape open), or -1 */
  eating: number;
}

const FRAME = 26;

const StaticBoard = React.memo(function StaticBoard({ layout }: { layout: BoardLayout }) {
  const cells: React.ReactElement[] = [];
  for (let n = 1; n <= 100; n++) {
    const c = cellCenter(n);
    const x = c.x - CELL / 2;
    const y = c.y - CELL / 2;
    const row = Math.floor((n - 1) / 10);
    // checkerboard by GEOMETRIC column (not the zigzag cell number) so colors alternate vertically too
    const col = Math.round((c.x - CELL / 2) / CELL);
    const ivory = (row + col) % 2 === 0;
    cells.push(
      <G key={n}>
        <Rect x={x} y={y} width={CELL} height={CELL} fill={ivory ? theme.cellIvory : theme.cellTan} stroke={theme.cellLine} strokeWidth={1.2} />
        {/* embossed number: light below, dark on top */}
        <SvgText x={x + CELL - 8} y={y + 23} fontSize={17} fontWeight="700" fill="rgba(255,255,255,0.65)" textAnchor="end">
          {n}
        </SvgText>
        <SvgText x={x + CELL - 9} y={y + 22} fontSize={17} fontWeight="700" fill={n === 100 ? '#B45309' : theme.cellNumber} textAnchor="end">
          {n}
        </SvgText>
      </G>,
    );
  }

  const c100 = cellCenter(100);
  const c1 = cellCenter(1);
  const W = BOARD_UNITS + FRAME * 2;

  return (
    <G>
      {/* wooden frame */}
      <Rect x={-FRAME} y={-FRAME} width={W} height={W} rx={20} fill="url(#frameWood)" />
      <Rect x={-FRAME + 5} y={-FRAME + 5} width={W - 10} height={W - 10} rx={16} fill="none" stroke="rgba(255,220,160,0.25)" strokeWidth={2} />
      <Rect x={-6} y={-6} width={BOARD_UNITS + 12} height={BOARD_UNITS + 12} rx={6} fill="none" stroke="#2B1708" strokeWidth={6} />

      {cells}

      {/* start & goal markers */}
      <SvgText x={c1.x} y={c1.y + 32} fontSize={15} fontWeight="800" fill="#8A6D3B" textAnchor="middle" letterSpacing={1}>
        START
      </SvgText>
      <Circle cx={c100.x} cy={c100.y + 6} r={42} fill="url(#goalGlow)" />
      <SvgText x={c100.x} y={c100.y + 22} fontSize={34} textAnchor="middle">
        👑
      </SvgText>

      {layout.ladders.map((g, i) => (
        <WoodLadder key={`l${g.from}`} geom={g} index={i} />
      ))}
    </G>
  );
});

function BoardSvgInner({ size, layout, eating }: Props) {
  const W = BOARD_UNITS + FRAME * 2;
  return (
    <Svg width={size} height={size} viewBox={`${-FRAME} ${-FRAME} ${W} ${W}`}>
      <Defs>
        <SvgLinearGradient id="frameWood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.woodLight} />
          <Stop offset="0.5" stopColor={theme.wood} />
          <Stop offset="1" stopColor={theme.woodDark} />
        </SvgLinearGradient>
        <RadialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
          <Stop offset="0" stopColor="rgba(0,0,0,0)" />
          <Stop offset="0.82" stopColor="rgba(0,0,0,0)" />
          <Stop offset="1" stopColor="rgba(60,30,5,0.30)" />
        </RadialGradient>
        <RadialGradient id="goalGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="rgba(255,180,40,0.55)" />
          <Stop offset="1" stopColor="rgba(255,180,40,0)" />
        </RadialGradient>
      </Defs>

      <StaticBoard layout={layout} />
      <SnakesLayer layout={layout} eating={eating} />

      <Rect x={-FRAME} y={-FRAME} width={W} height={W} rx={20} fill="url(#vignette)" pointerEvents="none" />
    </Svg>
  );
}

export const BoardSvg = React.memo(BoardSvgInner);
