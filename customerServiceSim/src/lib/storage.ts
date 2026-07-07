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
 * NOTE: IPlatform.storageGet is typed as returning `string | null`, but
 * in practice some bridges (observed with Playgama) already return a
 * parsed object rather than a raw JSON string. We defensively handle
 * both shapes here rather than trusting the type.
 */
import type { GameState, Phase, Ticket } from '../game/types'
import { platform } from './platform/index'

const STORAGE_KEY = 'hct_save_v1-5'

/** The subset of GameState worth persisting between sessions. */
export interface SaveData {
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
}

export function extractSaveData(state: GameState): SaveData {
  return {
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
function tryParseSaveData(raw: unknown): unknown | null {
  if (raw === null || raw === undefined) return null

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
      console.warn('[Storage] recovered save after stripping an extra outer quote layer')
      return recovered
    } catch (e) {
      console.error('[Storage] recovery attempt also failed', e)
    }
  }

  return null
}

/** Returns null if there's no save yet (or it couldn't be read) — caller keeps the fresh initial state in that case. */
export async function loadSaveData(): Promise<SaveData | null> {
  try {
    const raw = await platform.storageGet(STORAGE_KEY)
    console.log('[Storage] loadSaveData raw =', raw, 'typeof =', typeof raw)
    if (!raw) {
      console.log('[Storage] no saved game, starting fresh')
      return null
    }

    const parsed = tryParseSaveData(raw)
    if (parsed === null) {
      console.error('[Storage] could not parse saved game at all, starting fresh. Raw value was:', raw)
      return null
    }

    console.log('[Storage] loaded save', parsed)

    // If raw wasn't already a clean JSON string matching `parsed` (either it
    // was a pre-parsed object, or we had to recover it from a double-quoted
    // string), re-save in the canonical string format now.
    const isCleanString = typeof raw === 'string' && raw === JSON.stringify(parsed)
    if (!isCleanString) {
      console.log('[Storage] re-saving in canonical format after non-standard load')
      saveGame(parsed as SaveData)
    }

    return parsed as SaveData
  } catch (e) {
    console.error('[Storage] loadSaveData failed, starting fresh', e)
    return null
  }
}

export function saveGame(data: SaveData): void {
  console.log('[Storage] saveGame', data)
  platform.storageSet(STORAGE_KEY, JSON.stringify(data))
    .then(() => console.log('[Storage] save OK'))
    .catch(e => console.error('[Storage] save FAILED', e))
}
