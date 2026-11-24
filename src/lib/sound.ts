let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.18, delay = 0) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

export type Sfx = 'tick' | 'go' | 'flip' | 'success' | 'fail' | 'win' | 'alarm' | 'flash'

const SOUNDS: Record<Sfx, () => void> = {
  tick: () => tone(880, 0.08, 'square', 0.08),
  go: () => tone(1320, 0.25, 'triangle', 0.2),
  flip: () => tone(420, 0.06, 'triangle', 0.1),
  success: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.15, 'triangle', 0.15, i * 0.08)),
  fail: () => [330, 220].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.1, i * 0.15)),
  win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.13)),
  alarm: () => [0, 0.2, 0.4].forEach((d) => tone(990, 0.15, 'square', 0.12, d)),
  flash: () => [1500, 1900].forEach((f, i) => tone(f, 0.1, 'square', 0.1, i * 0.07)),
}

export function play(sfx: Sfx, enabled: boolean): void {
  if (!enabled) return
  try {
    SOUNDS[sfx]()
  } catch {
    /* audio indisponible */
  }
}
