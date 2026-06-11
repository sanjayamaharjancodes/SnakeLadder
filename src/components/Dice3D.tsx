import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
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

export interface DiceHandle {
  /** Tumble the dice and settle on `value`. Resolves when the animation lands. */
  roll(value: number): Promise<void>;
}

interface Props {
  size?: number;
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  // [row, col] on a 3x3 grid in face-local space
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

/*
 * Isometric cube in a 120x120 viewBox. Three faces are visible:
 *
 *        (60,12)            top face:   (22,34)-(60,12)-(98,34)-(60,56)
 *   (22,34)  (98,34)        left face:  (22,34)-(60,56)-(60,100)-(22,78)
 *        (60,56)            right face: (60,56)-(98,34)-(98,78)-(60,100)
 *   (22,78)  (98,78)
 *        (60,100)
 *
 * Pips live in a unit square per face and are mapped onto the face plane with
 * an affine matrix(u.x v.x u.y v.y origin.x origin.y) — circles become
 * correctly foreshortened ellipses for free.
 */
const FACE = {
  top: { matrix: [38, -22, 38, 22, 22, 34], pip: '#42280F' },
  left: { matrix: [38, 22, 0, 44, 22, 34], pip: '#F7EBD3' },
  right: { matrix: [38, -22, 0, 44, 60, 56], pip: '#F7EBD3' },
} as const;

function FacePips({ value, face }: { value: number; face: keyof typeof FACE }) {
  const f = FACE[face];
  const m = f.matrix;
  return (
    <G transform={`matrix(${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]})`}>
      {/* subtle wood grain in the face plane */}
      <Path d="M 0.06 0.3 Q 0.5 0.26 0.94 0.32 M 0.05 0.62 Q 0.5 0.56 0.95 0.64 M 0.08 0.86 Q 0.5 0.82 0.92 0.88" stroke="rgba(43,23,8,0.16)" strokeWidth={0.025} fill="none" />
      {PIP_LAYOUTS[value].map(([r, c], i) => (
        <Circle key={i} cx={0.25 + c * 0.25} cy={0.25 + r * 0.25} r={0.085} fill={f.pip} opacity={0.92} />
      ))}
    </G>
  );
}

/** Real dice: opposite faces sum to 7; pick adjacent faces that can share an edge with `front`. */
function neighbours(front: number): { top: number; left: number } {
  let top = (front % 6) + 1;
  if (top === 7 - front) top = (top % 6) + 1;
  let left = ((top + (front % 3)) % 6) + 1;
  while (left === front || left === 7 - front || left === top || left === 7 - top) {
    left = (left % 6) + 1;
  }
  return { top, left };
}

function IsoCube({ value, size }: { value: number; size: number }) {
  const { top, left } = neighbours(value);
  return (
    <Svg width={size * 1.45} height={size * 1.45} viewBox="0 0 120 120">
      <Defs>
        <SvgLinearGradient id="diceTop" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor="#E3B271" />
          <Stop offset="1" stopColor="#CF9A55" />
        </SvgLinearGradient>
        <SvgLinearGradient id="diceLeft" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A86F38" />
          <Stop offset="1" stopColor="#925E2C" />
        </SvgLinearGradient>
        <SvgLinearGradient id="diceRight" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8A5226" />
          <Stop offset="1" stopColor="#71421C" />
        </SvgLinearGradient>
      </Defs>
      {/* fat round-jointed silhouette first: fakes rounded (sanded) cube edges */}
      <Path d="M 22 34 L 60 12 L 98 34 L 98 78 L 60 100 L 22 78 Z" fill="#925E2C" stroke="#925E2C" strokeWidth={9} strokeLinejoin="round" />
      {/* faces drawn with same-color round strokes so inner edges soften too */}
      <Path d="M 22 34 L 60 12 L 98 34 L 60 56 Z" fill="url(#diceTop)" stroke="url(#diceTop)" strokeWidth={5} strokeLinejoin="round" />
      <Path d="M 22 34 L 60 56 L 60 100 L 22 78 Z" fill="url(#diceLeft)" stroke="url(#diceLeft)" strokeWidth={5} strokeLinejoin="round" />
      <Path d="M 60 56 L 98 34 L 98 78 L 60 100 Z" fill="url(#diceRight)" stroke="url(#diceRight)" strokeWidth={5} strokeLinejoin="round" />
      {/* soft edge light: top bevel catches the light, vertical edge in shade */}
      <Path d="M 22 34 L 60 56 L 98 34" fill="none" stroke="rgba(255,220,160,0.45)" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M 60 56 L 60 100" fill="none" stroke="rgba(43,23,8,0.30)" strokeWidth={2.2} strokeLinecap="round" />
      <FacePips value={top} face="top" />
      <FacePips value={left} face="left" />
      <FacePips value={value} face="right" />
    </Svg>
  );
}

export const Dice3D = forwardRef<DiceHandle, Props>(function Dice3D({ size = 84 }, ref) {
  const [face, setFace] = useState(6);
  const rotZ = useSharedValue(0);
  const flipX = useSharedValue(0);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const glow = useSharedValue(0);
  const idle = useSharedValue(0);

  React.useEffect(() => {
    idle.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [idle]);

  useImperativeHandle(ref, () => ({
    roll(value: number) {
      const DURATION = 1150;
      // anticipation shake, then airborne tumble, then spring landing
      rotZ.value = withSequence(
        withTiming(-12, { duration: 90 }),
        withTiming(12, { duration: 90 }),
        withTiming(720, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withSpring(720, { damping: 9, stiffness: 160 }),
      );
      // a bounded X-axis wobble adds depth without ever flattening the cube
      flipX.value = withSequence(
        withTiming(1, { duration: 240 }),
        withTiming(-1, { duration: 240 }),
        withTiming(1, { duration: 240 }),
        withSpring(0, { damping: 8, stiffness: 180 }),
      );
      lift.value = withSequence(
        withTiming(-size * 0.6, { duration: 420, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 380, easing: Easing.bounce }),
      );
      scale.value = withSequence(
        withTiming(0.88, { duration: 160 }),
        withTiming(1.16, { duration: 420 }),
        withSpring(1, { damping: 7, stiffness: 220 }),
      );
      glow.value = withDelay(880, withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 600 })));

      // shuffle visible pips while airborne
      let elapsed = 0;
      const shuffle = setInterval(() => {
        elapsed += 90;
        if (elapsed >= 880) {
          clearInterval(shuffle);
          setFace(value);
        } else {
          setFace(1 + Math.floor(Math.random() * 6));
        }
      }, 90);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          rotZ.value = withSpring(0, { damping: 12, stiffness: 120 });
          resolve();
        }, DURATION);
      });
    },
  }));

  const cubeStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { translateY: lift.value + interpolate(idle.value, [0, 1], [0, -5]) },
      { rotateZ: `${rotZ.value + interpolate(idle.value, [0, 1], [-2, 2])}deg` },
      { rotateX: `${flipX.value * 24}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.7 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lift.value, [-size * 0.6, 0], [0.16, 0.4]),
    transform: [{ scaleX: interpolate(lift.value, [-size * 0.6, 0], [0.6, 1]) }],
  }));

  return (
    <View style={{ width: size * 1.6, height: size * 1.8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size,
            backgroundColor: 'rgba(255,201,60,0.35)',
            top: 0,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={cubeStyle}>
        <IsoCube value={face} size={size} />
      </Animated.View>
      <Animated.View
        style={[
          {
            width: size * 1.05,
            height: size * 0.18,
            borderRadius: size,
            backgroundColor: '#000',
            marginTop: -size * 0.12,
          },
          shadowStyle,
        ]}
      />
    </View>
  );
});
