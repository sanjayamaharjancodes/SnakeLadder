// Synthesizes the game's sound effects as small mono 16-bit WAV files.
// No downloaded assets: every sound is generated from code, tuned to feel
// "wood on wood" to match the board theme. Run with:  node scripts/make-sfx.js

const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sfx');

// ---------------------------------------------------------------------------
// tiny synth toolkit

/** seconds -> Float64Array of zeros */
function silence(sec) {
  return new Float64Array(Math.round(sec * RATE));
}

/** mix src into dst starting at `at` seconds, scaled by gain */
function mix(dst, src, at = 0, gain = 1) {
  const o = Math.round(at * RATE);
  for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
  return dst;
}

/** exponentially decaying sine pluck; `bend` slides the pitch by that factor over the note */
function pluck(freq, sec, { decay = 12, bend = 1, harmonics = 0.3 } = {}) {
  const buf = silence(sec);
  let phase = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / RATE;
    const f = freq * (1 + (bend - 1) * (t / sec));
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.exp(-decay * t);
    buf[i] = (Math.sin(phase) + harmonics * Math.sin(2 * phase) * 0.5 + harmonics * Math.sin(3 * phase) * 0.25) * env;
  }
  return buf;
}

/** filtered noise burst (one-pole low-pass), exponential decay */
function noiseBurst(sec, { decay = 30, lp = 0.25 } = {}) {
  const buf = silence(sec);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / RATE;
    y += lp * ((Math.random() * 2 - 1) - y);
    buf[i] = y * Math.exp(-decay * t);
  }
  return buf;
}

/** airy hiss: high-passed noise with a slow attack/decay envelope */
function hiss(sec, { attack = 0.08 } = {}) {
  const buf = silence(sec);
  let prev = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / RATE;
    const n = Math.random() * 2 - 1;
    const hp = n - prev; // crude high-pass
    prev = n;
    const env = Math.min(t / attack, 1) * Math.exp(-((t / sec) ** 2) * 4);
    buf[i] = hp * env * 0.7;
  }
  return buf;
}

/** a short wooden knock: low pluck + noise transient */
function knock(freq, sec = 0.12) {
  const buf = silence(sec);
  mix(buf, pluck(freq, sec, { decay: 34, bend: 0.82, harmonics: 0.5 }), 0, 0.9);
  mix(buf, noiseBurst(Math.min(0.04, sec), { decay: 90, lp: 0.5 }), 0, 0.55);
  return buf;
}

/** normalize to peak and write 16-bit mono WAV */
function writeWav(name, buf, peak = 0.85) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? peak / max : 1;
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * scale)) * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([header, data]));
  console.log(`  ${name}  (${((header.length + data.length) / 1024).toFixed(1)} kB)`);
}

// ---------------------------------------------------------------------------
// the sounds

fs.mkdirSync(OUT, { recursive: true });
console.log('writing assets/sfx:');

// dice: a tumble of quick wooden clacks settling into a final knock
{
  const buf = silence(0.75);
  const clacks = [0, 0.07, 0.16, 0.27, 0.4, 0.55];
  clacks.forEach((t, i) => {
    const f = 240 + Math.sin(i * 3.7) * 60 + i * 14;
    mix(buf, knock(f, 0.1), t, 0.55 + i * 0.07);
  });
  mix(buf, knock(170, 0.18), 0.66, 1);
  writeWav('dice.wav', buf);
}

// hop: a single soft wooden tick per square
writeWav('hop.wav', knock(540, 0.09), 0.6);

// ladder: rising wooden xylophone arpeggio
{
  const buf = silence(0.7);
  [523, 659, 784, 1047].forEach((f, i) => {
    mix(buf, pluck(f, 0.3, { decay: 14, harmonics: 0.5 }), i * 0.105, 0.8 - i * 0.06);
  });
  writeWav('ladder.wav', buf);
}

// snake: a menacing hiss, then a low swallowing gulp
{
  const buf = silence(0.85);
  mix(buf, hiss(0.45), 0, 0.85);
  mix(buf, pluck(220, 0.32, { decay: 9, bend: 0.32, harmonics: 0.4 }), 0.42, 0.95); // gulp: fast downward slide
  mix(buf, knock(110, 0.16), 0.66, 0.6);
  writeWav('snake.wav', buf);
}

// capture: a heavy thud and a small rattle
{
  const buf = silence(0.4);
  mix(buf, knock(95, 0.3), 0, 1);
  mix(buf, noiseBurst(0.18, { decay: 26, lp: 0.2 }), 0.02, 0.4);
  mix(buf, knock(150, 0.1), 0.16, 0.35);
  writeWav('capture.wav', buf);
}

// win: a bright little fanfare (arpeggio up + held chord)
{
  const buf = silence(1.5);
  [523, 659, 784].forEach((f, i) => mix(buf, pluck(f, 0.28, { decay: 10, harmonics: 0.4 }), i * 0.12, 0.7));
  [659, 784, 1047, 1319].forEach((f) => mix(buf, pluck(f, 1.0, { decay: 4, harmonics: 0.35 }), 0.42, 0.5));
  writeWav('win.wav', buf);
}

// locked / blocked: two short low buzzes ("not this time")
{
  const buf = silence(0.32);
  mix(buf, pluck(165, 0.11, { decay: 18, harmonics: 0.8 }), 0, 0.8);
  mix(buf, pluck(150, 0.13, { decay: 18, harmonics: 0.8 }), 0.15, 0.8);
  writeWav('locked.wav', buf);
}

// tap: soft UI click for the PLAY button
writeWav('tap.wav', knock(820, 0.06), 0.45);

console.log('done.');
