import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type WeatherKind = 'clear' | 'rain' | 'snow';
export type WeatherSetting = WeatherKind | 'random';
export type TimeSetting = 'day' | 'night';

export function resolveWeather(setting: WeatherSetting): WeatherKind {
  if (setting !== 'random') return setting;
  const all: WeatherKind[] = ['clear', 'rain', 'snow'];
  return all[Math.floor(Math.random() * all.length)];
}

function RainDrop({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  const cfg = useMemo(
    () => ({
      x: Math.random() * width,
      delay: Math.random() * 2400,
      dur: 800 + Math.random() * 600,
      len: 22 + Math.random() * 22,
      opacity: 0.14 + Math.random() * 0.18,
      drift: 24 + Math.random() * 18, // wind: drops slant left->right
    }),
    [index, width],
  );
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withDelay(cfg.delay, withRepeat(withTiming(1, { duration: cfg.dur, easing: Easing.in(Easing.linear) }), -1, false));
  }, [t, cfg]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.04 || t.value > 0.96 ? 0 : cfg.opacity,
    transform: [
      { translateX: cfg.x + t.value * cfg.drift },
      { translateY: -60 + t.value * (height + 120) },
      { rotate: '8deg' },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: 2, height: cfg.len, borderRadius: 2, backgroundColor: '#BFD9F2' },
        style,
      ]}
    />
  );
}

function SnowFlake({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  const cfg = useMemo(
    () => ({
      x: Math.random() * width,
      delay: Math.random() * 7000,
      dur: 5200 + Math.random() * 5000,
      size: 2.5 + Math.random() * 4,
      opacity: 0.25 + Math.random() * 0.35,
      sway: 14 + Math.random() * 26,
      swayFreq: 2 + Math.random() * 2,
    }),
    [index, width],
  );
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withDelay(cfg.delay, withRepeat(withTiming(1, { duration: cfg.dur, easing: Easing.linear }), -1, false));
  }, [t, cfg]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.03 || t.value > 0.97 ? 0 : cfg.opacity,
    transform: [
      { translateX: cfg.x + Math.sin(t.value * Math.PI * cfg.swayFreq) * cfg.sway },
      { translateY: -20 + t.value * (height + 40) },
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
          backgroundColor: '#FFFFFF',
          shadowColor: '#FFF',
          shadowOpacity: 0.8,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

/**
 * Live weather: a fixed kind stays put; 'random' starts on a random kind and
 * then drifts to a different one every 30-45s with a soft cross-fade,
 * so the sky changes during a long game.
 */
export function DynamicWeather({ setting }: { setting: WeatherSetting }) {
  const [kind, setKind] = React.useState<WeatherKind>(() => resolveWeather(setting));
  const fade = useSharedValue(1);

  React.useEffect(() => {
    if (setting !== 'random') {
      setKind(setting);
      return;
    }
    let swapTimer: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      fade.value = withTiming(0, { duration: 1600 });
      swapTimer = setTimeout(() => {
        setKind((current) => {
          const others = (['clear', 'rain', 'snow'] as WeatherKind[]).filter((k) => k !== current);
          return others[Math.floor(Math.random() * others.length)];
        });
        fade.value = withTiming(1, { duration: 1600 });
      }, 1700);
    }, 30000 + Math.random() * 15000);
    return () => {
      clearInterval(id);
      clearTimeout(swapTimer);
    };
  }, [setting, fade]);

  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <WeatherOverlay kind={kind} />
    </Animated.View>
  );
}

function Star({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  const cfg = useMemo(
    () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.32, // stars live in the upper sky
      size: 1.5 + Math.random() * 2,
      delay: Math.random() * 4000,
      dur: 1600 + Math.random() * 2600,
      peak: 0.4 + Math.random() * 0.5,
    }),
    [index, width, height],
  );
  const tw = useSharedValue(0);
  React.useEffect(() => {
    tw.value = withDelay(cfg.delay, withRepeat(withTiming(1, { duration: cfg.dur, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [tw, cfg]);
  const style = useAnimatedStyle(() => ({ opacity: 0.12 + tw.value * cfg.peak }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: cfg.x,
          top: cfg.y,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size,
          backgroundColor: '#FFF8E7',
        },
        style,
      ]}
    />
  );
}

/** Night: a soft moonlit tint, twinkling stars, and a faint crescent moon. */
export function NightOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,12,40,0.30)' }]} />
      {Array.from({ length: 14 }, (_, i) => (
        <Star key={i} index={i} />
      ))}
      {/* soft glowing moon */}
      <View
        style={{
          position: 'absolute',
          top: 14,
          right: 18,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: '#F4EEDA',
          opacity: 0.5,
          shadowColor: '#FFF6D8',
          shadowOpacity: 0.9,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

/** Full-screen ambient weather, layered above the game but below modals. */
export function WeatherOverlay({ kind }: { kind: WeatherKind }) {
  if (kind === 'clear') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {kind === 'rain' && (
        <>
          {/* gentle cool tint */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(25,45,85,0.08)' }]} />
          {Array.from({ length: 14 }, (_, i) => (
            <RainDrop key={i} index={i} />
          ))}
        </>
      )}
      {kind === 'snow' && (
        <>
          {/* faint cold brightness */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(190,215,255,0.04)' }]} />
          {Array.from({ length: 12 }, (_, i) => (
            <SnowFlake key={i} index={i} />
          ))}
        </>
      )}
    </View>
  );
}
