import { describe, expect, test } from 'bun:test'

import { render, screen } from '@testing-library/react'

import StartMenu from '../../src/components/StartMenu'
import { isDisabled, isEnabled } from '../helpers/dom'

/**
 * StartMenu has no dependencies beyond React — pure props in, pure markup out.
 * That makes it the right place to pin the three states the boot sequence can
 * land on: still checking for a save, no save found, and a save found.
 */

const noop = () => {}

describe('StartMenu', () => {
  test('shows the loading state while the save is being checked', () => {
    render(<StartMenu loading hasSave={false} stats={null} onStart={noop} />)

    expect(isDisabled(screen.getByRole('button', { name: 'LOADING…' }))).toBe(true)
    expect(screen.getByText(/Retrieving your personnel file/i)).toBeTruthy()
  })

  test('offers a fresh start when there is no save', () => {
    render(<StartMenu loading={false} hasSave={false} stats={null} onStart={noop} />)

    expect(isEnabled(screen.getByRole('button', { name: 'BEGIN YOUR CAREER' }))).toBe(true)
    expect(screen.queryByText(/Retrieving your personnel file/i)).toBeNull()
  })

  test('summarises the existing career when a save is found', () => {
    render(
      <StartMenu
        loading={false}
        hasSave
        stats={{
          funds: 12_345,
          ticketsClosed: 678,
          promotions: 2,
          title: 'Regional Chief Ticket Wrangler',
        }}
        onStart={noop}
      />,
    )

    expect(isEnabled(screen.getByRole('button', { name: 'BACK TO THE GRIND' }))).toBe(true)
    expect(screen.getByText('$12,345')).toBeTruthy()
    expect(screen.getByText('678')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Regional Chief Ticket Wrangler')).toBeTruthy()
  })

  test('hides career stats while still loading, even with a save present', () => {
    render(
      <StartMenu
        loading
        hasSave
        stats={{ funds: 12_345, ticketsClosed: 678, promotions: 2, title: 'Regional Chief' }}
        onStart={noop}
      />,
    )

    expect(screen.queryByText('$12,345')).toBeNull()
    expect(isDisabled(screen.getByRole('button', { name: 'LOADING…' }))).toBe(true)
  })

  test('survives a save with no stats attached', () => {
    render(<StartMenu loading={false} hasSave stats={null} onStart={noop} />)

    expect(isEnabled(screen.getByRole('button', { name: 'BACK TO THE GRIND' }))).toBe(true)
    expect(screen.queryByText(/capital/)).toBeNull()
  })

  test('starts the career when the button is clicked', () => {
    let starts = 0
    render(<StartMenu loading={false} hasSave={false} stats={null} onStart={() => starts++} />)

    screen.getByRole('button', { name: 'BEGIN YOUR CAREER' }).click()

    expect(starts).toBe(1)
  })

  test('resumes the career from the same button when a save exists', () => {
    let starts = 0
    render(
      <StartMenu
        loading={false}
        hasSave
        stats={{ funds: 0, ticketsClosed: 0, promotions: 0, title: 'Junior Ticket Wrangler' }}
        onStart={() => starts++}
      />,
    )

    screen.getByRole('button', { name: 'BACK TO THE GRIND' }).click()

    expect(starts).toBe(1)
  })

  test('does not start while still loading', () => {
    let starts = 0
    render(<StartMenu loading hasSave={false} stats={null} onStart={() => starts++} />)

    screen.getByRole('button', { name: 'LOADING…' }).click()

    expect(starts).toBe(0)
  })

  test('presents itself as a modal dialog', () => {
    render(<StartMenu loading={false} hasSave={false} stats={null} onStart={noop} />)

    const dialog = screen.getByRole('dialog', { name: 'Corporate Capital main menu' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  test('picks one tagline and holds it steady across re-renders', () => {
    const { rerender } = render(
      <StartMenu loading={false} hasSave={false} stats={null} onStart={noop} />,
    )

    const tagline = screen.getByText(/.+/, { selector: '.start-menu-tagline' })
    const first = tagline.textContent
    expect(first).toBeTruthy()

    rerender(<StartMenu loading hasSave={false} stats={null} onStart={noop} />)

    expect(screen.getByText(/.+/, { selector: '.start-menu-tagline' }).textContent).toBe(first)
  })
})