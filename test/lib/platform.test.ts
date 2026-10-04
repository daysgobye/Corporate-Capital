import { describe, expect, test } from 'bun:test'

import { NullPlatform } from '../../src/lib/platform/NullPlatfrom'
import type { IPlatform } from '../../src/lib/platform/IPlatform'

/**
 * NullPlatform is the fallback for local dev and for the itch.io build, where
 * there is no ad SDK and no bridge. Everything it does is a deliberate no-op,
 * so the contract worth pinning is that the no-ops resolve rather than reject:
 * a throw here would take down the boot path on exactly the platforms least
 * able to report the error.
 */
function makePlatform(): IPlatform {
  return new NullPlatform()
}

describe('NullPlatform capabilities', () => {
  test('reports no rewarded-ad support', () => {
    expect(makePlatform().isRewardedSupported).toBe(false)
  })

  test('reports no leaderboard', () => {
    expect(makePlatform().leaderboardType).toBe('not_available')
  })

  test('treats audio as allowed, deferring to the in-game mute', () => {
    expect(makePlatform().isAudioEnabled).toBe(true)
  })

  test('exposes a bare language tag', () => {
    const language = makePlatform().language
    expect(language).toBeTruthy()
    expect(language).not.toContain('-')
  })
})

describe('NullPlatform boot sequence', () => {
  test('init and gameReady both resolve', async () => {
    const platform = makePlatform()
    await expect(platform.init()).resolves.toBeUndefined()
    expect(() => platform.gameReady()).not.toThrow()
  })
})

describe('NullPlatform ads', () => {
  test('showRewarded resolves false so callers take the no-reward path', async () => {
    expect(await makePlatform().showRewarded()).toBe(false)
    expect(await makePlatform().showRewarded('some-placement')).toBe(false)
  })

  test('showInterstitial resolves without throwing', async () => {
    await expect(makePlatform().showInterstitial()).resolves.toBeUndefined()
    await expect(makePlatform().showInterstitial('some-placement')).resolves.toBeUndefined()
  })
})

describe('NullPlatform storage', () => {
  test('round-trips a value through localStorage', async () => {
    const platform = makePlatform()
    const key = 'hct_test_platform_contract'

    await platform.storageSet(key, 'hello')
    expect(await platform.storageGet(key)).toBe('hello')

    localStorage.removeItem(key)
  })

  test('returns null for a key that was never written', async () => {
    expect(await makePlatform().storageGet('hct_test_never_written')).toBeNull()
  })

  test('returns null rather than throwing when storage is unavailable', async () => {
    // Private-mode Safari and locked-down webviews make localStorage throw on
    // access, not just on write. Loading must degrade, never crash.
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('storage disabled')
    }

    try {
      expect(await makePlatform().storageGet('hct_test_blocked')).toBeNull()
    } finally {
      Storage.prototype.getItem = original
    }
  })

  test('swallows write failures', async () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded')
    }

    try {
      await expect(makePlatform().storageSet('hct_test_blocked', 'x')).resolves.toBeUndefined()
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('NullPlatform leaderboards', () => {
  test('returns an empty entry list rather than rejecting', async () => {
    expect(await makePlatform().getLeaderboardEntries('any-board')).toEqual([])
  })

  test('score submission and popup display both resolve', async () => {
    const platform = makePlatform()
    await expect(platform.setLeaderboardScore('any-board', 1000)).resolves.toBeUndefined()
    await expect(platform.showLeaderboardPopup('any-board')).resolves.toBeUndefined()
  })
})

describe('NullPlatform subscriptions', () => {
  test('return an unsubscribe function that is safe to call', () => {
    const platform = makePlatform()

    expect(typeof platform.onAudioStateChanged(() => {})).toBe('function')
    expect(typeof platform.onPauseStateChanged(() => {})).toBe('function')

    expect(() => platform.onAudioStateChanged(() => {})()).not.toThrow()
    expect(() => platform.onPauseStateChanged(() => {})()).not.toThrow()
  })

  test('never invoke the callbacks, since nothing on this platform changes', () => {
    const platform = makePlatform()
    let audioCalls = 0
    let pauseCalls = 0

    platform.onAudioStateChanged(() => audioCalls++)
    platform.onPauseStateChanged(() => pauseCalls++)

    expect(audioCalls).toBe(0)
    expect(pauseCalls).toBe(0)
  })
})