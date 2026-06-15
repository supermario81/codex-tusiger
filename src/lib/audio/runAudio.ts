type AudioContextConstructor = typeof AudioContext;

type Tone = {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
};

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!sharedContext) {
    sharedContext = new AudioContextClass();
  }

  return sharedContext;
}

function playToneSequence(tones: Tone[], volume: number) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  void ctx.resume().catch(() => undefined);
  const now = ctx.currentTime;
  tones.forEach(({ freq, start, dur, type = "triangle" }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(volume, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

function playAudioFileWithFallback(fileName: string, volume: number, fallback: () => void) {
  const audioFile = `${import.meta.env.BASE_URL}audio/${fileName}`;
  const audio = new Audio(audioFile);
  audio.volume = volume;
  void audio.play().catch(fallback);
}

export function primeRunAudio() {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  void ctx.resume().catch(() => undefined);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.02);
}

export function playRunFanfare() {
  playAudioFileWithFallback("victory.mp3", 0.6, () => {
    playToneSequence([
      { freq: 523.25, start: 0, dur: 0.2 },
      { freq: 659.25, start: 0.22, dur: 0.2 },
      { freq: 783.99, start: 0.44, dur: 0.2 },
      { freq: 1046.5, start: 0.66, dur: 0.7 },
      { freq: 783.99, start: 0.68, dur: 0.68 },
      { freq: 659.25, start: 0.7, dur: 0.66 }
    ], 0.22);
  });
}

export function playRunFailSound() {
  playAudioFileWithFallback("fail.mp3", 0.45, () => {
    playToneSequence([
      { freq: 392, start: 0, dur: 0.18, type: "sine" },
      { freq: 329.63, start: 0.2, dur: 0.18, type: "sine" },
      { freq: 261.63, start: 0.42, dur: 0.36, type: "sine" }
    ], 0.18);
  });
}
