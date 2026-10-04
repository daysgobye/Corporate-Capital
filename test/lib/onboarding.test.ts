import { beforeEach, describe, expect, test } from 'bun:test'

import { isOnboardingSeen, markOnboardingSeen } from '../../src/lib/onboarding'

/**
 * Runs against the real NullPlatform, so this exercises the localStorage
 * fallback path end to end.
 */

beforeEach(() => {
  localStorage.clear()
})

describe('onboarding flag', () => {
  test('is unseen on a fresh install', async () => {
    expect(await isOnboardingSeen()).toBe(false)
  })

  test('is seen once marked', async () => {
    markOnboardingSeen()
    await Promise.resolve()

    expect(await isOnboardingSeen()).toBe(true)
  })

  test('stays seen across repeated marks', async () => {
    markOnboardingSeen()
    markOnboardingSeen()
    await Promise.resolve()

    expect(await isOnboardingSeen()).toBe(true)
  })

  test('reads false again once storage is cleared', async () => {
    markOnboardingSeen()
    await Promise.resolve()
    expect(await isOnboardingSeen()).toBe(true)

    localStorage.clear()
    expect(await isOnboardingSeen()).toBe(false)
  })

  test('treats any other stored value as unseen', async () => {
    // Only the exact '1' counts, so a corrupted value falls back to showing
    // onboarding rather than silently skipping it forever.
    localStorage.setItem('hct_onboarding_seen_v1', 'true')
    expect(await isOnboardingSeen()).toBe(false)

    localStorage.setItem('hct_onboarding_seen_v1', '')
    expect(await isOnboardingSeen()).toBe(false)

    localStorage.setItem('hct_onboarding_seen_v1', '0')
    expect(await isOnboardingSeen()).toBe(false)
  })

  test('reports unseen rather than throwing when storage is blocked', async () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('storage disabled')
    }

    try {
      expect(await isOnboardingSeen()).toBe(false)
    } finally {
      Storage.prototype.getItem = original
    }
  })

  test('marking never throws, even when the write fails', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded')
    }

    try {
      expect(() => markOnboardingSeen()).not.toThrow()
    } finally {
      Storage.prototype.setItem = original
    }
  })
})