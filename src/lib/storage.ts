/**
 * Save/load — always goes through the platform adapter (see lib/platform).
 *
 * On Playgama this may use cloud save (platform_internal).
 * On mobile it will call whatever the mobile SDK provides.
 * During local dev, NullPlatform falls back to localStorage.
 *
 * We only persist the "career progress" slice of GameState (funds, upgrades,
 * milestones, the ticket queue, etc.) — not per-frame effect state like
 * particles/floaters/confetti/the stamp animation, which should always start
 * fresh. That slice is saved as a single JSON blob under STORAGE_KEY so we
 * make exactly one get/set call per load/save, keeping us within the
 * platform's rate limits.
 *
 * The rewarded-ad popup itself (`adPopup`) and its countdown (`adTimerMs`)
 * are NOT persisted — like particles/floaters, they should always start
 * fresh on load rather than potentially resurrecting a stale popup. But
 * `maxFundsEver` (the basis for the ad reward) and `adsUnlocked` (the
 * dev/config toggle) ARE persisted, since they're real progress state.
 *
 * NOTE: IPlatform.storageGet is typed as returning `string | null`, but
 * in practice some bridges (observed with Playgama) already return a
 * parsed object rather than a raw JSON string. We defensively handle
 * both shapes here rather than trusting the type.
 */
import type { GameState, Phase, Ticket } from '../game/types'
import { platform } from './platform/index'

const STORAGE_KEY = 'hct_save_v1-23'

/** The subset of GameState worth persisting between sessions. */
export interface SaveData {
  starterAdOffered: boolean
  nextId: number
  phase: Phase
  promotions: number
  payoutMultiplier: number
  funds: number
  currencyLabel: string
  queue: Ticket[]
  activeTicket: Ticket | null
  manualProgress: number
  jobLevel: number
  titleModifiers: string[]
  upgradeLevels: Record<string, number>
  milestonesUnlocked: Record<string, boolean>
  aiBotNodes: number
  agentCount: number
  ticketsClosed: number
  maxFundsEver: number
  adsUnlocked: boolean
  afkUnlocked: boolean
  afkMinutesCap: number
  /** Epoch ms at the moment this save was written — the anchor for AFK catch-up on next boot. */
  lastSavedAt: number
}

export function extractSaveData(state: GameState): SaveData {
  return {
    afkMinutesCap: state.afkMinutesCap,
    starterAdOffered: state.starterAdOffered,
    lastSavedAt: Date.now(),
    nextId: state.nextId,
    phase: state.phase,
    promotions: state.promotions,
    payoutMultiplier: state.payoutMultiplier,
    funds: state.funds,
    currencyLabel: state.currencyLabel,
    queue: state.queue,
    activeTicket: state.activeTicket,
    manualProgress: state.manualProgress,
    jobLevel: state.jobLevel,
    titleModifiers: state.titleModifiers,
    upgradeLevels: state.upgradeLevels,
    milestonesUnlocked: state.milestonesUnlocked,
    aiBotNodes: state.aiBotNodes,
    agentCount: state.agentCount,
    ticketsClosed: state.ticketsClosed,
    maxFundsEver: state.maxFundsEver,
    adsUnlocked: state.adsUnlocked,
    afkUnlocked: state.afkUnlocked,
  }
}

/** A save is always a plain object. Anything else means we mis-parsed. */
function isSaveObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Tolerant parse — accepts:
 *  - an already-parsed object (some bridges do this despite the string-typed
 *    interface)
 *  - a normal JSON string
 *  - a JSON string that got double-wrapped in an extra layer of quotes
 *    (e.g. from manually pasting a DevTools-displayed value back into
 *    Local Storage)
 *
 * Returns null for anything that isn't a save object, so a malformed value
 * degrades to "start fresh" instead of hydrating the game from garbage.
 */
function tryParseSaveData(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null

  if (typeof raw === 'object') {
    if (!isSaveObject(raw)) {
      // console.error('[Storage] raw value was an unexpected object shape, discarding')
      return null
    }
    // console.log('[Storage] raw value was already an object, skipping JSON.parse')
    return raw
  }

  if (typeof raw !== 'string') {
    // console.error('[Storage] raw value was an unexpected type:', typeof raw, raw)
    return null
  }

  for (const candidate of unescapeCandidates(raw)) {
    const parsed = attemptParse(candidate)
    if (parsed !== undefined) {
      // console.warn('[Storage] recovered save from a non-canonical value')
      return parsed
    }
  }

  // console.error('[Storage] could not parse saved game at all, starting fresh')
  return null
}

/**
 * The strings worth trying, in order, when the raw value didn't parse straight
 * to an object. Two distinct ways a save ends up double-wrapped:
 *
 *  - programmatically JSON-encoded twice, leaving the inner quotes escaped:
 *    `"{\"funds\":1}"`. Stripping the outer quotes still isn't valid JSON, so
 *    parsing the raw value first to get the unescaped string is the way in.
 *  - hand-pasted from a DevTools view, leaving the inner quotes intact:
 *    `"{"funds":1}"`. Slicing the outer quotes is the way in.
 */
function unescapeCandidates(raw: string): string[] {
  const candidates = [raw]

  try {
    const unwrapped = JSON.parse(raw)
    if (typeof unwrapped === 'string') candidates.push(unwrapped)
  } catch (e) {
    // console.warn('[Storage] could not unwrap one layer of quoting', e)
  }

  if (raw.length > 1 && raw.startsWith('"') && raw.endsWith('"')) {
    candidates.push(raw.slice(1, -1))
  }

  return candidates
}

/**
 * Parses one candidate string, yielding undefined for anything that isn't a
 * save object.
 *
 * The object check matters: a double-wrapped save parses without error but
 * yields the *inner* JSON string rather than an object. Returning that would
 * hand HYDRATE a string, whose spread contributes character-index keys instead
 * of save fields — quietly resetting the player's career with no error anywhere.
 */
function attemptParse(candidate: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(candidate)
    return isSaveObject(parsed) ? parsed : undefined
  } catch (e) {
    // console.warn('[Storage] JSON.parse failed', e)
    return undefined
  }
}

/** Returns null if there's no save yet (or it couldn't be read) — caller keeps the fresh initial state in that case. */
export async function loadSaveData(): Promise<SaveData | null> {
  try {
    const raw = await platform.storageGet(STORAGE_KEY)
    // console.log('[Storage] loadSaveData raw =', raw, 'typeof =', typeof raw)
    if (!raw) {
      // console.log('[Storage] no saved game, starting fresh')
      return null
    }

    const parsed = tryParseSaveData(raw)
    if (parsed === null) {
      // console.error('[Storage] could not parse saved game at all, starting fresh. Raw value was:', raw)
      return null
    }

    // console.log('[Storage] loaded save', parsed)

    // If raw wasn't already a clean JSON string matching `parsed` (either it
    // was a pre-parsed object, or we had to recover it from a double-quoted
    // string), re-save in the canonical string format now.
    const isCleanString = typeof raw === 'string' && raw === JSON.stringify(parsed)
    if (!isCleanString) {
      // console.log('[Storage] re-saving in canonical format after non-standard load')
      saveGame(parsed as unknown as SaveData)
    }

    return parsed as unknown as SaveData
  } catch (e) {
    // console.error('[Storage] loadSaveData failed, starting fresh', e)
    return null
  }
}

export function saveGame(data: SaveData): void {
  // console.log('[Storage] saveGame', data)
  platform.storageSet(STORAGE_KEY, JSON.stringify(data))
    .then(() => console.log('[Storage] save OK'))
    .catch(e => console.error('[Storage] save FAILED', e))
}
