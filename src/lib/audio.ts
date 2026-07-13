// src/lib/audio.ts
import { platform } from './platform'

let audioCtx: AudioContext | null = null

const MUTE_KEY = 'hct_muted'

let muted = false
let mutedInitialized = false
const mutedListeners = new Set<(muted: boolean) => void>()

function notifyMuted() {
  mutedListeners.forEach((l) => l(muted))
}

export function isMuted(): boolean {
  return muted
}

/** Subscribe to mute changes (including the async platform-storage load resolving). Returns an unsubscribe fn. */
export function subscribeMuted(listener: (muted: boolean) => void): () => void {
  mutedListeners.add(listener)
  return () => mutedListeners.delete(listener)
}

/** Call once on boot (alongside platform.init()) to hydrate the mute flag from platform storage. */
export async function initMuted(): Promise<void> {
  if (mutedInitialized) return
  mutedInitialized = true
  try {
    const stored = await platform.storageGet(MUTE_KEY)
    // Defensive per IPlatform's note: some bridges hand back a non-string.
    if (stored === '1' || stored === '0') {
      muted = stored === '1'
      notifyMuted()
    }
  } catch {
    // keep default (unmuted)
  }
}

export function setMuted(value: boolean): void {
  muted = value
  notifyMuted()
  platform.storageSet(MUTE_KEY, muted ? '1' : '0').catch(() => { })
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
