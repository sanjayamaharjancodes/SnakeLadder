import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Point } from '../game/board';
import { Hero } from '../game/heroes';
import { ChibiHero } from './ChibiHero';

export interface TokenHandle {
  /** Teleport instantly (initial placement). Cancels any running animation. */
  place(p: Point): void;
  /** One bouncy hop to a neighbouring cell. Resolves on landing. */
  hop(p: Point): Promise<void>;
  /** Follow a sampled curve. Snakes: swallowed at the head, travels as a bulge, pops out at the tail. */
  slide(points: Point[], totalMs: number, kind: 'snake' | 'ladder'): Promise<void>;
  /** Fly back home after being captured. */
  knockHome(p: Point): Promise<void>;
  /** Victory dance. */
  celebrate(): void;
  setActive(active: boolean): void;
}

interface Props {
  hero: Hero;
  size: number;
}

const HOP_MS = 230;

export const Token = forwardRef<TokenHandle, Props>(function Token({ hero, size }, ref) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const jump = useSharedValue(0);
  const squash = useSharedValue(1);
  const tilt = useSharedValue(0);
  const heroScale = useSharedValue(1);
  const bulge = useSharedValue(0);
  const pulse = useSharedValue(0);
  const activeSV = useSharedValue(0);
  const wobble = useSharedValue(0);
  const [ko, setKo] = useState(false);

  // perpetual gentle 3D sway, like a figurine turning on its base
  useEffect(() => {
    wobble.value = withRepeat(withTiming(1, { duration: 2600 + Math.random() * 800, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [wobble]);

  useImperativeHandle(ref, () => ({
    place(p) {
      [x, y, jump, squash, tilt, heroScale, bulge].forEach(cancelAnimation);
      x.value = p.x;
      y.value = p.y;
      jump.value = 0;
      squash.value = 1;
      tilt.value = 0;
      heroScale.value = 1;
      bulge.value = 0;
      setKo(false);
    },
    hop(p) {
      x.value = withTiming(p.x, { duration: HOP_MS, easing: Easing.inOut(Easing.quad) });
      y.value = withTiming(p.y, { duration: HOP_MS, easing: Easing.inOut(Easing.quad) });
      jump.value = withSequence(
        withTiming(-size * 0.7, { duration: HOP_MS * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: HOP_MS * 0.5, easing: Easing.in(Easing.quad) }),
      );
      squash.value = withSequence(
        withTiming(1.12, { duration: HOP_MS * 0.5 }),
        withTiming(0.84, { duration: HOP_MS * 0.35 }),
        withSpring(1, { damping: 6, stiffness: 320 }),
      );
      tilt.value = withSequence(withTiming(7, { duration: HOP_MS * 0.5 }), withTiming(0, { duration: HOP_MS * 0.5 }));
      return new Promise((r) => setTimeout(r, HOP_MS + 40));
    },
    slide(points, totalMs, kind) {
      const per = totalMs / points.length;
      if (kind === 'snake') {
        const SWALLOW = 320;
        const POP = 360;
        // hero vanishes into the jaws...
        heroScale.value = withTiming(0, { duration: SWALLOW, easing: Easing.in(Easing.back(1.5)) });
        bulge.value = withDelay(SWALLOW - 80, withTiming(1, { duration: 160 }));
        // ...the bulge travels the body...
        x.value = withDelay(SWALLOW, withSequence(...points.map((p) => withTiming(p.x, { duration: per, easing: Easing.linear }))));
        y.value = withDelay(SWALLOW, withSequence(...points.map((p) => withTiming(p.y, { duration: per, easing: Easing.linear }))));
        // ...and the hero pops out at the tail, dazed
        bulge.value = withDelay(SWALLOW + totalMs, withTiming(0, { duration: 120 }));
        heroScale.value = withDelay(SWALLOW + totalMs, withSpring(1, { damping: 6, stiffness: 220 }));
        jump.value = withDelay(SWALLOW + totalMs, withSequence(withTiming(-size * 0.8, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 200, easing: Easing.bounce })));
        setTimeout(() => setKo(true), SWALLOW);
        setTimeout(() => setKo(false), SWALLOW + totalMs + 1400);
        return new Promise((r) => setTimeout(r, SWALLOW + totalMs + POP));
      }
      // ladder: rhythmic rung-by-rung climb
      x.value = withSequence(...points.map((p) => withTiming(p.x, { duration: per, easing: Easing.linear })));
      y.value = withSequence(...points.map((p) => withTiming(p.y, { duration: per, easing: Easing.linear })));
      const rungs = Math.max(4, Math.floor(points.length / 3));
      jump.value = withRepeat(
        withSequence(withTiming(-size * 0.3, { duration: totalMs / rungs / 2 }), withTiming(0, { duration: totalMs / rungs / 2 })),
        rungs,
        false,
      );
      tilt.value = withSequence(withTiming(-6, { duration: totalMs / 2 }), withTiming(0, { duration: totalMs / 2 }));
      return new Promise((r) => setTimeout(r, totalMs + 80));
    },
    knockHome(p) {
      const D = 720;
      setKo(true);
      jump.value = withSequence(
        withTiming(-size * 2.1, { duration: D * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: D * 0.55, easing: Easing.bounce }),
      );
      tilt.value = withSequence(withTiming(360, { duration: D, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 0 }));
      x.value = withTiming(p.x, { duration: D, easing: Easing.inOut(Easing.quad) });
      y.value = withTiming(p.y, { duration: D, easing: Easing.inOut(Easing.quad) });
      setTimeout(() => setKo(false), D + 1200);
      return new Promise((r) => setTimeout(r, D + 60));
    },
    celebrate() {
      jump.value = withRepeat(
        withSequence(
          withTiming(-size * 1.0, { duration: 330, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 330, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
      tilt.value = withRepeat(withSequence(withTiming(-14, { duration: 330 }), withTiming(14, { duration: 330 })), -1, true);
    },
    setActive(active) {
      activeSV.value = withTiming(active ? 1 : 0, { duration: 200 });
      if (active) {
        pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }), -1, true);
      } else {
        cancelAnimation(pulse);
        pulse.value = withTiming(0, { duration: 150 });
      }
    },
  }));

  // container anchored so the hero's FEET sit on (x, y)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - size / 2 },
      { translateY: y.value - size * 1.18 },
    ],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroScale.value < 0.05 ? 0 : 1,
    transform: [
      { translateY: jump.value },
      { perspective: 500 },
      { rotateY: `${interpolate(wobble.value, [0, 1], [-7, 7])}deg` },
      { rotateZ: `${tilt.value}deg` },
      { scale: heroScale.value },
      { scaleY: squash.value },
      { scaleX: 1 + (1 - squash.value) * 0.5 },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: heroScale.value * interpolate(jump.value, [-size * 2, 0], [0.12, 0.4]),
    transform: [{ scaleX: interpolate(jump.value, [-size * 2, 0], [0.55, 1]) }],
  }));

  const markerStyle = useAnimatedStyle(() => ({
    opacity: activeSV.value,
    transform: [{ translateY: pulse.value * -7 }],
  }));

  const bulgeStyle = useAnimatedStyle(() => ({
    opacity: bulge.value * 0.9,
    transform: [{ scale: 0.6 + bulge.value * 0.4 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size * 1.3 }, containerStyle]}>
      {/* bouncing "your turn" arrow above the head */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -size * 0.42,
            left: size / 2 - size * 0.17,
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.17,
            borderRightWidth: size * 0.17,
            borderTopWidth: size * 0.24,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: hero.color,
          },
          markerStyle,
        ]}
      />
      {/* contact shadow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: size * 0.08,
            width: size * 0.84,
            height: size * 0.22,
            borderRadius: size,
            backgroundColor: '#000',
          },
          shadowStyle,
        ]}
      />
      {/* the travelling lump inside the snake */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.45,
            left: size * 0.22,
            width: size * 0.56,
            height: size * 0.42,
            borderRadius: size,
            backgroundColor: 'rgba(54,83,20,0.85)',
            borderWidth: 2,
            borderColor: 'rgba(26,46,5,0.9)',
          },
          bulgeStyle,
        ]}
      />
      <Animated.View style={heroStyle}>
        <ChibiHero hero={hero} size={size} koEyes={ko} />
      </Animated.View>
    </Animated.View>
  );
});
