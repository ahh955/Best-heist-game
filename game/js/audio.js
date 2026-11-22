// Sound for Night Fox, synthesized live with WebAudio oscillators: no audio
// files, no network. Every effect is a tiny named function so the game can
// say what happened in sound: a pickup chimes, the alarm ticks, a bust stings.

let audioContext = null;
let masterGain = null;

export function initAudio() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    audioContext = new Ctor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(audioContext.destination);
  } catch {
    audioContext = null;
  }
}

function tone(freq, startAt, dur, type, vol, slideTo) {
  if (!audioContext || !masterGain) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, startAt + dur);
  gain.gain.setValueAtTime(vol, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

function now() { return audioContext ? audioContext.currentTime : 0; }

export function playPickup() {
  if (!audioContext) return;
  const t = now();
  tone(880, t, 0.09, 'sine', 0.9);
  tone(1318, t + 0.08, 0.14, 'sine', 0.8);
}

export function playVaultCrack() {
  if (!audioContext) return;
  const t = now();
  tone(220, t, 0.06, 'square', 0.35);
  tone(220, t + 0.12, 0.06, 'square', 0.35);
  tone(660, t + 0.24, 0.18, 'sine', 0.7);
}

export function playAlarmTick() {
  if (!audioContext) return;
  tone(1180, now(), 0.07, 'square', 0.3);
}

export function playSpotted() {
  if (!audioContext) return;
  const t = now();
  tone(520, t, 0.12, 'sawtooth', 0.4, 780);
}

export function playBusted() {
  if (!audioContext) return;
  const t = now();
  tone(392, t, 0.22, 'sawtooth', 0.5, 311);
  tone(311, t + 0.22, 0.22, 'sawtooth', 0.5, 233);
  tone(233, t + 0.44, 0.5, 'sawtooth', 0.5, 175);
}

export function playGetaway() {
  if (!audioContext) return;
  const t = now();
  [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.22, 'triangle', 0.7));
}

export function playSmoke() {
  if (!audioContext) return;
  const t = now();
  tone(180, t, 0.3, 'sine', 0.6, 60);
}

export function playEmp() {
  if (!audioContext) return;
  const t = now();
  tone(1400, t, 0.25, 'sawtooth', 0.35, 120);
}

export function playCoin() {
  if (!audioContext) return;
  const t = now();
  tone(1568, t, 0.06, 'sine', 0.6);
  tone(2093, t + 0.07, 0.1, 'sine', 0.5);
}

export function playClick() {
  if (!audioContext) return;
  tone(740, now(), 0.05, 'sine', 0.5);
}

export function playStep() {
  if (!audioContext) return;
  tone(140, now(), 0.04, 'sine', 0.25);
}
