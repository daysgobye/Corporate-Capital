import { beforeEach, describe, expect, test } from 'bun:test'

import { isMuted, setAdMuted, setMuted, subscribeMuted, toggleMute } from '../../src/lib/audio'

/**
 * The mute preference is module-level state shared by every subscriber, so each
 * test resets it rather than relying on declaration order.
 */
beforeEach(() => {
  setAdMuted(false)
  setMuted(false)
})

describe('mute preference', () => {
  test('starts unmuted', () => {
    expect(isMuted()).toBe(false)
  })

  test('setMuted flips the reported state', () => {
    setMuted(true)
    expect(isMuted()).toBe(true)

    setMuted(false)
    expect(isMuted()).toBe(false)
  })

  test('toggleMute flips and reports the new state', () => {
    expect(toggleMute()).toBe(true)
    expect(isMuted()).toBe(true)

    expect(toggleMute()).toBe(false)
    expect(isMuted()).toBe(false)
  })
})

describe('subscribeMuted', () => {
  test('notifies on every change', () => {
    const seen: boolean[] = []
    subscribeMuted((muted) => seen.push(muted))

    setMuted(true)
    setMuted(false)
    setMuted(true)

    expect(seen).toEqual([true, false, true])
  })

  test('notifies several subscribers independently', () => {
    const first: boolean[] = []
    const second: boolean[] = []
    subscribeMuted((muted) => first.push(muted))
    subscribeMuted((muted) => second.push(muted))

    setMuted(true)

    expect(first).toEqual([true])
    expect(second).toEqual([true])
  })

  test('stops notifying after unsubscribe', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeMuted((muted) => seen.push(muted))

    setMuted(true)
    unsubscribe()
    setMuted(false)

    expect(seen).toEqual([true])
  })

  test('unsubscribing one subscriber leaves the others attached', () => {
    const kept: boolean[] = []
    const dropped: boolean[] = []
    const unsubscribeDropped = subscribeMuted((muted) => dropped.push(muted))
    subscribeMuted((muted) => kept.push(muted))

    unsubscribeDropped()
    setMuted(true)

    expect(dropped).toEqual([])
    expect(kept).toEqual([true])
  })

  test('reports the current value to a late subscriber on the next change', () => {
    const seen: boolean[] = []
    setMuted(true)
    subscribeMuted((muted) => seen.push(muted))

    expect(seen).toEqual([])
    setMuted(false)
    expect(seen).toEqual([false])
  })
})

describe('ad muting', () => {
  test('is a transient flag that does not touch the player preference', () => {
    setMuted(false)

    setAdMuted(true)
    expect(isMuted()).toBe(false)

    setAdMuted(false)
    expect(isMuted()).toBe(false)
  })

  test('does not notify mute subscribers, so the button UI stays put', () => {
    const seen: boolean[] = []
    subscribeMuted((muted) => seen.push(muted))

    setAdMuted(true)
    setAdMuted(false)

    expect(seen).toEqual([])
  })
})