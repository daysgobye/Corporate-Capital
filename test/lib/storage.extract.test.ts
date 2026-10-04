import { describe, expect, test } from 'bun:test'

import { extractSaveData } from '../../src/lib/storage'
import type { SaveData } from '../../src/lib/storage'
import { makeGameState } from '../helpers/gameState'

/**
 * The persisted slice is deliberately narrower than GameState: per-frame effect
 * state must never be restored, or a returning player gets a screen full of
 * stale confetti and a resurrected ad popup. These tests pin both directions —
 * what must survive a reload, and what must not.
 */

const TRANSIENT_KEYS = [
  'particles',
  'floaters',
  'moneyFloaters',
  'moneyFloaterSeq',
  'moneyShakeId',
  'shake',
  'confettiBurst',
  'stamp',
  'arrivalPulse',
  'upgradeFlashId',
  'upgradeFlashLabel',
  'titleFlashMs',
  'typedPreview',
  'adPopup',
  'adTimerMs',
  'afkSummary',
  'autoSendPulse',
  'incomeRatePerMin',
  'cannedCooldownMs',
  'aiBotAccumMs',
  'agentAccumMs',
  'agentUpkeepAccumMs',
  'ticketGenAccumMs',
  'closedThisSecond',
  'ticketsPerSec',
  'secondAccumMs',
  'secondFundsSnapshot',
] as const

describe('extractSaveData', () => {
  test('carries the whole career-progress slice across a reload', () => {
    const state = makeGameState({
      funds: 12_345,
      nextId: 88,
      phase: 3,
      promotions: 2,
      payoutMultiplier: 2,
      jobLevel: 7,
      titleModifiers: ['Regional', 'Chief'],
      upgradeLevels: { keyboardLube: 4, coffeeMachine: 12 },
      milestonesUnlocked: { cannedResponses: true, aiBot: true },
      queue: [{ id: 5, requiredChars: 60 }],
      activeTicket: { id: 6, requiredChars: 90 },
      manualProgress: 33,
      aiBotNodes: 4,
      agentCount: 2,
      ticketsClosed: 512,
      maxFundsEver: 99_999,
      adsUnlocked: true,
      afkUnlocked: true,
      afkMinutesCap: 85,
      starterAdOffered: true,
    })

    const save = extractSaveData(state)

    expect(save.funds).toBe(12_345)
    expect(save.nextId).toBe(88)
    expect(save.phase).toBe(3)
    expect(save.promotions).toBe(2)
    expect(save.payoutMultiplier).toBe(2)
    expect(save.jobLevel).toBe(7)
    expect(save.titleModifiers).toEqual(['Regional', 'Chief'])
    expect(save.upgradeLevels).toEqual({ keyboardLube: 4, coffeeMachine: 12 })
    expect(save.milestonesUnlocked).toEqual({ cannedResponses: true, aiBot: true })
    expect(save.queue).toEqual([{ id: 5, requiredChars: 60 }])
    expect(save.activeTicket).toEqual({ id: 6, requiredChars: 90 })
    expect(save.manualProgress).toBe(33)
    expect(save.aiBotNodes).toBe(4)
    expect(save.agentCount).toBe(2)
    expect(save.ticketsClosed).toBe(512)
    expect(save.maxFundsEver).toBe(99_999)
    expect(save.adsUnlocked).toBe(true)
    expect(save.afkUnlocked).toBe(true)
    expect(save.afkMinutesCap).toBe(85)
    expect(save.starterAdOffered).toBe(true)
  })

  test('never persists per-frame effect state', () => {
    const save = extractSaveData(
      makeGameState({
        particles: [{ id: 1, text: 'x', left: 0, colorVar: 'red' }],
        floaters: [{ id: 2, amount: 10, left: 0 }],
        moneyFloaters: [{ id: 3, amount: 10 }],
        shake: true,
        confettiBurst: 'big',
        stamp: { id: 4, text: 'SYNERGY!' },
        adPopup: { id: 5, rewardAmount: 500, eyebrow: 'Insider Tip', copy: 'Buy low' },
        adTimerMs: 42_000,
        afkSummary: {
          id: 6,
          minutes: 30,
          ticketsClosed: 40,
          fundsGained: 900,
          headline: 'THE QUEUE MOVED ON',
          subline: 'While you were gone...',
          bonusClaimed: false,
        },
      }),
    ) as unknown as Record<string, unknown>

    for (const key of TRANSIENT_KEYS) {
      expect(save).not.toHaveProperty(key)
    }
  })

  test('stamps the save with the current time for AFK catch-up', () => {
    const before = Date.now()
    const save = extractSaveData(makeGameState())
    const after = Date.now()

    expect(save.lastSavedAt).toBeGreaterThanOrEqual(before)
    expect(save.lastSavedAt).toBeLessThanOrEqual(after)
  })

  test('decouples the top-level scalars from the live state', () => {
    const state = makeGameState({ funds: 12_345, ticketsClosed: 7 })
    const save = extractSaveData(state)

    save.funds = 0
    save.ticketsClosed = 0

    expect(state.funds).toBe(12_345)
    expect(state.ticketsClosed).toBe(7)
  })

  test('shares nested collections by reference, not by copy', () => {
    // extractSaveData is a shallow pick, so upgradeLevels/queue/activeTicket
    // are the same objects the live state holds. That is safe today only
    // because saveGame stringifies immediately and every writer in the engine
    // replaces the object rather than mutating it. If that ever changes — an
    // in-place `state.upgradeLevels[id] = level`, say — the save would drift
    // with it, so this test records the current contract explicitly.
    const state = makeGameState({ upgradeLevels: { keyboardLube: 2 } })
    const save = extractSaveData(state)

    expect(save.upgradeLevels).toBe(state.upgradeLevels)
    expect(save.queue).toBe(state.queue)
    expect(save.milestonesUnlocked).toBe(state.milestonesUnlocked)
  })

  test('produces something JSON round-trippable', () => {
    const save = extractSaveData(makeGameState({ funds: 999, ticketsClosed: 7 }))

    expect(JSON.parse(JSON.stringify(save))).toEqual(save)
  })

  test('contains no undefined values, which would vanish on serialize', () => {
    const save = extractSaveData(makeGameState()) as unknown as Record<string, unknown>

    for (const [key, value] of Object.entries(save)) {
      expect(value).not.toBeUndefined()
      expect(save).toHaveProperty(key)
    }
  })
})

describe('SaveData shape', () => {
  test('declares lastSavedAt, which the AFK catch-up depends on', () => {
    // Compile-time guarantee, asserted so the field cannot be dropped silently.
    const save: SaveData = extractSaveData(makeGameState())
    expect(typeof save.lastSavedAt).toBe('number')
  })
})