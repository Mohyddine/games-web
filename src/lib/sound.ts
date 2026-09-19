const SOUND_KEY = "games-sound-muted";

export type GameSound =
  | "cell"
  | "select"
  | "submit"
  | "countdown"
  | "round-win"
  | "round-loss"
  | "round-draw"
  | "match-win"
  | "match-loss"
  | "match-draw"
  | "rematch";

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, muted ? "1" : "0");
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  return new AudioCtor();
}

export function playGameSound(sound: GameSound): void {
  if (typeof window === "undefined" || isSoundMuted()) return;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const presets: Record<GameSound, { type: OscillatorType; frequency: number; duration: number; volume: number; sweep?: number }> = {
    cell: { type: "triangle", frequency: 260, duration: 0.08, volume: 0.025 },
    select: { type: "square", frequency: 420, duration: 0.09, volume: 0.028, sweep: 120 },
    submit: { type: "triangle", frequency: 520, duration: 0.11, volume: 0.032, sweep: 70 },
    countdown: { type: "sawtooth", frequency: 640, duration: 0.1, volume: 0.022, sweep: -150 },
    "round-win": { type: "triangle", frequency: 780, duration: 0.12, volume: 0.03, sweep: 140 },
    "round-loss": { type: "sawtooth", frequency: 230, duration: 0.16, volume: 0.03, sweep: -90 },
    "round-draw": { type: "square", frequency: 420, duration: 0.12, volume: 0.022, sweep: 90 },
    "match-win": { type: "triangle", frequency: 840, duration: 0.2, volume: 0.04, sweep: 200 },
    "match-loss": { type: "sawtooth", frequency: 180, duration: 0.22, volume: 0.04, sweep: -120 },
    "match-draw": { type: "square", frequency: 500, duration: 0.17, volume: 0.03, sweep: 100 },
    rematch: { type: "triangle", frequency: 600, duration: 0.12, volume: 0.03, sweep: 110 },
  };

  const config = presets[sound];
  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, now);
  if (config.sweep) {
    oscillator.frequency.linearRampToValueAtTime(config.frequency + config.sweep, now + config.duration);
  }

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(config.volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

  oscillator.start(now);
  oscillator.stop(now + config.duration);

  void audioContext.resume();
}
