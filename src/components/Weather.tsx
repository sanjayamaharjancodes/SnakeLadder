import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
export type TimeSetting = 'day' | 'night' | 'auto';

export function resolveWeather(setting: WeatherSetting): WeatherKind {
  if (setting !== 'random') return setting;
  const all: WeatherKind[] = ['clear', 'rain', 'snow'];
  return all[Math.floor(Math.random() * all.length)];
}

/** Sunrise/sunset for a date and place (compact NOAA-style approximation). */
function sunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } | null {
  const rad = Math.PI / 180;
  const dayMs = 86400000;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const toJulian = (d: Date) => d.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);

  const lw = rad * -lng;
  const phi = rad * lat;
  const n = Math.round(toJulian(date) - J2000 - 0.0009 - lw / (2 * Math.PI));
  const ds = J2000 + 0.0009 + lw / (2 * Math.PI) + n;
  const M = rad * (357.5291 + 0.98560028 * (ds - J2000));
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + rad * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
  const Jtransit = ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  // sun centre 0.833 deg below the horizon = visual sunrise/sunset
  const cosH = (Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null; // polar day / polar night
  const H = Math.acos(cosH);
  const Jset = Jtransit + H / (2 * Math.PI);
  const Jrise = Jtransit - H / (2 * Math.PI);
  return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset) };
}

function clockFallback(): 'day' | 'night' {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
}

/**
 * Resolves the day/night setting. 'auto' follows the real sky: it asks for the
 * device location once and uses local sunrise/sunset; if permission is denied
 * (or location is unavailable) it falls back to the device clock (6:00-18:00 =
 * day). Re-evaluated every few minutes so dusk/dawn happens during play.
 */
export function useResolvedTime(setting: TimeSetting): 'day' | 'night' {
  const [auto, setAuto] = React.useState<'day' | 'night'>(clockFallback);
  const coords = React.useRef<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (setting !== 'auto') return;
    let active = true;

    const evaluate = () => {
      const now = new Date();
      const sun = coords.current && sunTimes(now, coords.current.lat, coords.current.lng);
      const next = sun ? (now >= sun.sunrise && now < sun.sunset ? 'day' : 'night') : clockFallback();
      if (active) setAuto(next);
    };

    evaluate();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }));
        if (pos) {
          coords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          evaluate();
        }
      } catch {
        // stay on the clock fallback
      }
    })();
    const id = setInterval(evaluate, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [setting]);

  return setting === 'auto' ? auto : setting;
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

/** Night: a soft moonlit tint, twinkling stars, and a faint glowing moon. */
export function NightOverlay() {
  const insets = useSafeAreaInsets();
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
          top: insets.top + 12,
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
