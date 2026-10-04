import { describe, expect, test } from 'bun:test'

import {
  AFK_HEADLINES,
  AFK_UNLOCK_UPGRADE_IDS,
  BASE_TITLE,
  CANNED_LABELS,
  CURRENCY_LABEL,
  JARGON_CHUNKS,
  MILESTONES,
  SEND_PARTICLES,
  TICKET_SPAWN_MILESTONE_MS,
  TICKET_SPAWN_UPGRADE_MODIFIERS,
  TITLE_MODIFIERS,
  UPGRADES,
} from '../../src/game/content'
import type { Phase } from '../../src/game/types'

const PHASES: Phase[] = [1, 2, 3]

const upgradeIds = new Set(UPGRADES.map((u) => u.id))
const milestoneIds = new Set(MILESTONES.map((u) => u.id))

/**
 * These assertions exist because the content table is hand-authored data, and
 * a typo in an id is invisible at runtime: a gated upgrade simply never shows
 * up, and a spawn-rate modifier referencing a missing upgrade silently stops
 * doing anything. Nothing in the game surfaces either as an error.
 */

describe('content identifiers', () => {
  test('upgrade ids are unique', () => {
    expect(upgradeIds.size).toBe(UPGRADES.length)
  })

  test('milestone ids are unique', () => {
    expect(milestoneIds.size).toBe(MILESTONES.length)
  })

  test('ids are non-empty and safe to use as object keys', () => {
    for (const id of [...upgradeIds, ...milestoneIds]) {
      expect(id).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/)
    }
  })

  test('every upgrade belongs to a real phase', () => {
    for (const def of UPGRADES) {
      expect(PHASES).toContain(def.phase)
    }
  })

  test('every milestone belongs to a real phase', () => {
    for (const def of MILESTONES) {
      expect(PHASES).toContain(def.phase)
    }
  })
})

describe('unlock gating resolves', () => {
  test('every gated upgrade points at a milestone that exists', () => {
    for (const def of UPGRADES) {
      if (def.requiresMilestone === undefined) continue
      expect(milestoneIds).toContain(def.requiresMilestone)
    }
  })

  test('every gated milestone points at a milestone that exists', () => {
    for (const def of MILESTONES) {
      if (def.requires === undefined) continue
      expect(milestoneIds).toContain(def.requires)
    }
  })

  test('nothing is gated behind a milestone from a later phase', () => {
    const milestonePhase = new Map(MILESTONES.map((m) => [m.id, m.phase]))

    for (const def of UPGRADES) {
      if (def.requiresMilestone === undefined) continue
      const required = milestonePhase.get(def.requiresMilestone)!
      expect(required).toBeLessThanOrEqual(def.phase)
    }

    for (const def of MILESTONES) {
      if (def.requires === undefined) continue
      const required = milestonePhase.get(def.requires)!
      expect(required).toBeLessThanOrEqual(def.phase)
    }
  })

  test('the milestone prerequisite graph terminates (no cycles)', () => {
    const prerequisites = new Map(MILESTONES.map((m) => [m.id, m.requires]))

    for (const start of milestoneIds) {
      const seen = new Set<string>()
      let cursor: string | undefined | null = start

      while (cursor && milestoneIds.has(cursor)) {
        expect(seen.has(cursor)).toBe(false)
        seen.add(cursor)
        cursor = prerequisites.get(cursor)
      }
    }
  })

  test('every phase that owns content is playable', () => {
    // Phase 2 owns no upgrades or milestones at all — the promotion milestone
    // in phase 1 jumps straight to phase 3 (useGameEngine.ts, BUY_MILESTONE),
    // so phase 2 is unreachable despite having titles, jargon, canned-response
    // labels and AFK headlines defined for it. Deriving the playable set from
    // the data keeps this assertion honest if that ever changes.
    const playablePhases = PHASES.filter((phase) => MILESTONES.some((m) => m.phase === phase))

    expect(playablePhases.length).toBeGreaterThan(0)
    for (const phase of playablePhases) {
      expect(UPGRADES.some((u) => u.phase === phase)).toBe(true)
      expect(MILESTONES.some((m) => m.phase === phase)).toBe(true)
    }
  })

  // Known gap, not yet specced out. Un-skip this once phase 2 gets its own
  // upgrade and milestone tables and the promotion milestone routes through it.
  test.skip('phase 2 has its own upgrades and milestones', () => {
    expect(UPGRADES.some((u) => u.phase === 2)).toBe(true)
    expect(MILESTONES.some((m) => m.phase === 2)).toBe(true)
  })
})

describe('ticket spawn rate modifiers resolve', () => {
  test('every upgrade modifier points at an upgrade that exists', () => {
    for (const modifier of TICKET_SPAWN_UPGRADE_MODIFIERS) {
      expect(upgradeIds).toContain(modifier.upgradeId)
    }
  })

  test('every milestone modifier points at a milestone that exists', () => {
    for (const id of Object.keys(TICKET_SPAWN_MILESTONE_MS)) {
      expect(milestoneIds).toContain(id)
    }
  })

  test('conditional upgrade modifiers gate on a milestone that exists', () => {
    for (const modifier of TICKET_SPAWN_UPGRADE_MODIFIERS) {
      if (modifier.requiresMilestone === undefined) continue
      expect(milestoneIds).toContain(modifier.requiresMilestone)
    }
  })

  test('no upgrade is listed twice — a duplicate would double-count its shave', () => {
    const listed = TICKET_SPAWN_UPGRADE_MODIFIERS.map((m) => m.upgradeId)
    expect(new Set(listed).size).toBe(listed.length)
  })

  test('every shave is positive, so no entry can slow spawns down', () => {
    for (const modifier of TICKET_SPAWN_UPGRADE_MODIFIERS) {
      expect(modifier.msPerLevel).toBeGreaterThan(0)
    }
    for (const ms of Object.values(TICKET_SPAWN_MILESTONE_MS)) {
      expect(ms).toBeGreaterThan(0)
    }
  })
})

describe('phase-keyed content is populated for every phase', () => {
  const pools: Record<string, Record<Phase, unknown>> = {
    JARGON_CHUNKS,
    SEND_PARTICLES,
    TITLE_MODIFIERS,
    AFK_HEADLINES,
  }

  for (const [name, record] of Object.entries(pools)) {
    test(`${name} has a non-empty entry for all three phases`, () => {
      for (const phase of PHASES) {
        expect(Array.isArray(record[phase])).toBe(true)
        expect((record[phase] as unknown[]).length).toBeGreaterThan(0)
      }
    })
  }

  const singles: Record<string, Record<Phase, string>> = { BASE_TITLE, CURRENCY_LABEL }

  for (const [name, record] of Object.entries(singles)) {
    test(`${name} is set for all three phases`, () => {
      for (const phase of PHASES) {
        expect(record[phase]).toBeTruthy()
      }
    })
  }

  test('canned response buttons exist for every phase', () => {
    for (const phase of PHASES) {
      expect(CANNED_LABELS[phase].length).toBeGreaterThan(0)
    }
  })

  test('canned response percentages are ordered and include a full resolve', () => {
    for (const phase of PHASES) {
      const pcts = CANNED_LABELS[phase].map((c) => c.pct)
      expect(pcts).toEqual([...pcts].sort((a, b) => a - b))
      expect(pcts).toContain(100)
    }
  })
})

describe('AFK unlock ids resolve', () => {
  test('every AFK unlock id is a real upgrade', () => {
    for (const id of AFK_UNLOCK_UPGRADE_IDS) {
      expect(upgradeIds).toContain(id)
    }
  })
})