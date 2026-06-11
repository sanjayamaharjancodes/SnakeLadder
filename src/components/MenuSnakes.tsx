import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/**
 * Decorative snakes that slither across the home screen.
 * Each snake is a chain of segments; every segment follows a sine wave with a
 * phase shift, so the whole chain undulates while gliding across the screen.
 */

const SEGMENTS = 12;

function Slitherer({ y, dir, speed, scale, colors, delayPhase }: { y: number; dir: 1 | -1; speed: number; scale: number; colors: [string, string]; delayPhase: number }) {
  const { width } = useWindowDimensions();
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.linear }), -1, false);
  }, [t, speed]);

  const segs = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => i), []);
  const segSize = 16 * scale;
  const span = width + 260 * scale;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
      {segs.map((i) => (
        <Segment key={i} index={i} t={t} y={y} dir={dir} span={span} segSize={segSize} scale={scale} colors={colors} delayPhase={delayPhase} isHead={i === 0} />
      ))}
    </View>
  );
}

function Segment({
  index,
  t,
  y,
  dir,
  span,
  segSize,
  scale,
  colors,
  delayPhase,
  isHead,
}: {
  index: number;
  t: SharedValue<number>;
  y: number;
  dir: 1 | -1;
  span: number;
  segSize: number;
  scale: number;
  colors: [string, string];
  delayPhase: number;
  isHead: boolean;
}) {
  const style = useAnimatedStyle(() => {
    // head leads, body follows with a spatial lag (segments overlap into a body)
    const lag = index * 8.5 * scale;
    const head = t.value * span - 130 * scale;
    const x = dir === 1 ? head - lag : span - head + lag - 130 * scale;
    const wave = Math.sin((t.value * span - lag) * 0.045 + delayPhase) * 14 * scale;
    return {
      transform: [{ translateX: x }, { translateY: y + wave }],
    };
  });

  const size = isHead ? segSize * 1.5 : segSize * (1 - index * 0.045);
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: index % 2 === 0 ? colors[0] : colors[1],
          opacity: 0.55,
        },
        style,
      ]}
    >
      {isHead && (
        <>
          <View style={{ position: 'absolute', top: size * 0.18, left: size * 0.15, width: size * 0.22, height: size * 0.22, borderRadius: size, backgroundColor: '#FBBF24' }} />
          <View style={{ position: 'absolute', bottom: size * 0.18, left: size * 0.15, width: size * 0.22, height: size * 0.22, borderRadius: size, backgroundColor: '#FBBF24' }} />
        </>
      )}
    </Animated.View>
  );
}

export function MenuSnakes() {
  const { height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Slitherer y={height * 0.16} dir={1} speed={16000} scale={1} colors={['#4D7C0F', '#365314']} delayPhase={0} />
      <Slitherer y={height * 0.55} dir={-1} speed={22000} scale={0.8} colors={['#92400E', '#5F2A09']} delayPhase={2} />
      <Slitherer y={height * 0.82} dir={1} speed={19000} scale={0.6} colors={['#57534E', '#33302C']} delayPhase={4} />
    </View>
  );
}
