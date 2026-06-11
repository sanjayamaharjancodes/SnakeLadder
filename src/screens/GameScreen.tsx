import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AdBanner } from '../components/AdBanner';
import { BoardSvg } from '../components/BoardSvg';
import { WoodBackground } from '../components/WoodBackground';
import { Dice3D, DiceHandle } from '../components/Dice3D';
import { FloatingOrbs } from '../components/Confetti';
import { Token, TokenHandle } from '../components/Token';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DynamicWeather, NightOverlay, useResolvedTime } from '../components/Weather';
import { WinOverlay } from '../components/WinOverlay';
import { BOARD_UNITS, BoardLayout, cellCenter, CLASSIC_LAYOUT, ladderSamples, makeRandomLayout, Point } from '../game/board';
import { Hero, heroById } from '../game/heroes';
import { Phase, Player, resolveMove, rollDice } from '../game/engine';
import { GameSetup } from './MenuScreen';
import { theme } from '../theme';

/** Must match BoardSvg's wooden frame width (viewBox margin). */
const FRAME = 26;

function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else
      Haptics.impactAsync(
        kind === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : kind === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy,
      );
  } catch {}
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Props {
  setup: GameSetup;
  onExit(): void;
}

export function GameScreen({ setup, onExit }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // bottom row hosts home dock + dice side by side; board takes ALL remaining height
  const ROW_H = 102;
  const diceSize = 54;
  // chrome: safe areas + top padding + bar + chips + bottom row + ad slot + margins
  const boardPx = Math.min(width - 8, height - (insets.top + insets.bottom + 14 + 30 + 32 + ROW_H + 56 + 10));
  const dockW = boardPx - diceSize * 1.6 - 10;
  // board px per viewBox unit; viewBox spans the frame too
  const unitScale = boardPx / (BOARD_UNITS + FRAME * 2);
  const toPx = useCallback((u: number) => (u + FRAME) * unitScale, [unitScale]);
  const tokenSize = Math.max(26, boardPx / 11.5);
  const resolvedTime = useResolvedTime(setup.time);

  const heroes: Hero[] = setup.slots.map((s) => heroById(s.heroId));

  const makePlayers = useCallback(
    (): Player[] =>
      setup.slots.map((s, i) => ({
        id: i,
        name: heroById(s.heroId).name,
        isCpu: s.isCpu,
        pos: 0,
      })),
    [setup],
  );

  // Authoritative state lives in refs (animation sequencing is async); React state mirrors it for rendering.
  const playersRef = useRef<Player[]>(makePlayers());
  const [players, setPlayers] = useState<Player[]>(playersRef.current);
  const currentRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const phaseRef = useRef<Phase>('idle');
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState<{ text: string; id: number }>({ text: 'Roll to start!', id: 0 });
  const msgId = useRef(0);

  const diceRef = useRef<DiceHandle>(null);
  const tokenRefs = useRef<(TokenHandle | null)[]>([]);

  // cell of the snake whose jaws are currently gaping (-1 = none)
  const [eating, setEating] = useState(-1);

  const [layout, setLayout] = useState<BoardLayout>(() => (setup.randomBoard ? makeRandomLayout() : CLASSIC_LAYOUT));
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const say = useCallback((text: string) => {
    msgId.current += 1;
    setMessage({ text, id: msgId.current });
  }, []);

  /** Per-player offset so stacked tokens stay visible (up to 6 in a loose ring). */
  const laneOffset = useCallback(
    (id: number): Point => {
      const o = tokenSize * 0.2;
      const lanes = [
        { x: -o, y: -o * 0.6 },
        { x: o, y: -o * 0.6 },
        { x: -o, y: o * 0.6 },
        { x: o, y: o * 0.6 },
        { x: 0, y: -o },
        { x: 0, y: o },
      ];
      return lanes[id % lanes.length];
    },
    [tokenSize],
  );

  const dockPoint = useCallback(
    (id: number): Point => ({
      x: dockW * (0.11 + id * 0.15),
      y: boardPx + ROW_H * 0.58,
    }),
    [boardPx, dockW],
  );

  const cellPoint = useCallback(
    (cell: number, id: number): Point => {
      const c = cellCenter(cell);
      const lane = laneOffset(id);
      return { x: toPx(c.x) + lane.x, y: toPx(c.y) + lane.y };
    },
    [toPx, laneOffset],
  );

  const pointFor = useCallback(
    (pos: number, id: number): Point => (pos === 0 ? dockPoint(id) : cellPoint(pos, id)),
    [dockPoint, cellPoint],
  );

  const curveToPx = useCallback(
    (pts: Point[], id: number): Point[] => {
      const lane = laneOffset(id);
      return pts.map((p) => ({ x: toPx(p.x) + lane.x, y: toPx(p.y) + lane.y }));
    },
    [toPx, laneOffset],
  );

  useEffect(() => {
    playersRef.current.forEach((p) => tokenRefs.current[p.id]?.place(pointFor(p.pos, p.id)));
    tokenRefs.current.forEach((t, i) => t?.setActive(i === currentRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardPx]);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const doRoll = useCallback(async () => {
    if (phaseRef.current !== 'idle') return;
    setPhaseBoth('rolling');
    const mover = playersRef.current[currentRef.current];
    const value = rollDice();
    haptic('light');
    await diceRef.current?.roll(value);
    haptic('medium');

    const { steps, finalPos, extraTurn, won } = resolveMove(mover, value, playersRef.current, layoutRef.current);
    setPhaseBoth('moving');
    const token = tokenRefs.current[mover.id];
    const landed = mover.pos + value;

    for (const step of steps) {
      if (step.kind === 'blocked') {
        say(`Rolled ${value} — need exactly ${100 - mover.pos} to win!`);
        haptic('error');
        await sleep(900);
      } else if (step.kind === 'hop' && step.cells) {
        say(`${mover.name} rolled ${value}`);
        for (const cell of step.cells) {
          await token?.hop(cellPoint(cell, mover.id));
        }
      } else if (step.kind === 'snake' && step.to !== undefined) {
        const match = layoutRef.current.snakes.find((s) => s.from === landed);
        if (match) {
          say('🐍 CHOMP! Swallowed whole...');
          haptic('heavy');
          // jaws snap open and hold while the hero is gulped down...
          setEating(landed);
          await sleep(550);
          const slidePromise = token?.slide(curveToPx(match.samples, mover.id), 1150, 'snake');
          await sleep(600);
          // ...mouth closes while the bulge travels the body
          setEating(-1);
          await slidePromise;
          haptic('error');
        }
      } else if (step.kind === 'ladder' && step.to !== undefined) {
        say('🪜 Ladder! Climbing up...');
        haptic('success');
        await sleep(300);
        const geom = layoutRef.current.ladders.find((g) => g.from === landed);
        if (geom) {
          await token?.slide(curveToPx(ladderSamples(geom), mover.id), 950, 'ladder');
        }
      } else if (step.kind === 'capture' && step.victimId !== undefined) {
        const victim = playersRef.current.find((p) => p.id === step.victimId)!;
        say(`💥 ${victim.name} got bumped home!`);
        haptic('heavy');
        await tokenRefs.current[victim.id]?.knockHome(dockPoint(victim.id));
        victim.pos = 0;
      }
    }

    mover.pos = finalPos;
    setPlayers([...playersRef.current.map((p) => ({ ...p }))]);

    if (won) {
      setPhaseBoth('won');
      haptic('success');
      token?.celebrate();
      say(`🏆 ${mover.name} wins!`);
      await sleep(700);
      setWinner({ ...mover });
      return;
    }

    if (extraTurn) {
      say(`🎲 ${mover.name} rolled a 6 — roll again!`);
    } else {
      currentRef.current = (currentRef.current + 1) % playersRef.current.length;
      setCurrent(currentRef.current);
    }
    tokenRefs.current.forEach((t, i) => t?.setActive(i === currentRef.current));
    setPhaseBoth('idle');
  }, [cellPoint, curveToPx, dockPoint, say]);

  // CPU turns
  useEffect(() => {
    const p = players[current];
    if (!winner && p?.isCpu && phase === 'idle') {
      say(`🤖 ${p.name} is thinking...`);
      const t = setTimeout(() => doRoll(), 1100);
      return () => clearTimeout(t);
    }
  }, [current, phase, winner, players, doRoll, say]);

  const restart = useCallback(() => {
    playersRef.current = makePlayers();
    setPlayers(playersRef.current);
    currentRef.current = 0;
    setCurrent(0);
    setWinner(null);
    setEating(-1);
    if (setup.randomBoard) setLayout(makeRandomLayout());
    setPhaseBoth('idle');
    say('Roll to start!');
    requestAnimationFrame(() => {
      playersRef.current.forEach((p) => tokenRefs.current[p.id]?.place(pointFor(p.pos, p.id)));
      tokenRefs.current.forEach((t, i) => t?.setActive(i === 0));
    });
  }, [makePlayers, pointFor, say, setup.randomBoard]);

  const activePlayer = players[current];
  const canRoll = phase === 'idle' && !activePlayer?.isCpu && !winner;

  // pulsing ring around the dice when it's a human's turn to roll
  const hint = useSharedValue(0);
  useEffect(() => {
    hint.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [hint]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: canRoll ? 0.25 + hint.value * 0.55 : 0,
    transform: [{ scale: 1 + hint.value * 0.06 }],
  }));

  return (
    <LinearGradient colors={[theme.bgTop, theme.bgMid, theme.bgBottom]} style={{ flex: 1 }}>
      <WoodBackground />
      <FloatingOrbs count={6} />
      <View style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 14, paddingBottom: insets.bottom }}>
        {/* top bar */}
        <View style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 12, alignItems: 'center' }}>
          <Pressable onPress={onExit} style={styles.exitBtn}>
            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>✕</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Animated.Text key={message.id} entering={FadeInUp.springify()} style={styles.message} numberOfLines={1}>
            {message.text}
          </Animated.Text>
          <View style={{ flex: 1 }} />
          <View style={{ width: 34 }} />
        </View>

        {/* player chips */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 8 }}>
          {players.map((p, i) => {
            const hero = heroes[p.id];
            const active = i === current && !winner;
            return (
              <View key={p.id} style={[styles.chip, active && { borderColor: hero.color, backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <View style={[styles.chipDot, { backgroundColor: hero.color }]} />
                <Text style={{ color: active ? theme.text : theme.textDim, fontWeight: '800', fontSize: 11 }}>
                  {p.isCpu ? '🤖' : ''}
                  {p.name} · {p.pos === 0 ? '—' : p.pos}
                </Text>
              </View>
            );
          })}
        </View>

        {/* board + tokens + bottom row (home dock | dice) */}
        <View style={{ width: boardPx, height: boardPx + ROW_H, marginTop: 6 }}>
          <BoardSvg size={boardPx} layout={layout} eating={eating} />
          <View style={[styles.dock, { top: boardPx + 4, width: dockW, height: ROW_H - 8 }]} />
          <View style={{ position: 'absolute', top: boardPx - 2, right: 0, alignItems: 'center' }}>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: diceSize * 0.32,
                  width: diceSize * 1.6,
                  height: diceSize * 1.5,
                  borderRadius: 22,
                  borderWidth: 2.5,
                  borderColor: theme.gold,
                },
                ringStyle,
              ]}
            />
            <Pressable
              onPress={doRoll}
              disabled={!canRoll}
              accessibilityRole="button"
              accessibilityLabel="Roll the dice"
              hitSlop={14}
            >
              <Dice3D ref={diceRef} size={diceSize} />
            </Pressable>
          </View>
          {players.map((p) => (
            <Token
              key={p.id}
              ref={(h) => {
                tokenRefs.current[p.id] = h;
              }}
              hero={heroes[p.id]}
              size={tokenSize}
            />
          ))}
        </View>

        <AdBanner flexible />
      </View>

      {resolvedTime === 'night' && <NightOverlay />}
      <DynamicWeather setting={setup.weather} />

      {winner && (
        <WinOverlay hero={heroes[winner.id]} onPlayAgain={restart} onMenu={onExit} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  exitBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(255,201,60,0.5)',
    textShadowRadius: 10,
    maxWidth: 250,
    textAlign: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.panel,
    borderWidth: 1.5,
    borderColor: theme.panelBorder,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dock: {
    position: 'absolute',
    left: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'flex-end',
    paddingTop: 4,
    paddingRight: 8,
    flexDirection: 'row-reverse',
  },
});
