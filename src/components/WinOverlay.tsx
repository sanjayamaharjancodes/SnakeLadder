import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChibiHero } from './ChibiHero';
import { Confetti } from './Confetti';
import { Hero } from '../game/heroes';
import { theme } from '../theme';

interface Props {
  hero: Hero;
  onPlayAgain(): void;
  onMenu(): void;
}

export function WinOverlay({ hero, onPlayAgain, onMenu }: Props) {
  const fade = useSharedValue(0);
  const pop = useSharedValue(0);
  const bounce = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 400 });
    pop.value = withDelay(150, withSpring(1, { damping: 9, stiffness: 140 }));
    bounce.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 420, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    sway.value = withRepeat(withTiming(1, { duration: 840 }), -1, true);
  }, [fade, pop, bounce, sway]);

  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const card = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.4 }, { translateY: (1 - pop.value) * 60 }],
  }));
  const figurine = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { rotateZ: `${(sway.value - 0.5) * 16}deg` }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,26,0.84)', alignItems: 'center', justifyContent: 'center' }, backdrop]}>
      <Confetti count={80} />
      <Animated.View style={card}>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)']}
          style={{
            alignItems: 'center',
            paddingVertical: 30,
            paddingHorizontal: 44,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,201,60,0.5)',
          }}
        >
          <Text style={{ fontSize: 40 }}>👑</Text>
          <Animated.View style={[{ marginTop: 4 }, figurine]}>
            <ChibiHero hero={hero} size={110} />
          </Animated.View>
          <Text style={{ color: theme.gold, fontSize: 15, fontWeight: '800', letterSpacing: 4, marginTop: 12 }}>VICTORY</Text>
          <Text style={{ color: hero.color, fontSize: 32, fontWeight: '900', marginTop: 4, textShadowColor: hero.color, textShadowRadius: 18 }}>
            {hero.name}
          </Text>
          <Text style={{ color: theme.textDim, fontSize: 14, marginTop: 2 }}>reached square 100!</Text>

          <Pressable onPress={onPlayAgain} style={{ marginTop: 22, width: 220 }}>
            <LinearGradient colors={[theme.gold, theme.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={[styles.btnText, { color: '#3A2A00' }]}>PLAY AGAIN</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onMenu} style={[styles.btn, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10, width: 220, borderWidth: 1, borderColor: theme.panelBorder }]}>
            <Text style={[styles.btnText, { color: theme.text }]}>MAIN MENU</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
