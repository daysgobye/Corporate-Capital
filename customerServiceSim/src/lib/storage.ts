/**
 * Storage helpers — always go through the platform adapter.
 *
 * On Playgama this may use cloud save (platform_internal).
 * On mobile it will call whatever the mobile SDK provides.
 * During local dev, NullPlatform falls back to localStorage.
 *
 * The game state is stored as a single JSON blob under STORAGE_KEY
 * so we make exactly one get/set call per load/save, keeping us
 * within the platform's rate limits.
 *
 * NOTE: IPlatform.storageGet is typed as returning `string | null`, but
 * in practice some bridges (observed with Playgama) already return a
 * parsed object rather than a raw JSON string. We defensively handle
 * both shapes here rather than trusting the type.
 */
import type { AppState } from '../types'
import { INITIAL_COINS } from '../data'
import { platform } from './platform/index'

const STORAGE_KEY = 'hct_v2'

export function defaultAppState(): AppState {
  return {
    coins: INITIAL_COINS,
    owned: ['twilight', 'harrypotter'],
    packState: {},
    leaderboard: [],
  }
}

/**
 * Tolerant parse — accepts:
 *  - an already-parsed object/array (some bridges do this despite the
 *    string-typed interface)
 *  - a normal JSON string
 *  - a JSON string that got double-wrapped in an extra layer of quotes
 *    (e.g. from manually pasting a DevTools-displayed value back into
 *    Local Storage)
 */
function tryParseAppState(raw: unknown): unknown | null {
  if (raw === null || raw === undefined) return null

  // Already an object (bridge pre-parsed it for us) — use as-is.
  if (typeof raw === 'object') {
    console.log('[Storage] raw value was already an object, skipping JSON.parse')
    return raw
  }

  if (typeof raw !== 'string') {
    console.error('[Storage] raw value was an unexpected type:', typeof raw, raw)
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[Storage] direct JSON.parse failed, attempting recovery…', e)
  }

  if (raw.length > 1 && raw.startsWith('"') && raw.endsWith('"')) {
    const unwrapped = raw.slice(1, -1)
    try {
      const recovered = JSON.parse(unwrapped)
      console.warn('[Storage] recovered state after stripping an extra outer quote layer')
      return recovered
    } catch (e) {
      console.error('[Storage] recovery attempt also failed', e)
    }
  }

  return null
}

export async function loadAppState(): Promise<AppState> {
  try {
    const raw = await platform.storageGet(STORAGE_KEY)
    console.log('[Storage] loadAppState raw =', raw, 'typeof =', typeof raw)
    if (!raw) {
      console.log('[Storage] no saved state, using default')
      return defaultAppState()
    }

    const parsed = tryParseAppState(raw)
    if (parsed === null) {
      console.error('[Storage] could not parse saved state at all, falling back to default. Raw value was:', raw)
      return defaultAppState()
    }

    const merged = { ...defaultAppState(), ...(parsed as Partial<AppState>) }
    console.log('[Storage] loaded state', merged)

    // If raw wasn't already a clean JSON string matching `parsed`
    // (either it was a pre-parsed object, or we had to recover it from a
    // double-quoted string), re-save in the canonical string format now.
    const isCleanString = typeof raw === 'string' && raw === JSON.stringify(parsed)
    if (!isCleanString) {
      console.log('[Storage] re-saving in canonical format after non-standard load')
      saveAppState(merged)
    }

    return merged
  } catch (e) {
    console.error('[Storage] loadAppState failed, using default', e)
    return defaultAppState()
  }
}

export function saveAppState(state: AppState): void {
  console.log('[Storage] saveAppState', state)
  platform.storageSet(STORAGE_KEY, JSON.stringify(state))
    .then(() => console.log('[Storage] save OK'))
    .catch(e => console.error('[Storage] save FAILED', e))
}
