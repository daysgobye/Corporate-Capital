import { describe, expect, test } from 'bun:test'

import {
  MILESTONES,
  PRESTIGE_COST_SCALE,
  UPGRADES,
  costMultiplier,
  scaledMilestoneCost,
  scaledUpgradeCost,
  upgradeCost,
} from '../../src/game/content'

describe('upgradeCost', () => {
  test('level 0 is the bare base cost', () => {
    for (const def of UPGRADES) {
      expect(upgradeCost(def, 0)).toBe(def.baseCost)
    }
  })

  test('follows baseCost * costGrowth^level, rounded', () => {
    for (const def of UPGRADES) {
      for (const level of [0, 1, 2, 5, 10, 25]) {
        expect(upgradeCost(def, level)).toBe(Math.round(def.baseCost * def.costGrowth ** level))
      }
    }
  })

  test('strictly increases with level for every upgrade', () => {
    for (const def of UPGRADES) {
      let previous = upgradeCost(def, 0)
      for (let level = 1; level <= 30; level++) {
        const current = upgradeCost(def, level)
        expect(current).toBeGreaterThan(previous)
        previous = current
      }
    }
  })

  test('stays a whole number of currency at every level', () => {
    for (const def of UPGRADES) {
      for (let level = 0; level < 20; level++) {
        expect(Number.isInteger(upgradeCost(def, level))).toBe(true)
      }
    }
  })
})

describe('costMultiplier', () => {
  test('the first lap costs exactly what the content table says', () => {
    expect(costMultiplier(0)).toBe(1)
  })

  test('each promotion multiplies by PRESTIGE_COST_SCALE', () => {
    for (let promotions = 0; promotions < 12; promotions++) {
      expect(costMultiplier(promotions)).toBe(PRESTIGE_COST_SCALE ** promotions)
    }
  })

  test('never resets between laps — every lap starts pricier than the last', () => {
    expect(costMultiplier(1)).toBeGreaterThan(costMultiplier(0))
    expect(costMultiplier(2)).toBeGreaterThan(costMultiplier(1))
    // The loop the design depends on: lap N always begins above where
    // lap N-1's cheapest entry-level upgrade sat.
    const cheapestPerLap = [0, 1, 2, 3].map((promotions) =>
      Math.min(...UPGRADES.map((def) => scaledUpgradeCost(def, 0, promotions))),
    )
    for (let lap = 1; lap < cheapestPerLap.length; lap++) {
      expect(cheapestPerLap[lap]).toBeGreaterThan(cheapestPerLap[lap - 1])
    }
  })
})

describe('scaledUpgradeCost', () => {
  test('is the prestige multiplier applied to the raw curve', () => {
    for (const def of UPGRADES) {
      for (const promotions of [0, 1, 3, 7]) {
        for (const level of [0, 4, 12]) {
          expect(scaledUpgradeCost(def, level, promotions)).toBe(
            Math.round(upgradeCost(def, level) * costMultiplier(promotions)),
          )
        }
      }
    }
  })

  test('promotions only ever make things more expensive', () => {
    for (const def of UPGRADES) {
      let previous = scaledUpgradeCost(def, 0, 0)
      for (let promotions = 1; promotions <= 8; promotions++) {
        const current = scaledUpgradeCost(def, 0, promotions)
        expect(current).toBeGreaterThan(previous)
        previous = current
      }
    }
  })
})

describe('scaledMilestoneCost', () => {
  test('is the prestige multiplier applied to the flat cost', () => {
    for (const def of MILESTONES) {
      for (const promotions of [0, 1, 2, 5, 10]) {
        expect(scaledMilestoneCost(def, promotions)).toBe(
          Math.round(def.cost * costMultiplier(promotions)),
        )
      }
    }
  })

  test('unreachable milestones are never cheaper than their prerequisite', () => {
    const byId = new Map(MILESTONES.map((def) => [def.id, def]))
    for (const def of MILESTONES) {
      if (!def.requires) continue
      const prerequisite = byId.get(def.requires)
      if (!prerequisite) continue
      for (const promotions of [0, 2, 6]) {
        expect(scaledMilestoneCost(def, promotions)).toBeGreaterThan(
          scaledMilestoneCost(prerequisite, promotions),
        )
      }
    }
  })
})