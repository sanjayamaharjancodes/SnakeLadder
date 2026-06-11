# Snakes & Ladders 🎲🐍🪜

A visually rich Snakes & Ladders dice game built with **Expo (React Native)** — one TypeScript
codebase that runs on **iOS, Android, and the web**. Every asset (board, snakes, ladders, dice,
pawns) is drawn in code with SVG and animated with Reanimated; there are no image assets.

## Features

- 2–**6** players, **VS CPU** or local **Pass & Play**
- **Hero roster**: 8 manga-chibi figurines (ninja, shonen fighter, magical girl, samurai,
  witch, archer, monk, rival swordsman) — tap a hero to add them to the game (selected
  heroes = players), and tap the 👤/🤖 badge under each to flip them between human and CPU
- **Board options**: Classic fixed layout, or **Shuffle** — random snake/ladder positions
  regenerated every game, with segment-distance checks so transitions never overlap visually
- **Weather & time**: clear, gentle rain, or light snow — pick one, or 🔀 random, which
  drifts between skies every 30–45 s during the game with a soft cross-fade; plus a
  **day/night** setting (night adds a moonlit tint, twinkling stars, and a glowing moon)
- **Living board**: snakes wag their tails and flick their tongues while idle;
  lobby remembers your last setup
- Classic rules: exact roll to land on 100, roll a 6 for an extra turn, land on an
  opponent to bump them back home
- Realistic warm board: parchment cells in a walnut frame, python-patterned tapered
  snakes, wooden ladders with grain and nails, wooden-plank app theme
- Animations everywhere:
  - 3D tumbling dice with anticipation shake, bounce landing, and glow burst
  - Square-by-square hero hops with squash-and-stretch; idle sway, blinking eyes
  - Snake swallow: **jaws gape open with manga impact lines**, hero is gulped down,
    a bulge travels the snake's body, hero pops out dazed (X-eyes) at the tail
  - Ladder climb with rung-by-rung bobbing
  - Capture knock-back flight, bouncing turn arrow, pulsing crown on square 100,
    slithering snakes on the home screen, confetti + figurine victory sequence
- Reserved **advertisement banner slot** (56dp) on menu and game screens, ready for
  `react-native-google-mobile-ads`
- Haptic feedback on native (dice, bites, climbs, captures, victory)

## Run it

```sh
npm install
npx expo start
```

- **On your phone (easiest):** install the *Expo Go* app (iOS App Store / Google Play),
  then scan the QR code printed by `npx expo start`.
- **In a browser:** `npm run web`
- **Android emulator:** `npm run android` (requires Android Studio / SDK)
- **iOS simulator:** `npm run ios` (requires macOS + Xcode)

## Ship store builds (no Mac / Android SDK needed)

Production binaries are built in the cloud with [EAS Build](https://docs.expo.dev/build/introduction/):

```sh
npm install -g eas-cli
eas login            # free Expo account
eas build:configure
eas build --platform android   # produces an .aab / .apk
eas build --platform ios       # produces an .ipa (needs an Apple Developer account)
```

## Project layout

```
App.tsx                          # screen switcher (menu <-> game)
src/theme.ts                     # wooden palette
src/game/board.ts                # geometry, classic + random layouts, curve math
src/game/engine.ts               # pure game rules (resolveMove, dice)
src/game/heroes.ts               # hero roster configs
src/screens/MenuScreen.tsx       # lobby: mode, board, weather, tap-to-join hero roster
src/screens/GameScreen.tsx       # turn orchestration, HUD, dice, tokens, ad slot
src/components/BoardSvg.tsx      # board, realistic snakes (open/closed jaws), ladders
src/components/ChibiHero.tsx     # vector manga figurine (blinks, KO eyes)
src/components/Dice3D.tsx        # tumbling dice
src/components/Token.tsx         # hero token (hop/swallow/climb/knock/celebrate)
src/components/Confetti.tsx      # confetti + floating orbs
src/components/MenuSnakes.tsx    # slithering home-screen snakes
src/components/WoodBackground.tsx# plank/grain texture
src/components/AdBanner.tsx      # reserved ad slot
src/components/Weather.tsx       # rain / snow / night overlays, dynamic sky
src/components/WinOverlay.tsx
```

Dev tip: queue deterministic dice rolls from the console with
`globalThis.__forceRolls = [6, 2, 4]` (used for testing snake/ladder paths).
