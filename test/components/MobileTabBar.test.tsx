import { describe, expect, test } from 'bun:test'

import { fireEvent, render, screen } from '@testing-library/react'

import MobileTabBar from '../../src/components/MobileTabBar'
import type { MobileTab } from '../../src/components/MobileTabBar'
import { classNamesOf } from '../helpers/dom'

/**
 * The tab bar is the only way to reach the panels on mobile, so each tab needs
 * to be individually selectable and the active one visually marked.
 */

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'upgrades', label: 'Upgrades' },
]

function tabButton(label: string): HTMLElement {
  return screen.getByRole('button', { name: label })
}

describe('MobileTabBar', () => {
  test('renders a tab per panel', () => {
    render(<MobileTabBar active="queue" onChange={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(TABS.length)
    for (const tab of TABS) {
      expect(tabButton(tab.label)).toBeTruthy()
    }
  })

  test('marks exactly the active tab', () => {
    render(<MobileTabBar active="dashboard" onChange={() => {}} />)

    for (const tab of TABS) {
      const classes = classNamesOf(tabButton(tab.label))
      const isActive = classes.includes('mobile-tab-active')
      expect(isActive).toBe(tab.id === 'dashboard')
    }
  })

  test('reports the tab that was clicked', () => {
    const changes: MobileTab[] = []
    render(<MobileTabBar active="queue" onChange={(tab) => changes.push(tab)} />)

    fireEvent.click(tabButton('Upgrades'))

    expect(changes).toEqual(['upgrades'])
  })

  test('reports each tab in turn', () => {
    const changes: MobileTab[] = []
    render(<MobileTabBar active="queue" onChange={(tab) => changes.push(tab)} />)

    for (const tab of TABS) {
      fireEvent.click(tabButton(tab.label))
    }

    expect(changes).toEqual(['queue', 'dashboard', 'upgrades'])
  })

  test('reports a click on the already-active tab too, so a tap always lands', () => {
    const changes: MobileTab[] = []
    render(<MobileTabBar active="queue" onChange={(tab) => changes.push(tab)} />)

    fireEvent.click(tabButton('Queue'))

    expect(changes).toEqual(['queue'])
  })

  test('stays controlled — clicking does not move the marker itself', () => {
    render(<MobileTabBar active="queue" onChange={() => {}} />)

    fireEvent.click(tabButton('Upgrades'))

    expect(classNamesOf(tabButton('Queue'))).toContain('mobile-tab-active')
    expect(classNamesOf(tabButton('Upgrades'))).not.toContain('mobile-tab-active')
  })

  test('is labelled as panel-switching navigation', () => {
    render(<MobileTabBar active="queue" onChange={() => {}} />)

    const nav = screen.getByRole('navigation', { name: 'Switch panel' })
    expect(nav.querySelectorAll('button')).toHaveLength(TABS.length)
  })
})