import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AdBanner } from '../components/AdBanner';
import { ChibiHero } from '../components/ChibiHero';
import { FloatingOrbs } from '../components/Confetti';
import { MenuSnakes } from '../components/MenuSnakes';
import { WoodBackground } from '../components/WoodBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSfx, setSoundEnabled } from '../audio';
import { NightOverlay, TimeSetting, useResolvedTime, WeatherSetting } from '../components/Weather';
import { Hero, HEROES } from '../game/heroes';
import { theme } from '../theme';

export interface PlayerSlot {
  heroId: string;
  isCpu: boolean;
}

export interface GameSetup {
  slots: PlayerSlot[];
  /** shuffle snake/ladder positions for every new game */
  randomBoard: boolean;
  /** ambient weather: fixed kind, or a new random pick each game */
  weather: WeatherSetting;
  /** day or night sky during the game */
  time: TimeSetting;
  /** house rule: a token needs a 6 to leave home */
  sixToStart: boolean;
  /** sound effects on/off */
  sound: boolean;
}

interface Props {
  onStart(setup: GameSetup): void;
  /** last game's setup, so the lobby remembers choices between games */
  initial?: GameSetup;
}

const MAX_PLAYERS = 6;
const TITLE = 'SNAKES & LADDERS';

function TitleLetter({ ch, index }: { ch: string; index: number }) {
  const v = useSharedValue(0);
  const float = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(150 + index * 45, withSpring(1, { damping: 9, stiffness: 190 }));
    float.value = withDelay(1200 + index * 90, withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [v, float, index]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * -34 + float.value * -3 }, { scale: 0.5 + v.value * 0.5 }],
  }));
  const warm = index % 4 === 0;
  return (
    <Animated.Text
      style={[
        {
          fontSize: 26,
          fontWeight: '900',
          color: warm ? theme.accent : theme.text,
          textShadowColor: 'rgba(120,70,30,0.6)',
          textShadowRadius: 12,
          letterSpacing: 1,
        },
        style,
      ]}
    >
      {ch}
    </Animated.Text>
  );
}

function RosterHero({
  hero,
  order,
  isCpu,
  full,
  onToggle,
  onToggleCpu,
}: {
  hero: Hero;
  /** turn-order index when selected, -1 when on the bench */
  order: number;
  isCpu: boolean;
  /** roster already has MAX_PLAYERS and this hero is benched */
  full: boolean;
  onToggle(): void;
  onToggleCpu(): void;
}) {
  const selected = order >= 0;
  return (
    <View style={{ alignItems: 'center', width: 40 }}>
      <Pressable onPress={onToggle} disabled={full}>
        <View
          style={[
            styles.heroFace,
            selected && { borderColor: hero.color, backgroundColor: 'rgba(233,185,73,0.2)' },
            full && !selected && { opacity: 0.3 },
          ]}
        >
          {/* zoomed bust: the head + headgear fill the card so each hero reads
              distinctly at a glance (body is cropped by the card) */}
          <View style={{ marginTop: 2 }}>
            <ChibiHero hero={hero} size={52} animate={false} />
          </View>
        </View>
      </Pressable>
      {selected ? (
        <Pressable onPress={onToggleCpu} hitSlop={8} style={[styles.typePill, isCpu && styles.typePillCpu]}>
          <Text style={styles.typePillText}>
            {isCpu ? '🤖' : '👤'}
            {order + 1}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.typePillGhost}>
          <Text style={{ color: theme.textDim, fontSize: 10, fontWeight: '800' }}>＋</Text>
        </View>
      )}
    </View>
  );
}

