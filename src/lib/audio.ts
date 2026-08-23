// src/lib/audio.ts
import { platform } from './platform'
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export type SoundName =
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'win'
  | 'lose'
  | 'click'
  | 'click1'
  | 'click2'
  | 'click3'
  | 'select'
  | 'countdown'
  | 'clutch' |
  'clap'

/**
 * Where each cue's audio file lives. These are served straight out of
 * /public, so drop your files at public/sounds/<name>.<ext> using these
 * exact base names. mp3/ogg/wav all work — just update the extension here
 * if you don't use mp3.
 */
const SOUND_FILES: Record<SoundName, string> = {
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.mp3',
  tick: '/sounds/tick.mp3',
  win: '/sounds/win.wav',
  lose: '/sounds/lose.wav',
  click: '/sounds/click-1.mp3',
  click1: '/sounds/click-2.mp3',
  click2: '/sounds/click-3.mp3',
  click3: '/sounds/click-4.mp3',
  select: '/sounds/select.mp3',
  countdown: '/sounds/countdown.mp3',
  clutch: '/sounds/clutch.mp3',
  clap: '/sounds/clap.ogg',
}

let audioCtx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}

// Decoded-buffer cache, keyed by sound name. Value is a promise so
// concurrent calls to the same sound share one fetch+decode instead of
// racing.  A resolved `null` means "file missing/unplayable" and we just
// silently no-op from then on — same fail-quiet style as the rest of this file.
const bufferCache = new Map<SoundName, Promise<AudioBuffer | null>>()

function loadBuffer(name: SoundName): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(name)
  if (cached) return cached

  const promise = (async () => {
    try {
      const res = await fetch(SOUND_FILES[name])
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arrayBuffer = await res.arrayBuffer()
      return await getCtx().decodeAudioData(arrayBuffer)
    } catch (e) {
      console.warn(
        `[Audio] couldn't load "${name}" from ${SOUND_FILES[name]} — drop a file there to enable this cue.`,
        e,
      )
      return null
    }
  })()

  bufferCache.set(name, promise)
  return promise
}

/** Kicks off decoding for every cue up front (call once on boot) so the first play of each isn't delayed by a fetch. Safe to call more than once. */
export function preloadSounds(): void {
  ; (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
    loadBuffer(name)
  })
}

const MUTE_KEY = 'hct_muted'

let muted = false
let mutedInitialized = false
const mutedListeners = new Set<(muted: boolean) => void>()

/**
 * Separate from the player's persisted `muted` preference — this is a
 * transient "shut up while a rewarded/interstitial ad is playing" flag.
 * It's intentionally NOT wired into `mutedListeners`/storage: it shouldn't
 * flip the mute button's UI or overwrite the player's real preference, it
 * should just silence our own SFX for the duration of the ad so they don't
 * play over/under it, then quietly restore whatever the player's actual
 * preference was once the ad is done.
 */
let adMuted = false

export function setAdMuted(value: boolean): void {
  adMuted = value
}

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
  preloadSounds()
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

function playSound(name: SoundName, opts: { gain?: number; rate?: number } = {}) {
  if (muted || adMuted) return
  const { gain = 1, rate = 1 } = opts
  loadBuffer(name).then((buffer) => {
    if (!buffer) return
    if (muted || adMuted) return // re-check — mute may have toggled while this was loading
    try {
      const ctx = getCtx()
      const source = ctx.createBufferSource()
      const g = ctx.createGain()
      source.buffer = buffer
      source.playbackRate.value = rate
      g.gain.value = gain
      source.connect(g)
      g.connect(ctx.destination)
      source.start()
    } catch (_) { }
  })
}

export const audio = {
  correct() {
    playSound('correct')
  },
  wrong() {
    playSound('wrong')
  },
  tick(urgency = 0) {
    // urgency (0–1ish) nudges pitch/volume up instead of picking a different oscillator freq
    playSound('tick', { rate: 1 + urgency * 0.15, gain: 0.6 + urgency * 0.4 })
  },
  win() {
    playSound('win')
    playSound('clap')
  },
  lose() {
    playSound('lose')
  },
  click() {
    //@ts-ignore
    const randomSound: SoundName = ["click", "click1", "click2", "click3"][getRandomInt(0, 3)]
    playSound(randomSound,)
  },
  select() {
    playSound('select')
  },
  countdown() {
    playSound('countdown')
  },
  clutch() {
    playSound('clutch')
  },
}
