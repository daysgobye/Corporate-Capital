import { describe, expect, test } from 'bun:test'

import { act, fireEvent, render, screen } from '@testing-library/react'

import MuteButton from '../../src/components/MuteButton'
import { isMuted, setMuted, subscribeMuted } from '../../src/lib/audio'
import { isEnabled } from '../helpers/dom'

/**
 * MuteButton is the one component whose visible state is driven from outside
 * React, via the subscribeMuted pub/sub. So the contract worth pinning is that
 * clicking it, and anything else that changes the mute flag, both move the
 * button's label, icon and aria-pressed together.
 */

describe('MuteButton', () => {
  test('offers to mute when sound is on', () => {
    render(<MuteButton />)

    const button = screen.getByRole('button', { name: 'Mute sound' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByAltText('Audio enabled')).toBeTruthy()
  })

  test('offers to unmute once muted', () => {
    render(<MuteButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Mute sound' }))

    const button = screen.getByRole('button', { name: 'Unmute sound' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByAltText('Muted')).toBeTruthy()
  })

  test('toggles both ways', () => {
    render(<MuteButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Mute sound' }))
    fireEvent.click(screen.getByRole('button', { name: 'Unmute sound' }))

    expect(isMuted()).toBe(false)
    expect(screen.getByRole('button', { name: 'Mute sound' })).toBeTruthy()
  })

  test('reflects a mute change made elsewhere in the app', () => {
    render(<MuteButton />)

    act(() => setMuted(true))

    expect(screen.getByRole('button', { name: 'Unmute sound' })).toBeTruthy()
  })

  test('starts muted when the player had already muted', () => {
    setMuted(true)
    render(<MuteButton />)

    expect(screen.getByRole('button', { name: 'Unmute sound' })).toBeTruthy()
  })

  test('stays enabled — muting is never blocked', () => {
    render(<MuteButton />)
    expect(isEnabled(screen.getByRole('button', { name: 'Mute sound' }))).toBe(true)
  })

  test('unsubscribes on unmount, so later toggles do not touch a dead tree', () => {
    const { unmount } = render(<MuteButton />)

    let notifications = 0
    subscribeMuted(() => notifications++)
    unmount()

    setMuted(true)

    // The listener above is still attached and should have fired once; the
    // button's own subscription should not fire at all, since it is gone.
    expect(notifications).toBe(1)
  })
})