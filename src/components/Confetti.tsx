import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#FFC93C', '#22D3EE', '#FB7185', '#4ADE80', '#A78BFA', '#F97316', '#F4F6FF'];

function Piece({ index }: { index: number }) {
  const { width, height } = Dimensions.get('window');
  const cfg = useMemo(
    () => ({
      x: Math.random() * width,
      delay: Math.random() * 1800,
      fall: 2400 + Math.random() * 2200,
      drift: (Math.random() - 0.5) * 140,
      size: 7 + Math.random() * 8,
      color: COLORS[index % COLORS.length],
      spinDir: Math.random() > 0.5 ? 1 : -1,
      round: Math.random() > 0.6,
    }),
    [index, width],
  );

  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withDelay(cfg.delay, withRepeat(withTiming(1, { duration: cfg.fall, easing: Easing.in(Easing.quad) }), -1, false));
  }, [t, cfg]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.05 ? 0 : 1 - t.value * 0.5,
    transform: [
      { translateX: cfg.x + Math.sin(t.value * 6) * cfg.drift * 0.3 + t.value * cfg.drift },
      { translateY: -30 + t.value * (height + 60) },
      { rotate: `${t.value * 720 * cfg.spinDir}deg` },
      { rotateX: `${t.value * 540}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: cfg.size,
          height: cfg.size * (cfg.round ? 1 : 0.55),
          borderRadius: cfg.round ? cfg.size : 1.5,
          backgroundColor: cfg.color,
        },
        style,
      ]}
    />
  );
}

export function Confetti({ count = 70 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}

/** Slow drifting glowing orbs used behind menus and the board. */
export function FloatingOrbs({ count = 8 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <Orb key={i} index={i} />
      ))}
    </View>
  );
}

function Orb({ index }: { index: number }) {
  const { width, height } = Dimensions.get('window');
  const cfg = useMemo(
    () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 40 + Math.random() * 110,
      dur: 5200 + Math.random() * 4800,
      dx: (Math.random() - 0.5) * 90,
      dy: (Math.random() - 0.5) * 120,
      color: ['rgba(255,190,90,0.10)', 'rgba(255,150,60,0.08)', 'rgba(255,220,150,0.07)', 'rgba(210,130,60,0.10)'][index % 4],
    }),
    [index, width, height],
  );
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: cfg.dur, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, cfg]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: cfg.x + t.value * cfg.dx },
      { translateY: cfg.y + t.value * cfg.dy },
      { scale: 0.9 + t.value * 0.25 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size,
          backgroundColor: cfg.color,
        },
        style,
      ]}
    />
  );
}
