import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import type { IPlatform } from '../../src/lib/platform/IPlatform'
import type { SaveData } from '../../src/lib/storage'

/**
 * installPlatform swaps the platform module for one whose storageGet returns
 * whatever the test asks for. Needed because the real bridges are the reason
 * loadSaveData has to be tolerant in the first place — localStorage can only
 * ever hand back a clean JSON string, so the interesting shapes (a pre-parsed
 * object, a throwing bridge) are unreachable without a stand-in.
 */
let storageValue: unknown = null
let storageError: Error | null = null
const written: { key: string; value: string }[] = []

const fakePlatform: IPlatform = {
  init: async () => {},
  gameReady: () => {},
  storageGet: async () => {
    if (storageError) throw storageError
    return storageValue as string | null
  },
  storageSet: async (key, value) => {
    written.push({ key, value })
  },
  showInterstitial: async () => {},
  showRewarded: async () => false,
  language: 'en',
  isRewardedSupported: false,
  leaderboardType: 'not_available',
  setLeaderboardScore: async () => {},
  getLeaderboardEntries: async () => [],
  showLeaderboardPopup: async () => {},
  isAudioEnabled: true,
  onAudioStateChanged: () => () => {},
  onPauseStateChanged: () => () => {},
}

mock.module('../../src/lib/platform/index', () => ({
  platform: fakePlatform,
}))

const { loadSaveData, saveGame } = await import('../../src/lib/storage')

// Bun's mock.module is process-global and cannot be un-mocked, so this file
// would otherwise leave the fake in place for every later test file — silently
// swapping their storage backend for a stub. Hand the module back to the real
// NullPlatform once these tests are done.
afterAll(async () => {
  const { NullPlatform } = await import('../../src/lib/platform/NullPlatfrom')
  mock.module('../../src/lib/platform/index', () => ({ platform: new NullPlatform() }))
})

const VALID_SAVE: SaveData = {
  starterAdOffered: true,
  nextId: 17,
  phase: 1,
  promotions: 1,
  payoutMultiplier: 1,
  funds: 4242,
  currencyLabel: 'Corporate Capital',
  queue: [{ id: 3, requiredChars: 40 }],
  activeTicket: { id: 4, requiredChars: 55 },
  manualProgress: 12,
  jobLevel: 4,
  titleModifiers: ['Senior'],
  upgradeLevels: { keyboardLube: 2 },
  milestonesUnlocked: { cannedResponses: true },
  aiBotNodes: 3,
  agentCount: 0,
  ticketsClosed: 88,
  maxFundsEver: 9000,
  adsUnlocked: false,
  afkUnlocked: true,
  afkMinutesCap: 40,
  lastSavedAt: 1_700_000_000_000,
}

beforeEach(() => {
  storageValue = null
  storageError = null
  written.length = 0
})

afterEach(() => {
  storageValue = null
  storageError = null
})

describe('loadSaveData', () => {
  test('returns null when there is no save yet', async () => {
    storageValue = null
    expect(await loadSaveData()).toBeNull()
  })

  test('returns null for an empty string', async () => {
    storageValue = ''
    expect(await loadSaveData()).toBeNull()
  })

  test('reads a normal JSON string', async () => {
    storageValue = JSON.stringify(VALID_SAVE)
    expect(await loadSaveData()).toEqual(VALID_SAVE)
  })

  test('does not re-save a save that was already in canonical form', async () => {
    storageValue = JSON.stringify(VALID_SAVE)
    await loadSaveData()
    expect(written).toHaveLength(0)
  })

  test('accepts a bridge that already returned a parsed object', async () => {
    storageValue = { ...VALID_SAVE }

    expect(await loadSaveData()).toEqual(VALID_SAVE)
    expect(written).toHaveLength(1)
    expect(JSON.parse(written[0].value)).toEqual(VALID_SAVE)
  })

  test('recovers a save that was double-wrapped in an extra quote layer', async () => {
    // What you get from pasting a DevTools-displayed value back into Local
    // Storage by hand — the string arrives quoted one layer too deep.
    storageValue = JSON.stringify(JSON.stringify(VALID_SAVE))

    expect(await loadSaveData()).toEqual(VALID_SAVE)
    expect(written).toHaveLength(1)
  })

  test('returns null for unparseable garbage rather than throwing', async () => {
    storageValue = '{ this is not json'
    expect(await loadSaveData()).toBeNull()
  })

  test('returns null for a double-quoted string that is still not JSON', async () => {
    storageValue = '"still not json"'
    expect(await loadSaveData()).toBeNull()
  })

  test('returns null for a value of an unexpected type', async () => {
    storageValue = 12345
    expect(await loadSaveData()).toBeNull()
  })

  test('returns null when the bridge itself throws', async () => {
    storageError = new Error('bridge unavailable')
    expect(await loadSaveData()).toBeNull()
  })

  test('always reads and writes the same storage key', async () => {
    storageValue = { ...VALID_SAVE }
    await loadSaveData()

    expect(written).toHaveLength(1)
    const key = written[0].key

    storageValue = null
    storageError = null
    saveGame(VALID_SAVE)
    await Promise.resolve()

    expect(written[1].key).toBe(key)
  })

  test('saveGame writes a JSON string, not an object', async () => {
    saveGame(VALID_SAVE)
    await Promise.resolve()

    expect(typeof written[0].value).toBe('string')
    expect(JSON.parse(written[0].value)).toEqual(VALID_SAVE)
  })

  test('saveGame survives a bridge that rejects', async () => {
    storageError = new Error('quota exceeded')
    expect(() => saveGame(VALID_SAVE)).not.toThrow()
  })
})