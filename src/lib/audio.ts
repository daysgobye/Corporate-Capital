let audioCtx: AudioContext | null = null

const MUTE_KEY = 'hct_muted'

let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch { }
}

export function toggleMute(): boolean {
  setMuted(!muted)
  return muted
}

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}

function playTone(freq: number, type: OscillatorType, duration: number, gain = 0.3, delay = 0) {
  if (muted) return
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.connect(g)
    g.connect(ac.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = ac.currentTime + delay
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  } catch (_) { }
}

export const audio = {
  correct() {
    playTone(523, 'sine', 0.12, 0.3)
    playTone(659, 'sine', 0.12, 0.3, 0.1)
    playTone(784, 'sine', 0.2, 0.35, 0.2)
    playTone(1047, 'sine', 0.3, 0.4, 0.35)
  },
  wrong() {
    playTone(200, 'sawtooth', 0.15, 0.4)
    playTone(150, 'sawtooth', 0.25, 0.45, 0.15)
    playTone(100, 'sawtooth', 0.3, 0.5, 0.35)
  },
  tick(urgency = 0) {
    playTone(440 + urgency * 60, 'square', 0.08, 0.15 + urgency * 0.1)
  },
  win() {
    ;[523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      playTone(f, 'sine', 0.3, 0.35, i * 0.1)
    )
  },
  lose() {
    ;[300, 250, 200, 150].forEach((f, i) =>
      playTone(f, 'sawtooth', 0.4, 0.5, i * 0.18)
    )
  },
  click() {
    playTone(800, 'sine', 0.05, 0.1)
  },
  select() {
    playTone(600, 'sine', 0.06, 0.15)
    playTone(900, 'sine', 0.06, 0.15, 0.06)
  },
  countdown() {
    playTone(880, 'square', 0.15, 0.5)
  },
  clutch() {
    playTone(1200, 'square', 0.08, 0.4)
    playTone(1600, 'square', 0.1, 0.45, 0.08)
    playTone(2000, 'sine', 0.25, 0.5, 0.16)
  },
}