export function MenuScreen({ onStart, initial }: Props) {
  const [randomBoard, setRandomBoard] = useState(initial?.randomBoard ?? true);
  const [weather, setWeather] = useState<WeatherSetting>(initial?.weather ?? 'random');
  const [time, setTime] = useState<TimeSetting>(initial?.time ?? 'auto');
  const [sixToStart, setSixToStart] = useState(initial?.sixToStart ?? false);
  const [sound, setSound] = useState(initial?.sound ?? true);
  const resolvedTime = useResolvedTime(time);
  const insets = useSafeAreaInsets();
  // roster in turn order: tap a hero to join/leave, tap their badge to flip CPU/human
  const [slots, setSlots] = useState<PlayerSlot[]>(
    () =>
      initial?.slots ?? [
        { heroId: HEROES[0].id, isCpu: false },
        { heroId: HEROES[1].id, isCpu: true },
      ],
  );

  const vsCpu = slots.some((s) => s.isCpu);
  const canPlay = slots.length >= 2;

  const toggleHero = (heroId: string) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.heroId === heroId);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= MAX_PLAYERS) return prev;
      // joining a CPU lobby defaults the newcomer to CPU too
      return [...prev, { heroId, isCpu: prev.some((s) => s.isCpu) }];
    });
  };

  const toggleCpu = (heroId: string) => {
    setSlots((prev) => prev.map((s) => (s.heroId === heroId ? { ...s, isCpu: !s.isCpu } : s)));
  };

  const start = () => {
    if (!canPlay) return;
    playSfx('tap');
    onStart({ slots, randomBoard, weather, time, sixToStart, sound });
  };

  return (
    <LinearGradient colors={[theme.bgTop, theme.bgMid, theme.bgBottom]} style={{ flex: 1 }}>
      <WoodBackground />
      <FloatingOrbs count={8} />
      <MenuSnakes />
      <View style={{ flex: 1, paddingTop: insets.top + 44 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 }}>
          {TITLE.split('').map((ch, i) => (
            <TitleLetter key={i} ch={ch} index={i} />
          ))}
        </View>

        <ScrollView
          style={{ flex: 1, marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* mode + board + weather */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.cardLabel}>MODE</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  // non-destructive: keeps any human/CPU mix the player set up via
                  // the badges, only flipping the last hero when no CPU exists yet
                  onPress={() =>
                    setSlots((prev) =>
                      prev.some((s) => s.isCpu) ? prev : prev.map((s, i) => ({ ...s, isCpu: i === prev.length - 1 })),
                    )
                  }
                  style={[styles.modeBtn, vsCpu && styles.modeActive]}
                >
                  <Text style={[styles.modeText, vsCpu && { color: theme.onAccent }]}>🤖 VS CPU</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSlots((prev) => prev.map((s) => ({ ...s, isCpu: false })))}
                  style={[styles.modeBtn, !vsCpu && styles.modeActive]}
                >
                  <Text style={[styles.modeText, !vsCpu && { color: theme.onAccent }]}>👥 PASS & PLAY</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={styles.cardLabel}>BOARD</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setRandomBoard(false)} style={[styles.modeBtn, !randomBoard && styles.modeActive]}>
                  <Text style={[styles.modeText, !randomBoard && { color: theme.onAccent }]}>♟ CLASSIC</Text>
                </Pressable>
                <Pressable onPress={() => setRandomBoard(true)} style={[styles.modeBtn, randomBoard && styles.modeActive]}>
                  <Text style={[styles.modeText, randomBoard && { color: theme.onAccent }]}>🎲 SHUFFLE</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={styles.cardLabel}>WEATHER</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                {(
                  [
                    { key: 'clear', label: '☀️' },
                    { key: 'rain', label: '🌧' },
                    { key: 'snow', label: '❄️' },
                  ] as { key: WeatherSetting; label: string }[]
                ).map((w) => (
                  <Pressable key={w.key} onPress={() => setWeather(w.key)} style={[styles.countBtn, weather === w.key && styles.countActive]}>
                    <Text style={{ fontSize: 16 }}>{w.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setWeather('random')} style={[styles.modeBtn, weather === 'random' && styles.modeActive]}>
                  <Text style={[styles.modeText, weather === 'random' && { color: theme.onAccent }]}>AUTO</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={styles.cardLabel}>RULES</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setSixToStart((v) => !v)} style={[styles.modeBtn, sixToStart && styles.modeActive]}>
                  <Text style={[styles.modeText, sixToStart && { color: theme.onAccent }]}>
                    🎲 6 TO START {sixToStart ? '· ON' : '· OFF'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setSound((v) => {
                      const next = !v;
                      setSoundEnabled(next);
                      if (next) playSfx('tap');
                      return next;
                    })
                  }
                  style={[styles.modeBtn, sound && styles.modeActive]}
                >
                  <Text style={[styles.modeText, sound && { color: theme.onAccent }]}>{sound ? '🔊 ON' : '🔇 OFF'}</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={styles.cardLabel}>TIME</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setTime('day')} style={[styles.modeBtn, time === 'day' && styles.modeActive]}>
                  <Text style={[styles.modeText, time === 'day' && { color: theme.onAccent }]}>☀️ DAY</Text>
                </Pressable>
                <Pressable onPress={() => setTime('night')} style={[styles.modeBtn, time === 'night' && styles.modeActive]}>
                  <Text style={[styles.modeText, time === 'night' && { color: theme.onAccent }]}>🌙 NIGHT</Text>
                </Pressable>
                <Pressable onPress={() => setTime('auto')} style={[styles.modeBtn, time === 'auto' && styles.modeActive]}>
                  <Text style={[styles.modeText, time === 'auto' && { color: theme.onAccent }]}>🌗 AUTO</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* single hero roster: tap a hero to join/leave, tap the badge to flip CPU/human */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.card, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.cardLabel}>TAP HEROES TO JOIN</Text>
              <Text style={[styles.cardLabel, { color: theme.accent }]}>
                {slots.length}/{MAX_PLAYERS} PLAYERS
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 12 }}>
              {HEROES.map((h) => {
                const idx = slots.findIndex((s) => s.heroId === h.id);
                return (
                  <RosterHero
                    key={h.id}
                    hero={h}
                    order={idx}
                    isCpu={idx >= 0 && slots[idx].isCpu}
                    full={idx < 0 && slots.length >= MAX_PLAYERS}
                    onToggle={() => toggleHero(h.id)}
                    onToggleCpu={() => toggleCpu(h.id)}
                  />
                );
              })}
            </View>
            <Text style={styles.rosterHint}>tap 👤/🤖 under a hero to switch player ↔ auto — mix freely</Text>
          </Animated.View>

          {/* directly under the roster — always visible next to the content,
              never pushed toward a screen edge that a small window might clip */}
          <Pressable onPress={start} disabled={!canPlay} accessibilityRole="button" accessibilityLabel="Play">
            <LinearGradient
              colors={[theme.accent, theme.accentDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.playBtn, !canPlay && { opacity: 0.4 }]}
            >
              <Text style={{ color: theme.onAccent, fontSize: 17, fontWeight: '900', letterSpacing: 3 }}>
                {canPlay ? `▶ PLAY · ${slots.length} PLAYERS` : 'PICK AT LEAST 2 HEROES'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

        <AdBanner />
        {/* keep the ad clear of the system navigation bar (edge-to-edge Android) */}
        {insets.bottom > 0 && <View style={{ height: insets.bottom, backgroundColor: 'rgba(0,0,0,0.35)' }} />}
      </View>
      {resolvedTime === 'night' && <NightOverlay />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardLabel: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  countText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '800',
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modeActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  modeText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
  },
  typePill: {
    marginTop: 4,
    minWidth: 38,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.accent,
    backgroundColor: 'rgba(233,185,73,0.22)',
    alignItems: 'center',
  },
  typePillCpu: {
    borderColor: theme.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  typePillText: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '800',
  },
  typePillGhost: {
    marginTop: 4,
    minWidth: 36,
    paddingVertical: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  rosterHint: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  heroFace: {
    width: 38,
    height: 50,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
});
