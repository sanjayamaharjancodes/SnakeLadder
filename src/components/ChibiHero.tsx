import React, { useEffect } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Hero } from '../game/heroes';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

/**
 * Vector chibi-manga figurine, viewBox 0 0 100 130.
 * Big head, large glossy eyes (they blink), small shaded body, hero-specific hair/headgear.
 * The "3D" feel (wobble, jump shadow) is applied by the parent (Token / lobby card).
 */
export function ChibiHero({ hero, size, animate = true, koEyes = false }: { hero: Hero; size: number; animate?: boolean; koEyes?: boolean }) {
  const blink = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;
    blink.value = withDelay(
      800 + Math.random() * 2200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2400 + Math.random() * 1400 }),
          withTiming(0.06, { duration: 70, easing: Easing.in(Easing.quad) }),
          withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [animate, blink]);

  const leftEye = useAnimatedProps(() => ({ ry: 8.5 * blink.value }));
  const rightEye = useAnimatedProps(() => ({ ry: 8.5 * blink.value }));
  const leftIris = useAnimatedProps(() => ({ ry: 6.5 * blink.value }));
  const rightIris = useAnimatedProps(() => ({ ry: 6.5 * blink.value }));

  const gid = `body${hero.id}`;
  const hgid = `head${hero.id}`;

  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 100 130">
      <Defs>
        <RadialGradient id={hgid} cx="0.38" cy="0.3" r="0.95">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="0.35" stopColor={hero.skin} />
          <Stop offset="1" stopColor={hero.skin} stopOpacity="0.82" />
        </RadialGradient>
        <RadialGradient id={gid} cx="0.35" cy="0.25" r="1">
          <Stop offset="0" stopColor={hero.outfit} />
          <Stop offset="1" stopColor={hero.outfitShade} />
        </RadialGradient>
      </Defs>

      {/* legs + shoes */}
      <Rect x="38" y="100" width="9" height="16" rx="4" fill={hero.outfitShade} />
      <Rect x="53" y="100" width="9" height="16" rx="4" fill={hero.outfitShade} />
      <Ellipse cx="42" cy="119" rx="8" ry="5" fill={hero.colorDark} />
      <Ellipse cx="58" cy="119" rx="8" ry="5" fill={hero.colorDark} />

      {/* arms */}
      <Ellipse cx="30" cy="86" rx="6" ry="11" fill={`url(#${gid})`} transform="rotate(14 30 86)" />
      <Ellipse cx="70" cy="86" rx="6" ry="11" fill={`url(#${gid})`} transform="rotate(-14 70 86)" />
      <Circle cx="28" cy="95" r="4.5" fill={hero.skin} />
      <Circle cx="72" cy="95" r="4.5" fill={hero.skin} />

      {/* torso */}
      <Path d="M 35 72 Q 50 66 65 72 L 67 96 Q 50 106 33 96 Z" fill={`url(#${gid})`} />
      {/* belt / sash */}
      <Rect x="34" y="92" width="32" height="6" rx="3" fill={hero.accent} opacity="0.9" />

      {/* hero-specific behind-head pieces (long hair, scarf tail, twin tails) */}
      <BehindHair hero={hero} />

      {/* head */}
      <Circle cx="50" cy="42" r="29" fill={`url(#${hgid})`} />
      {/* side shading for depth */}
      <Path d="M 67 18 A 29 29 0 0 1 67 66 A 38 38 0 0 0 67 18 Z" fill="rgba(120,70,30,0.18)" />
      {/* ears */}
      <Circle cx="22" cy="44" r="5" fill={hero.skin} />
      <Circle cx="78" cy="44" r="5" fill={hero.skin} />

      {/* face */}
      {koEyes ? (
        <G stroke="#3F3F46" strokeWidth="3" strokeLinecap="round">
          <Path d="M 33 42 L 43 52 M 43 42 L 33 52" fill="none" />
          <Path d="M 57 42 L 67 52 M 67 42 L 57 52" fill="none" />
          <Ellipse cx="50" cy="60" rx="4" ry="5" fill="#7F1D1D" stroke="none" />
        </G>
      ) : (
        <G>
          <AnimatedEllipse cx="38" cy="47" rx="7.5" animatedProps={leftEye} fill="#FFFFFF" />
          <AnimatedEllipse cx="62" cy="47" rx="7.5" animatedProps={rightEye} fill="#FFFFFF" />
          <AnimatedEllipse cx="38.5" cy="48" rx="5.2" animatedProps={leftIris} fill={hero.eye} />
          <AnimatedEllipse cx="62.5" cy="48" rx="5.2" animatedProps={rightIris} fill={hero.eye} />
          <Circle cx="40.5" cy="45" r="1.9" fill="#FFFFFF" />
          <Circle cx="64.5" cy="45" r="1.9" fill="#FFFFFF" />
          <Circle cx="36.5" cy="50" r="1" fill="#FFFFFF" opacity="0.8" />
          <Circle cx="60.5" cy="50" r="1" fill="#FFFFFF" opacity="0.8" />
          {/* lashes */}
          <Path d="M 31 40 Q 38 36 45 40" stroke="#2B1B10" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Path d="M 55 40 Q 62 36 69 40" stroke="#2B1B10" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* mouth + blush */}
          <Path d="M 45 60 Q 50 64 55 60" stroke="#A35B3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <Ellipse cx="30" cy="55" rx="4.5" ry="2.5" fill="#FCA5A5" opacity="0.55" />
          <Ellipse cx="70" cy="55" rx="4.5" ry="2.5" fill="#FCA5A5" opacity="0.55" />
        </G>
      )}

      {/* hair / headgear on top */}
      <FrontHair hero={hero} />
    </Svg>
  );
}

