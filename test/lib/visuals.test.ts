import { beforeEach, describe, expect, test } from 'bun:test'

import {
  initVisualsMuted,
  isVisualsMuted,
  setVisualsMuted,
  subscribeVisualsMuted,
  toggleVisualsMuted,
} from '../../src/lib/visuals'

/** Cosmetic-effects toggle. Kept deliberately independent of the audio mute
 *  preference, so silencing sound never has to silence confetti too. */

beforeEach(() => {
  setVisualsMuted(false)
})

describe('visuals mute preference', () => {
  test('starts unmuted', () => {
    expect(isVisualsMuted()).toBe(false)
  })

  test('setVisualsMuted flips the reported state', () => {
    setVisualsMuted(true)
    expect(isVisualsMuted()).toBe(true)

    setVisualsMuted(false)
    expect(isVisualsMuted()).toBe(false)
  })

  test('toggleVisualsMuted flips and reports the new state', () => {
    expect(toggleVisualsMuted()).toBe(true)
    expect(isVisualsMuted()).toBe(true)

    expect(toggleVisualsMuted()).toBe(false)
    expect(isVisualsMuted()).toBe(false)
  })
})

describe('subscribeVisualsMuted', () => {
  test('notifies on every change', () => {
    const seen: boolean[] = []
    subscribeVisualsMuted((muted) => seen.push(muted))

    setVisualsMuted(true)
    setVisualsMuted(false)

    expect(seen).toEqual([true, false])
  })

  test('stops notifying after unsubscribe', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeVisualsMuted((muted) => seen.push(muted))

    setVisualsMuted(true)
    unsubscribe()
    setVisualsMuted(false)

    expect(seen).toEqual([true])
  })

  test('unsubscribing one subscriber leaves the others attached', () => {
    const kept: boolean[] = []
    const dropped: boolean[] = []
    const unsubscribeDropped = subscribeVisualsMuted((muted) => dropped.push(muted))
    subscribeVisualsMuted((muted) => kept.push(muted))

    unsubscribeDropped()
    setVisualsMuted(true)

    expect(dropped).toEqual([])
    expect(kept).toEqual([true])
  })
})

describe('initVisualsMuted', () => {
  test('hydrates once and then ignores later storage reads', async () => {
    // The module guards on a one-shot initialized flag, so a second boot-time
    // call must not clobber the player's live choice with a stale stored value.
    await initVisualsMuted()
    setVisualsMuted(true)

    await initVisualsMuted()

    expect(isVisualsMuted()).toBe(true)
  })
})