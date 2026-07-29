// src/lib/visuals.ts
// Separate on/off switch for purely cosmetic "pop" effects (jargon
// particles, income floaters, confetti, the SEND stamp, the arrival ping,
// the upgrade-flash toast). None of it is gameplay-relevant, and on lower-end
// hardware it's the biggest source of DOM/animation churn in the game, so
// this lets players (or a settings menu) cut it out entirely without
// touching the mute-audio preference.
import { platform } from './platform'

const VISUALS_MUTE_KEY = 'hct_visuals_muted'

let visualsMuted = false
let visualsMutedInitialized = false
const visualsMutedListeners = new Set<(muted: boolean) => void>()

function notifyVisualsMuted() {
  visualsMutedListeners.forEach((l) => l(visualsMuted))
}

export function isVisualsMuted(): boolean {
  return visualsMuted
}

/** Subscribe to visual-mute changes (including the async platform-storage load resolving). Returns an unsubscribe fn. */
export function subscribeVisualsMuted(listener: (muted: boolean) => void): () => void {
  visualsMutedListeners.add(listener)
  return () => visualsMutedListeners.delete(listener)
}

/** Call once on boot (alongside platform.init()) to hydrate the visuals-mute flag from platform storage. */
export async function initVisualsMuted(): Promise<void> {
  if (visualsMutedInitialized) return
  visualsMutedInitialized = true
  try {
    const stored = await platform.storageGet(VISUALS_MUTE_KEY)
    if (stored === '1' || stored === '0') {
      visualsMuted = stored === '1'
      notifyVisualsMuted()
    }
  } catch {
    // keep default (visuals on)
  }
}

export function setVisualsMuted(value: boolean): void {
  visualsMuted = value
  notifyVisualsMuted()
  platform.storageSet(VISUALS_MUTE_KEY, visualsMuted ? '1' : '0').catch(() => { })
}

export function toggleVisualsMuted(): boolean {
  setVisualsMuted(!visualsMuted)
  return visualsMuted
}
