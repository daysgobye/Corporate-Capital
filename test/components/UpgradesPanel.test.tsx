import { describe, expect, test } from 'bun:test'

import { fireEvent, render, screen } from '@testing-library/react'

import UpgradesPanel from '../../src/components/UpgradesPanel'
import { MILESTONES, UPGRADES, scaledUpgradeCost, scaledMilestoneCost } from '../../src/game/content'
import { makeGameState } from '../helpers/gameState'
import { isDisabled, isEnabled } from '../helpers/dom'

/**
 * UpgradesPanel is where the hand-authored content table becomes visible UI, so
 * these tests check that a player only ever sees what their state unlocks, and
 * that affordability is read from the same scaled cost the engine charges.
 */

const noop = () => {}

function renderPanel(overrides = {}) {
  const bought: string[] = []
  const milestones: string[] = []
  const state = makeGameState({ funds: 0, ...overrides })

  const { container, unmount } = render(
    <UpgradesPanel
      state={state}
      onBuyUpgrade={(id) => bought.push(id)}
      onBuyMilestone={(id) => milestones.push(id)}
    />,
  )

  return { state, bought, milestones, unmount, container }
}

/**
 * Several upgrades share the same price, so a bare "$25" query matches more
 * than one button. Scope the lookup to the row that names the upgrade.
 */
function buyButtonFor(name: string): HTMLElement {
  const row = Array.from(document.querySelectorAll('li.upgrade-item')).find((item) =>
    item.textContent?.includes(name),
  )
  if (!row) throw new Error(`no upgrade row named ${name}`)
  return row.querySelector('button') as HTMLElement
}

const entryUpgrade = UPGRADES.find((u) => u.phase === 1 && !u.requiresMilestone)!
const gatedUpgrade = UPGRADES.find((u) => u.phase === 1 && u.requiresMilestone)!
const cappedUpgrade = UPGRADES.find((u) => Number.isFinite(u.maxLevel))!
const entryMilestone = MILESTONES.find((m) => m.phase === 1 && !m.requires)!
const gatedMilestone = MILESTONES.find((m) => m.phase === 1 && m.requires)!

describe('upgrade visibility', () => {
  test('lists exactly the ungated upgrades for the current phase', () => {
    const { container } = render(
      <UpgradesPanel state={makeGameState({ phase: 1 })} onBuyUpgrade={noop} onBuyMilestone={noop} />,
    )

    const items = container.querySelectorAll('.upgrade-list > li')
    const expected = UPGRADES.filter((u) => u.phase === 1 && !u.requiresMilestone)

    expect(items.length).toBe(expected.length)
    for (const def of expected) {
      expect(screen.getByText(def.name)).toBeTruthy()
    }
  })

  test('hides upgrades belonging to other phases', () => {
    renderPanel({ phase: 1 })

    for (const def of UPGRADES.filter((u) => u.phase !== 1)) {
      expect(screen.queryByText(def.name)).toBeNull()
    }
  })

  test('hides a gated upgrade until its milestone is unlocked', () => {
    renderPanel({ phase: 1 })
    expect(screen.queryByText(gatedUpgrade.name)).toBeNull()
  })

  test('shows a gated upgrade once its milestone is unlocked', () => {
    renderPanel({ phase: 1, milestonesUnlocked: { [gatedUpgrade.requiresMilestone!]: true } })
    expect(screen.getByText(gatedUpgrade.name)).toBeTruthy()
  })

  test('shows a different set of upgrades in a later phase', () => {
    const { container, unmount } = renderPanel({ phase: 3 })

    expect(screen.queryByText(entryUpgrade.name)).toBeNull()
    expect(container.querySelectorAll('.upgrade-list > li').length).toBe(
      UPGRADES.filter((u) => u.phase === 3 && !u.requiresMilestone).length,
    )
    unmount()
  })
})

describe('upgrade purchase buttons', () => {
  test('charges the prestige-scaled cost', () => {
    renderPanel({ phase: 1, promotions: 2 })

    const expected = scaledUpgradeCost(entryUpgrade, 0, 2)
    expect(buyButtonFor(entryUpgrade.name).textContent).toBe(`$${expected.toLocaleString('en-US')}`)
  })

  test('is disabled when the player cannot afford it', () => {
    renderPanel({ phase: 1, funds: 0 })
    expect(isDisabled(buyButtonFor(entryUpgrade.name))).toBe(true)
  })

  test('is enabled once funds cover it', () => {
    renderPanel({ phase: 1, funds: entryUpgrade.baseCost })
    expect(isEnabled(buyButtonFor(entryUpgrade.name))).toBe(true)
  })

  test('reports the purchase by id', () => {
    const { bought } = renderPanel({ phase: 1, funds: 1_000_000 })

    fireEvent.click(buyButtonFor(entryUpgrade.name))

    expect(bought).toEqual([entryUpgrade.id])
  })

  test('shows the current level against max', () => {
    renderPanel({ phase: 1, upgradeLevels: { [entryUpgrade.id]: 3 } })
    expect(screen.getByText(`Lv. 3/${entryUpgrade.maxLevel}`)).toBeTruthy()
  })

  test('starts at level zero when the upgrade is unowned', () => {
    renderPanel({ phase: 1 })
    expect(screen.getByText(`Lv. 0/${entryUpgrade.maxLevel}`)).toBeTruthy()
  })
})