function BehindHair({ hero }: { hero: Hero }) {
  switch (hero.style) {
    case 'twin-tails':
      return (
        <G>
          <Ellipse cx="16" cy="50" rx="9" ry="20" fill={hero.hairShade} transform="rotate(12 16 50)" />
          <Ellipse cx="84" cy="50" rx="9" ry="20" fill={hero.hairShade} transform="rotate(-12 84 50)" />
        </G>
      );
    case 'scarf-ninja':
      return <Path d="M 62 66 Q 86 70 92 88 Q 78 86 66 78 Z" fill={hero.accent} opacity="0.95" />;
    case 'long':
      return (
        <G>
          <Path d="M 21 35 Q 14 70 22 92 Q 30 84 30 60 Z" fill={hero.hairShade} />
          <Path d="M 79 35 Q 86 70 78 92 Q 70 84 70 60 Z" fill={hero.hairShade} />
        </G>
      );
    case 'winged-helm':
      return (
        <G>
          <Path d="M 22 38 Q 15 66 23 88 Q 31 80 30 58 Z" fill={hero.hair} />
          <Path d="M 78 38 Q 85 66 77 88 Q 69 80 70 58 Z" fill={hero.hair} />
        </G>
      );
    case 'fox-ears':
      // fluffy fox tail with a white tip
      return (
        <G>
          <Path d="M 66 80 Q 94 72 90 96 Q 84 108 66 98 Z" fill={hero.accent} />
          <Path d="M 84 88 Q 92 88 90 96 Q 86 102 78 100 Q 84 96 84 88 Z" fill="#FFF7ED" />
        </G>
      );
    case 'monkey-king':
      // thin curling tail
      return <Path d="M 64 94 Q 90 100 88 80 Q 87 70 78 73" stroke={hero.hair} strokeWidth="5" fill="none" strokeLinecap="round" />;
    case 'mermaid':
      // long wavy sea-hair
      return (
        <G>
          <Path d="M 20 34 Q 8 56 16 74 Q 8 86 20 96 Q 30 88 28 58 Z" fill={hero.hairShade} />
          <Path d="M 80 34 Q 92 56 84 74 Q 92 86 80 96 Q 70 88 72 58 Z" fill={hero.hairShade} />
        </G>
      );
    default:
      return null;
  }
}

