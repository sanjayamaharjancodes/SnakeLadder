// Tiny sound-effect manager on top of expo-audio. All WAVs are synthesized by
// scripts/make-sfx.js (no downloaded assets). Each effect keeps a small pool of
// players so rapid repeats (hop-hop-hop) can overlap instead of cutting off.

import { AudioPlayer, createAudioPlayer } from 'expo-audio';

const SOURCES = {
  dice: require('../assets/sfx/dice.wav'),
  hop: require('../assets/sfx/hop.wav'),
  ladder: require('../assets/sfx/ladder.wav'),
  snake: require('../assets/sfx/snake.wav'),
  capture: require('../assets/sfx/capture.wav'),
  win: require('../assets/sfx/win.wav'),
  locked: require('../assets/sfx/locked.wav'),
  tap: require('../assets/sfx/tap.wav'),
} as const;

export type SfxName = keyof typeof SOURCES;

const POOL_SIZE: Partial<Record<SfxName, number>> = { hop: 3, dice: 2 };

let enabled = true;
const pools = new Map<SfxName, { players: AudioPlayer[]; next: number }>();

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function soundEnabled() {
  return enabled;
}

export function playSfx(name: SfxName) {
  if (!enabled) return;
  try {
    let pool = pools.get(name);
    if (!pool) {
      const size = POOL_SIZE[name] ?? 1;
      pool = { players: Array.from({ length: size }, () => createAudioPlayer(SOURCES[name])), next: 0 };
      pools.set(name, pool);
    }
    const p = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    p.seekTo(0);
    p.play();
  } catch {
    // audio is decoration — a failed play (e.g. before any user gesture on web)
    // must never break the game
  }
}