describe('maxed upgrades', () => {
  test('collapse to a single MAXED row', () => {
    const { container } = render(
      <UpgradesPanel
        state={makeGameState({ phase: 1, upgradeLevels: { [cappedUpgrade.id]: cappedUpgrade.maxLevel } })}
        onBuyUpgrade={noop}
        onBuyMilestone={noop}
      />,
    )

    expect(container.querySelector('.upgrade-item-collapsed')).toBeTruthy()
    expect(screen.getByText('✓ MAXED')).toBeTruthy()
    expect(screen.queryByText(cappedUpgrade.description)).toBeNull()
  })

  test('expand to show their description when clicked', () => {
    renderPanel({ phase: 1, upgradeLevels: { [cappedUpgrade.id]: cappedUpgrade.maxLevel } })

    fireEvent.click(screen.getByText(cappedUpgrade.name))

    expect(screen.getByText(cappedUpgrade.description)).toBeTruthy()
    expect(isDisabled(screen.getByRole('button', { name: 'MAXED' }))).toBe(true)
  })

  test('collapse again on a second click', () => {
    renderPanel({ phase: 1, upgradeLevels: { [cappedUpgrade.id]: cappedUpgrade.maxLevel } })

    fireEvent.click(screen.getByText(cappedUpgrade.name))
    fireEvent.click(screen.getByText(cappedUpgrade.name))

    expect(screen.queryByText(cappedUpgrade.description)).toBeNull()
    expect(screen.getByText('✓ MAXED')).toBeTruthy()
  })
})

describe('milestone list', () => {
  test('offers the ungated milestones for the current phase', () => {
    renderPanel({ phase: 1 })

    for (const def of MILESTONES.filter((m) => m.phase === 1 && !m.requires)) {
      expect(screen.getByRole('button', { name: new RegExp(def.buttonLabel) })).toBeTruthy()
    }
  })

  test('hides a milestone whose prerequisite is not yet unlocked', () => {
    renderPanel({ phase: 1 })
    expect(screen.queryByRole('button', { name: new RegExp(gatedMilestone.buttonLabel) })).toBeNull()
  })

  test('shows a gated milestone once its prerequisite is unlocked', () => {
    renderPanel({ phase: 1, milestonesUnlocked: { [gatedMilestone.requires!]: true } })
    expect(screen.getByRole('button', { name: new RegExp(gatedMilestone.buttonLabel) })).toBeTruthy()
  })

  test('hides a milestone the player already bought', () => {
    renderPanel({ phase: 1, milestonesUnlocked: { [entryMilestone.id]: true } })
    expect(screen.queryByRole('button', { name: new RegExp(entryMilestone.buttonLabel) })).toBeNull()
  })

  test('charges the prestige-scaled cost alongside the button label', () => {
    renderPanel({ phase: 1, promotions: 3 })

    const expected = scaledMilestoneCost(entryMilestone, 3)
    expect(screen.getByText(`$${expected.toLocaleString('en-US')}`)).toBeTruthy()
  })

  test('is disabled when unaffordable', () => {
    renderPanel({ phase: 1, funds: 0 })
    const label = new RegExp(entryMilestone.buttonLabel)
    expect(isDisabled(screen.getByRole('button', { name: label }))).toBe(true)
  })

  test('is enabled when affordable', () => {
    renderPanel({ phase: 1, funds: 1_000_000_000 })
    const label = new RegExp(entryMilestone.buttonLabel)
    expect(isEnabled(screen.getByRole('button', { name: label }))).toBe(true)
  })

  test('reports the purchase by id', () => {
    const { milestones } = renderPanel({ phase: 1, funds: 1_000_000_000 })

    fireEvent.click(screen.getByRole('button', { name: new RegExp(entryMilestone.buttonLabel) }))

    expect(milestones).toEqual([entryMilestone.id])
  })
})

describe('empty states', () => {
  test('says so when a rung has nothing left to unlock', () => {
    const phaseThreeMilestones = MILESTONES.filter((m) => m.phase === 3).map((m) => m.id)
    const everythingMaxed = UPGRADES.filter((u) => u.phase === 3).reduce<Record<string, number>>(
      (levels, def) => {
        levels[def.id] = def.maxLevel
        return levels
      },
      {},
    )

    renderPanel({
      phase: 3,
      funds: 1_000_000_000,
      upgradeLevels: everythingMaxed,
      milestonesUnlocked: Object.fromEntries(phaseThreeMilestones.map((id) => [id, true])),
    })

    expect(screen.getByText('No further milestones on this rung. Keep grinding.')).toBeTruthy()
  })

  test('prompts the player to unlock a milestone when a phase starts empty', () => {
    renderPanel({ phase: 2 })
    expect(screen.getByText('Unlock a milestone below to reveal more upgrades.')).toBeTruthy()
  })
})

describe('purchase flash toast', () => {
  test('announces the upgrade just bought', () => {
    renderPanel({ phase: 1, upgradeFlashId: 3, upgradeFlashLabel: entryUpgrade.name })
    expect(screen.getByText(`⚡ ${entryUpgrade.name}!`)).toBeTruthy()
  })

  test('stays hidden before anything has been bought', () => {
    renderPanel({ phase: 1, upgradeFlashId: 0, upgradeFlashLabel: '' })
    expect(screen.queryByText(/⚡/)).toBeNull()
  })
})