import { describe, expect, test } from 'bun:test'

import {
  AD_POPUP_MAX_DELAY_MS,
  AD_POPUP_MIN_DELAY_MS,
  AD_REWARD_FLOOR,
  AD_TIP_EYEBROWS,
  AD_TIP_LINES,
  AD_TIP_LINES_UNLOCKED,
  STARTER_AD_LINES,
  STARTER_AD_REWARD,
  UPGRADES,
  computeAdReward,
  pickAdFlavor,
  pickStarterAdCopy,
  randomAdDelayMs,
} from '../../src/game/content'
import { FORCE_ADS_UNLOCKED, adsEffectivelyUnlocked } from '../../src/game/config'

/** Sampling the random helpers a few hundred times is enough to catch a
 *  bounds check that is off by one without making the suite flaky. */
const SAMPLES = 500

describe('adsEffectivelyUnlocked', () => {
  test('the Playgama build leaves the flag off, since it has a real ad bridge', () => {
    expect(FORCE_ADS_UNLOCKED).toBe(false)
  })

  test('falls back to the player flag when the build override is off', () => {
    expect(adsEffectivelyUnlocked(false)).toBe(false)
    expect(adsEffectivelyUnlocked(true)).toBe(true)
  })

  test('an unlocked player is never re-locked by the build flag', () => {
    expect(adsEffectivelyUnlocked(true)).toBe(true)
  })
})

describe('computeAdReward', () => {
  test('always pays out at least one unit', () => {
    for (let i = 0; i < SAMPLES; i++) {
      expect(computeAdReward(0)).toBeGreaterThanOrEqual(1)
    }
  })

  test('respects the floor before the player has earned anything', () => {
    for (let i = 0; i < SAMPLES; i++) {
      const reward = computeAdReward(0)
      expect(reward).toBeGreaterThanOrEqual(AD_REWARD_FLOOR * 0.8 - 1)
      expect(reward).toBeLessThanOrEqual(AD_REWARD_FLOOR * 1.2 + 1)
    }
  })

  test('stays within the +/-20% band around the best-ever funds', () => {
    for (const maxFundsEver of [0, 137, 25_000, 4_000_000]) {
      const base = Math.max(maxFundsEver, AD_REWARD_FLOOR)
      for (let i = 0; i < SAMPLES; i++) {
        const reward = computeAdReward(maxFundsEver)
        expect(reward).toBeGreaterThanOrEqual(Math.floor(base * 0.8))
        expect(reward).toBeLessThanOrEqual(Math.ceil(base * 1.2))
      }
    }
  })

  test('pays out whole units of currency', () => {
    for (let i = 0; i < SAMPLES; i++) {
      expect(Number.isInteger(computeAdReward(12_345))).toBe(true)
    }
  })

  test('scales with career progress rather than staying flat', () => {
    const early = Array.from({ length: SAMPLES }, () => computeAdReward(100)).reduce((a, b) => a + b) / SAMPLES
    const late = Array.from({ length: SAMPLES }, () => computeAdReward(1_000_000)).reduce((a, b) => a + b) / SAMPLES
    expect(late).toBeGreaterThan(early * 100)
  })
})

describe('randomAdDelayMs', () => {
  test('lands between the min and max popup delays', () => {
    for (let i = 0; i < SAMPLES; i++) {
      const delay = randomAdDelayMs()
      expect(delay).toBeGreaterThanOrEqual(AD_POPUP_MIN_DELAY_MS)
      expect(delay).toBeLessThanOrEqual(AD_POPUP_MAX_DELAY_MS)
    }
  })

  test('actually varies, so the popup is not a metronome', () => {
    const seen = new Set(Array.from({ length: SAMPLES }, () => Math.round(randomAdDelayMs())))
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('pickAdFlavor', () => {
  test('always pairs a known eyebrow with a known one-liner', () => {
    for (const adsUnlocked of [false, true]) {
      for (let i = 0; i < SAMPLES; i++) {
        const flavor = pickAdFlavor(adsUnlocked)
        expect(AD_TIP_EYEBROWS).toContain(flavor.eyebrow)
        expect(flavor.copy.length).toBeGreaterThan(0)
      }
    }
  })

  test('draws the locked pool while the ad step is still in play', () => {
    for (let i = 0; i < SAMPLES; i++) {
      expect(AD_TIP_LINES).toContain(pickAdFlavor(false).copy)
    }
  })

  test('draws the unlocked pool once the ad step is skipped', () => {
    for (let i = 0; i < SAMPLES; i++) {
      expect(AD_TIP_LINES_UNLOCKED).toContain(pickAdFlavor(true).copy)
    }
  })

  test('the two pools never overlap, so unlocking visibly changes the copy', () => {
    for (const line of AD_TIP_LINES) {
      expect(AD_TIP_LINES_UNLOCKED).not.toContain(line)
    }
  })
})

describe('starter ad offer', () => {
  test('copy always comes from the starter pool', () => {
    for (let i = 0; i < SAMPLES; i++) {
      expect(STARTER_AD_LINES).toContain(pickStarterAdCopy())
    }
  })

  test('the welcome bonus outpaces the entry-level upgrades it is meant to enable', () => {
    // The design note on STARTER_AD_REWARD says it is "deliberately generous
    // relative to the ~$25-60 cost of the first upgrades" — so tie the assertion
    // to the actual cheapest starting upgrades instead of a hardcoded number,
    // and require it to buy several of them outright.
    const startingCosts = UPGRADES.filter((u) => u.phase === 1 && !u.requiresMilestone).map(
      (u) => u.baseCost,
    )
    const cheapest = Math.min(...startingCosts)

    expect(startingCosts.length).toBeGreaterThan(0)
    expect(STARTER_AD_REWARD / cheapest).toBeGreaterThanOrEqual(5)
  })
})