function FrontHair({ hero }: { hero: Hero }) {
  switch (hero.style) {
    case 'spiky':
      return (
        <G>
          <Path
            d="M 21 44 Q 18 24 30 14 L 33 24 Q 36 10 47 6 L 48 18 Q 54 6 66 9 L 63 21 Q 74 14 80 24 L 72 30 Q 82 32 81 44 Q 72 28 50 26 Q 30 28 21 44 Z"
            fill={hero.hair}
          />
          <Path d="M 21 44 Q 30 30 50 28 Q 40 32 34 44 Z" fill={hero.hairShade} opacity="0.6" />
        </G>
      );
    case 'scarf-ninja':
      return (
        <G>
          <Path d="M 21 42 Q 20 16 50 13 Q 80 16 79 42 Q 70 26 50 25 Q 30 26 21 42 Z" fill={hero.hair} />
          {/* headband */}
          <Rect x="22" y="27" width="56" height="8" rx="4" fill={hero.accent} />
          <Circle cx="50" cy="31" r="5" fill="#D4D4D8" stroke="#71717A" strokeWidth="1.5" />
        </G>
      );
    case 'twin-tails':
      return (
        <G>
          <Path d="M 22 44 Q 18 16 50 13 Q 82 16 78 44 Q 72 26 50 24 Q 28 26 22 44 Z" fill={hero.hair} />
          <Path d="M 38 22 Q 44 14 50 22 Q 56 14 62 22 L 58 28 Q 50 22 42 28 Z" fill={hero.hairShade} opacity="0.5" />
          <Circle cx="20" cy="32" r="8" fill={hero.hair} />
          <Circle cx="80" cy="32" r="8" fill={hero.hair} />
          <Circle cx="20" cy="32" r="3" fill={hero.accent} />
          <Circle cx="80" cy="32" r="3" fill={hero.accent} />
        </G>
      );
    case 'witch-hat':
      return (
        <G>
          <Path d="M 24 40 Q 26 24 50 22 Q 74 24 76 40 Q 60 30 24 40 Z" fill={hero.hair} />
          <Ellipse cx="50" cy="22" rx="34" ry="8" fill={hero.outfitShade} />
          <Path d="M 30 22 Q 38 -8 68 2 Q 52 4 48 22 Z" fill={hero.outfit} />
          <Path d="M 30 22 Q 38 -8 68 2 Q 52 4 48 22 Z" fill="rgba(0,0,0,0.18)" />
          <Circle cx="64" cy="4" r="4" fill={hero.accent} />
          <Rect x="36" y="16" width="22" height="5" rx="2.5" fill={hero.accent} opacity="0.9" />
        </G>
      );
    case 'topknot':
      return (
        <G>
          <Path d="M 22 42 Q 22 18 50 15 Q 78 18 78 42 Q 68 27 50 26 Q 32 27 22 42 Z" fill={hero.hair} />
          <Circle cx="50" cy="10" r="8" fill={hero.hair} />
          <Rect x="44" y="14" width="12" height="5" rx="2.5" fill={hero.accent} />
          {/* chonmage shaved sides hint */}
          <Path d="M 30 24 Q 40 18 50 18 L 50 24 Q 40 22 32 28 Z" fill={hero.hairShade} opacity="0.5" />
        </G>
      );
    case 'bob':
      return (
        <G>
          <Path d="M 20 52 Q 14 16 50 12 Q 86 16 80 52 Q 76 34 70 32 Q 74 24 64 20 Q 66 28 58 26 Q 60 18 50 18 Q 40 18 42 26 Q 34 28 36 20 Q 26 24 30 32 Q 24 34 20 52 Z" fill={hero.hair} />
          <Path d="M 20 52 Q 16 28 32 20 Q 24 32 26 46 Z" fill={hero.hairShade} opacity="0.55" />
        </G>
      );
    case 'bald':
      return (
        <G>
          <Path d="M 30 22 Q 40 14 56 16 Q 50 20 48 26 Q 40 22 30 22 Z" fill="rgba(255,255,255,0.5)" />
          {/* prayer beads */}
          {Array.from({ length: 7 }, (_, i) => {
            const a = (Math.PI / 7) * (i + 0.5);
            return <Circle key={i} cx={50 - Math.cos(a) * 22} cy={70 + Math.sin(a) * 9} r="3.4" fill={hero.accent} stroke={hero.colorDark} strokeWidth="0.8" />;
          })}
        </G>
      );
    case 'long':
      return (
        <G>
          <Path d="M 21 46 Q 16 14 50 12 Q 84 14 79 46 Q 74 26 62 24 Q 66 32 56 30 Q 58 22 50 20 Q 42 22 44 30 Q 34 32 38 24 Q 26 26 21 46 Z" fill={hero.hair} />
          <Path d="M 21 46 Q 18 24 36 18 Q 26 28 28 42 Z" fill={hero.hairShade} opacity="0.45" />
        </G>
      );
    case 'laurel':
      // short curls crowned with a golden laurel wreath
      return (
        <G>
          <Path d="M 22 44 Q 20 16 50 13 Q 80 16 78 44 Q 70 26 50 25 Q 30 26 22 44 Z" fill={hero.hair} />
          <Circle cx="34" cy="19" r="5" fill={hero.hair} />
          <Circle cx="50" cy="15" r="5.5" fill={hero.hair} />
          <Circle cx="66" cy="19" r="5" fill={hero.hair} />
          <Ellipse cx="27" cy="34" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(-34 27 34)" />
          <Ellipse cx="34" cy="29" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(-22 34 29)" />
          <Ellipse cx="42" cy="26" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(-10 42 26)" />
          <Ellipse cx="73" cy="34" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(34 73 34)" />
          <Ellipse cx="66" cy="29" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(22 66 29)" />
          <Ellipse cx="58" cy="26" rx="4.5" ry="2.2" fill={hero.accent} transform="rotate(10 58 26)" />
        </G>
      );
    case 'winged-helm':
      // silver valkyrie helm with white side-wings and a gold crest
      return (
        <G>
          <Path d="M 21 42 Q 20 12 50 10 Q 80 12 79 42 Q 70 23 50 22 Q 30 23 21 42 Z" fill="#CBD5E1" />
          <Path d="M 21 42 Q 26 26 44 23 Q 30 24 24 36 Z" fill="#94A3B8" opacity="0.8" />
          <Path d="M 47 10 L 53 10 L 52 23 L 48 23 Z" fill={hero.accent} />
          <Path d="M 24 36 Q 6 30 2 12 Q 16 17 26 26 Q 22 30 24 36 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <Path d="M 76 36 Q 94 30 98 12 Q 84 17 74 26 Q 78 30 76 36 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        </G>
      );
    case 'wizard':
      // starry pointed hat + grand white beard
      return (
        <G>
          <Path d="M 28 54 Q 30 86 50 88 Q 70 86 72 54 Q 64 67 50 67 Q 36 67 28 54 Z" fill={hero.hair} />
          <Path d="M 36 58 Q 43 53 49 58 M 51 58 Q 57 53 64 58" stroke={hero.hairShade} strokeWidth="3" fill="none" strokeLinecap="round" />
          <Ellipse cx="50" cy="21" rx="33" ry="7" fill={hero.outfitShade} />
          <Path d="M 70 21 Q 62 -10 32 -2 Q 48 2 52 21 Z" fill={hero.outfit} />
          <Path d="M 38 4 l 1.8 3.6 4 .5 -2.9 2.8 .7 4 -3.6-1.9 -3.6 1.9 .7-4 -2.9-2.8 4-.5 Z" fill={hero.accent} />
          <Circle cx="56" cy="12" r="2.2" fill={hero.accent} />
        </G>
      );
    case 'turban':
      // wrapped turban with a jewel and plume
      return (
        <G>
          <Path d="M 22 38 Q 20 6 50 5 Q 80 6 78 38 Q 64 23 50 23 Q 36 23 22 38 Z" fill={hero.outfit} />
          <Path d="M 24 31 Q 50 15 76 31" stroke={hero.outfitShade} strokeWidth="4" fill="none" />
          <Path d="M 28 22 Q 50 9 72 22" stroke={hero.outfitShade} strokeWidth="3.4" fill="none" />
          <Path d="M 50 9 Q 45 -4 54 -7 Q 57 1 53 9 Z" fill={hero.accent} opacity="0.95" />
          <Circle cx="50" cy="15" r="5" fill={hero.accent} stroke="#FFF7ED" strokeWidth="1.4" />
        </G>
      );
    case 'fox-ears':
      // snowy hair with orange fox ears
      return (
        <G>
          <Path d="M 20 50 Q 16 16 50 12 Q 84 16 80 50 Q 74 30 50 27 Q 26 30 20 50 Z" fill={hero.hair} />
          <Path d="M 20 50 Q 18 26 34 19 Q 26 30 27 44 Z" fill={hero.hairShade} opacity="0.6" />
          <Path d="M 27 22 L 17 -4 L 43 13 Z" fill={hero.accent} />
          <Path d="M 28 17 L 23 4 L 37 12 Z" fill="#FFF1E6" />
          <Path d="M 73 22 L 83 -4 L 57 13 Z" fill={hero.accent} />
          <Path d="M 72 17 L 77 4 L 63 12 Z" fill="#FFF1E6" />
        </G>
      );
    case 'feather-cap':
      // slanted woodsman cap with a red feather
      return (
        <G>
          <Path d="M 22 42 Q 22 18 50 15 Q 78 18 78 42 Q 68 28 50 27 Q 32 28 22 42 Z" fill={hero.hair} />
          <Path d="M 18 34 Q 24 6 58 9 Q 84 14 82 30 Q 60 17 30 25 Q 22 28 18 34 Z" fill={hero.outfit} />
          <Path d="M 18 34 Q 46 22 82 30 L 82 35 Q 50 27 18 38 Z" fill={hero.outfitShade} />
          <Path d="M 68 9 Q 82 -8 92 -2 Q 86 9 72 14 Z" fill={hero.accent} />
          <Path d="M 70 12 Q 80 2 90 -1" stroke="#7F1D1D" strokeWidth="1.4" fill="none" />
        </G>
      );
    case 'monkey-king':
      // soft tufty hair bound by the golden circlet
      return (
        <G>
          <Path d="M 21 44 Q 20 18 50 14 Q 80 18 79 44 Q 70 26 50 25 Q 30 26 21 44 Z" fill={hero.hair} />
          <Circle cx="36" cy="17" r="5" fill={hero.hair} />
          <Circle cx="50" cy="13" r="5.5" fill={hero.hair} />
          <Circle cx="64" cy="17" r="5" fill={hero.hair} />
          <Path d="M 24 33 Q 50 20 76 33" stroke={hero.accent} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Circle cx="50" cy="25" r="3.6" fill={hero.accent} />
        </G>
      );
    case 'mermaid':
      // wavy sea-hair with a pearl band and a starfish clip
      return (
        <G>
          <Path d="M 20 48 Q 14 14 50 11 Q 86 14 80 48 Q 76 30 66 28 Q 70 20 58 22 Q 60 16 50 17 Q 40 16 42 22 Q 30 20 34 28 Q 24 30 20 48 Z" fill={hero.hair} />
          <Path d="M 20 48 Q 17 26 34 19 Q 25 30 27 44 Z" fill={hero.hairShade} opacity="0.5" />
          <Circle cx="40" cy="17" r="2.2" fill="#FFF7ED" />
          <Circle cx="50" cy="14.5" r="2.2" fill="#FFF7ED" />
          <Circle cx="60" cy="17" r="2.2" fill="#FFF7ED" />
          <Path d="M 70 18 l 1.9 4 4.3 .4 -3.2 2.9 1 4.2 -4 -2.3 -4 2.3 1 -4.2 -3.2 -2.9 4.3 -.4 Z" fill={hero.accent} stroke="#F472B6" strokeWidth="0.8" />
        </G>
      );
    default:
      return null;
  }
}
