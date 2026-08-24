import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import type { GameState, Ticket, FloatingParticle, MoneyFloater } from '../game/types';
import {
  UPGRADES,
  MILESTONES,
  JARGON_CHUNKS,
  SEND_PARTICLES,
  TITLE_MODIFIERS,
  BASE_TITLE,
  CURRENCY_LABEL,
  scaledUpgradeCost,
  scaledMilestoneCost,
  TICKET_SPAWN_BASE_INTERVAL_MS,
  TICKET_SPAWN_UPGRADE_MODIFIERS,
  TICKET_SPAWN_MILESTONE_MS,
  computeAdReward,
  randomAdDelayMs,
  pickAdFlavor,
  STARTER_AD_DELAY_MS,
  STARTER_AD_REWARD,
  STARTER_AD_EYEBROW,
  pickStarterAdCopy,
  AFK_UNLOCK_UPGRADE_IDS,
  AFK_BASE_MINUTES_ON_UNLOCK,
  AFK_MINUTES_PER_MILESTONE,
  AFK_MAX_CAP_MINUTES,
  AFK_MIN_TRIGGER_MS,
  AFK_PAYOUT_FACTOR,
  buildAfkSummary,
} from '../game/content';
import { adsEffectivelyUnlocked } from '../game/config';
import { audio, setAdMuted, initMuted } from '../lib/audio';
import { initVisualsMuted } from '../lib/visuals';
import { platform } from '../lib/platform';
import { loadSaveData, saveGame, extractSaveData } from '../lib/storage';

const MAX_QUEUE = 40;
const TITLE_FLASH_MS = 2600;
const CONFETTI_MS = { small: 900, big: 2200 } as const;
const AGENT_UPKEEP_INTERVAL_MS = 3000;

// Any single funds change that's this fraction (or more) of the funds you
// had beforehand triggers the big screen shake — small trickles of income
// shouldn't rattle the screen, but losing/gaining a huge chunk should.
const MONEY_SHAKE_PCT = 0.6;

/** Simple promise-based delay — used to keep the disguised "loading screen"
 * phase transition from flashing instantly when there's no real interstitial
 * ad to show (e.g. local dev on NullPlatform). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeTicket(id: number): Ticket {
  return { id, requiredChars: 90 + Math.floor(Math.random() * 40) };
}

function initialState(): GameState {
  return {
    autoSendPulse: 0,
    moneyFloaters: [],
    moneyFloaterSeq: 0,
    moneyShakeId: 0,
    nextId: 2,
    phase: 1,
    promotions: 0,
    payoutMultiplier: 1,
    funds: 0,
    currencyLabel: CURRENCY_LABEL[1],
    queue: [],
    activeTicket: makeTicket(1),
    manualProgress: 0,
    typedPreview: '',
    jobLevel: 1,
    titleModifiers: [],
    titleFlashMs: 0,
    upgradeLevels: {},
    milestonesUnlocked: {},
    cannedCooldownMs: 0,
    aiBotNodes: 0,
    aiBotAccumMs: 0,
    agentCount: 0,
    agentAccumMs: 0,
    agentUpkeepAccumMs: 0,
    ticketGenAccumMs: 0,
    ticketsClosed: 0,
    closedThisSecond: 0,
    ticketsPerSec: 0,
    secondAccumMs: 0,
    incomeRatePerMin: 0,
    secondFundsSnapshot: 0,
    particles: [],
    floaters: [],
    shake: false,
    confettiBurst: 'none',
    stamp: { id: 0, text: '' },
    arrivalPulse: 0,
    upgradeFlashId: 0,
    upgradeFlashLabel: '',
    maxFundsEver: 0,
    adTimerMs: randomAdDelayMs(),
    adPopup: null,
    adsUnlocked: false,
    starterAdOffered: false,
    afkMinutesCap: 0,
    afkUnlocked: false,
    lastSavedAt: Date.now(),
    afkSummary: null,
  };
}

type Action =
  | { type: 'TICK'; deltaMs: number }
  | { type: 'KEYPRESS' }
  | { type: 'SEND' }
  | { type: 'CANNED'; pct: number }
  | { type: 'BUY_UPGRADE'; id: string }
  | { type: 'BUY_MILESTONE'; id: string }
  | { type: 'CLEAR_PARTICLE'; id: number }
  | { type: 'CLEAR_FLOATER'; id: number }
  | { type: 'CLEAR_CONFETTI' }
  | { type: 'HYDRATE'; data: Partial<GameState> }
  | { type: 'CLEAR_MONEY_FLOATER'; id: number }
  | { type: 'CLAIM_AD_REWARD' }
  | { type: 'SHOW_STARTER_AD' }
  | { type: 'CLAIM_AFK_BONUS' }
  | { type: 'CLEAR_AFK_SUMMARY' }
  | { type: 'CHEAT_ADD_FUNDS'; amount: number };

function upLevel(state: GameState, id: string): number {
  return state.upgradeLevels[id] ?? 0;
}

function charsPerKey(state: GameState): number {
  const lvl = upLevel(state, 'keyboardLube') + upLevel(state, 'redTapeReflexes');
  return [2, 4, 7, 13][Math.min(lvl, 3)];
}

function ticketGenIntervalMs(state: GameState): number {
  let reduction = 0;

  for (const mod of TICKET_SPAWN_UPGRADE_MODIFIERS) {
    if (mod.requiresMilestone && !state.milestonesUnlocked[mod.requiresMilestone]) continue;
    reduction += upLevel(state, mod.upgradeId) * mod.msPerLevel;
  }

  for (const milestoneId in TICKET_SPAWN_MILESTONE_MS) {
    if (state.milestonesUnlocked[milestoneId]) {
      reduction += TICKET_SPAWN_MILESTONE_MS[milestoneId];
    }
  }

  return Math.max(1, TICKET_SPAWN_BASE_INTERVAL_MS - reduction);
}

function manualPayout(state: GameState): number {
  const coffee = upLevel(state, 'coffeeMachine') + upLevel(state, 'expenseAccount');
  const base = 9 + state.jobLevel * 1.6;
  return Math.round(base * (1 + coffee * 0.18) * state.payoutMultiplier);
}

function aiThresholdMs(state: GameState): number {
  const ctx = upLevel(state, 'contextWindow') + upLevel(state, 'hrBotFirmware');
  return 2600 / (1 + ctx * 0.15);
}

function aiPayout(state: GameState): number {
  const patch = upLevel(state, 'hallucinationPatch') + upLevel(state, 'sensitivityTraining');
  return Math.round((7 + state.jobLevel) * (1 + patch * 0.15) * state.payoutMultiplier);
}

function agentThresholdMs(state: GameState): number {
  const training = upLevel(state, 'agentTraining') + upLevel(state, 'managerCoaching');
  return 1500 / (1 + training * 0.2);
}
function agentPayout(state: GameState): number {
  const raise = upLevel(state, 'agentPayRaise') + upLevel(state, 'managerPayRaise');
  return Math.round((10 + state.jobLevel) * (1 + raise * 0.15) * state.payoutMultiplier);
}


function spawnParticles(state: GameState): FloatingParticle[] {
  const pool = SEND_PARTICLES[state.phase];
  const count = 4 + Math.floor(Math.random() * 4);
  const out: FloatingParticle[] = [];
  let id = state.nextId;
  const colors = ['--accent', '--toner-red', '--synergy-green', '--highlight-yellow'];
  for (let i = 0; i < count; i++) {
    out.push({
      id: id++,
      text: pool[Math.floor(Math.random() * pool.length)],
      left: 10 + Math.random() * 80,
      colorVar: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return out;
}

// A lighter burst for automated (bot/agent) resolves — automation happens far
// more often than a manual SEND, so each one gets 1-2 particles instead of a
// full burst. The point is that the screen should stay lively even once the
// player isn't the one clicking SEND anymore, not go quiet.
const MAX_PARTICLES = 60;

function spawnAutoParticles(state: GameState, colorVar: string): FloatingParticle[] {
  const pool = SEND_PARTICLES[state.phase];
  const count = Math.random() < 0.4 ? 2 : 1;
  const out: FloatingParticle[] = [];
  let id = state.nextId;
  for (let i = 0; i < count; i++) {
    out.push({
      id: id++,
      text: pool[Math.floor(Math.random() * pool.length)],
      left: 10 + Math.random() * 80,
      colorVar,
    });
  }
  return out;
}

function pushJobLevel(state: GameState): Pick<GameState, 'jobLevel' | 'titleModifiers' | 'titleFlashMs'> {
  const newLevel = state.jobLevel + 1;
  const pool = TITLE_MODIFIERS[state.phase];
  const modifiers = [...state.titleModifiers, pool[Math.floor(Math.random() * pool.length)]].slice(-6);
  return { jobLevel: newLevel, titleModifiers: modifiers, titleFlashMs: TITLE_FLASH_MS };
}
/** Shared "close out the active ticket" logic — used by manual SEND and by the auto-canned-response autopilot. */
function resolveTicket(state: GameState): GameState {
  if (!state.activeTicket) return state;
  const nextQueue = [...state.queue];
  const nextActive = nextQueue.length > 0 ? (nextQueue.shift() ?? null) : null;
  const closedTotal = state.ticketsClosed + 1;
  const levelUp = closedTotal % 8 === 0;
  const particles = spawnParticles(state);
  const stampPool = SEND_PARTICLES[state.phase];
  const stampText = stampPool[Math.floor(Math.random() * stampPool.length)];
  return {
    ...state,
    nextId: state.nextId + particles.length,
    queue: nextQueue,
    activeTicket: nextActive,
    manualProgress: 0,
    typedPreview: '',
    funds: state.funds + manualPayout(state),
    ticketsClosed: closedTotal,
    closedThisSecond: state.closedThisSecond + 1,
    particles: [...state.particles, ...particles],
    stamp: { id: state.stamp.id + 1, text: stampText },
    ...(levelUp ? pushJobLevel(state) : {}),
  };
}
function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'KEYPRESS': {
      if (!state.activeTicket) return state;
      const chunkPool = JARGON_CHUNKS[state.phase];
      const chunk = chunkPool[Math.floor(Math.random() * chunkPool.length)];
      const progress = Math.min(state.activeTicket.requiredChars, state.manualProgress + charsPerKey(state));
      return {
        ...state,
        manualProgress: progress,
        typedPreview: (state.typedPreview + chunk).slice(-220),
      };
    }

    case 'CANNED': {
      const cannedUnlocked = state.milestonesUnlocked.cannedResponses || state.milestonesUnlocked.briefingTemplates;
      if (!state.activeTicket || !cannedUnlocked) return state;
      if (state.cannedCooldownMs > 0) return state;
      const add = (state.activeTicket.requiredChars * action.pct) / 100;
      const cooldownLvl = upLevel(state, 'cannedCooldown') + upLevel(state, 'templateFirmware');
      return {
        ...state,
        manualProgress: Math.min(state.activeTicket.requiredChars, state.manualProgress + add),
        cannedCooldownMs: Math.max(800, 3200 - cooldownLvl * 450),
      };
    }
    case 'SEND': {
      if (!state.activeTicket) return state;
      if (state.manualProgress < state.activeTicket.requiredChars) return state;
      return resolveTicket(state);
    }

    case 'BUY_UPGRADE': {
      const def = UPGRADES.find((u) => u.id === action.id);
      if (!def) return state;
      const level = upLevel(state, def.id);
      if (level >= def.maxLevel) return state;
      const cost = scaledUpgradeCost(def, level, state.promotions);
      if (state.funds < cost) return state;
      const extraNode = def.id === 'additionalBotNodes' || def.id === 'additionalHrBotNodes' ? 1 : 0;
      const extraAgent = def.id === 'additionalAgents' || def.id === 'additionalManagers' ? 1 : 0;
      const unlocksAfk = AFK_UNLOCK_UPGRADE_IDS.includes(def.id) && !state.afkUnlocked;
      return {
        ...state,
        funds: state.funds - cost,
        upgradeLevels: { ...state.upgradeLevels, [def.id]: level + 1 },
        aiBotNodes: state.aiBotNodes + extraNode,
        agentCount: state.agentCount + extraAgent,
        confettiBurst: 'small',
        upgradeFlashId: state.upgradeFlashId + 1,
        upgradeFlashLabel: def.name,
        afkUnlocked: state.afkUnlocked || unlocksAfk,
        afkMinutesCap: unlocksAfk
          ? Math.min(AFK_MAX_CAP_MINUTES, state.afkMinutesCap + AFK_BASE_MINUTES_ON_UNLOCK)
          : state.afkMinutesCap,
      };
    }
    case 'BUY_MILESTONE': {
      const def = MILESTONES.find((m) => m.id === action.id);
      if (!def) return state;
      if (state.milestonesUnlocked[def.id]) return state;
      if (def.requires && !state.milestonesUnlocked[def.requires]) return state;
      const cost = scaledMilestoneCost(def, state.promotions);
      if (state.funds < cost) return state;

      const afkGain = state.afkUnlocked ? AFK_MINUTES_PER_MILESTONE * state.phase : 0;
      const base: GameState = {
        ...state,
        funds: state.funds - cost,
        milestonesUnlocked: { ...state.milestonesUnlocked, [def.id]: true },
        confettiBurst: 'big',
        titleFlashMs: TITLE_FLASH_MS,
        afkMinutesCap: Math.min(AFK_MAX_CAP_MINUTES, state.afkMinutesCap + afkGain),
      };

      if (def.id === 'aiBot' || def.id === 'hrBots') return { ...base, aiBotNodes: 3 };
      if (def.id === 'outsourceAgents' || def.id === 'middleManagers') return { ...base, agentCount: 1 };

      if (def.id === 'acceptPromotion' || def.id === 'executiveReset') {
        const nextPhase = def.id === 'acceptPromotion' ? 3 : 1;
        const promotions = state.promotions + 1;
        return {
          ...initialState(),
          nextId: base.nextId + 40,
          phase: nextPhase,
          promotions,
          payoutMultiplier: promotions,
          currencyLabel: CURRENCY_LABEL[nextPhase],
          confettiBurst: 'big',
          titleFlashMs: TITLE_FLASH_MS,
          jobLevel: state.jobLevel,
          titleModifiers: [],
          // Carry these forward across a prestige reset — the ad reward stays
          // meaningful and doesn't get an easy popup right as you reset, and
          // the AFK allowance is real career progress too.
          maxFundsEver: 0,
          adTimerMs: state.adTimerMs,
          adsUnlocked: state.adsUnlocked,
          // The starter offer is a one-time-per-career thing, not per-phase —
          // carry the "already offered" flag through prestige resets so it
          // doesn't pop back up on every promotion loop.
          starterAdOffered: state.starterAdOffered,
          afkMinutesCap: base.afkMinutesCap,
          afkUnlocked: state.afkUnlocked,
        };
      }

      return base;
    }

    case 'CLEAR_PARTICLE':
      return { ...state, particles: state.particles.filter((p) => p.id !== action.id) };

    case 'CLEAR_FLOATER':
      return { ...state, floaters: state.floaters.filter((f) => f.id !== action.id) };

    case 'CLEAR_MONEY_FLOATER':
      return { ...state, moneyFloaters: state.moneyFloaters.filter((f) => f.id !== action.id) };

    case 'HYDRATE': {
      const hydrated = { ...state, ...action.data };
      // Anchor the income-rate tracker to the just-loaded/AFK-simulated funds
      // total so the very first per-second tick after a load doesn't read the
      // entire loaded balance as "income earned in the last second".
      return { ...hydrated, secondFundsSnapshot: hydrated.funds };
    }

    case 'CLEAR_CONFETTI':
      return { ...state, confettiBurst: 'none' };

    case 'CLAIM_AD_REWARD': {
      if (!state.adPopup) return state;
      return {
        ...state,
        funds: state.funds + state.adPopup.rewardAmount,
        adPopup: null,
      };
    }

    case 'SHOW_STARTER_AD': {
      // One-time "Welcome Bonus" offer for a brand-new career. Guarded so it
      // can never fire twice, and it nudges the normal recurring popup timer
      // out a bit so the two don't collide right on top of each other.
      if (state.starterAdOffered) return state;
      return {
        ...state,
        starterAdOffered: true,
        adPopup: {
          id: state.adPopup ? state.adPopup.id + 1 : 1,
          rewardAmount: STARTER_AD_REWARD,
          eyebrow: STARTER_AD_EYEBROW,
          copy: pickStarterAdCopy(),
        },
        adTimerMs: randomAdDelayMs(),
      };
    }

    case 'CLAIM_AFK_BONUS': {
      if (!state.afkSummary || state.afkSummary.bonusClaimed) return state;
      return {
        ...state,
        funds: state.funds + state.afkSummary.fundsGained,
        afkSummary: { ...state.afkSummary, bonusClaimed: true },
      };
    }

    case 'CLEAR_AFK_SUMMARY':
      return { ...state, afkSummary: null };

    // Dev-only testing cheat — see cheatAddFunds below. Deliberately just
    // adds funds and lets the normal money-floater/shake logic in `reducer`
    // pick up the delta, same as any other funds change.
    case 'CHEAT_ADD_FUNDS':
      return { ...state, funds: state.funds + action.amount };

    case 'TICK': {
      const delta = action.deltaMs;
      let next: GameState = {
        ...state,
        cannedCooldownMs: Math.max(0, state.cannedCooldownMs - delta),
        titleFlashMs: Math.max(0, state.titleFlashMs - delta),
        ticketGenAccumMs: state.ticketGenAccumMs + delta,
      };

      // Ticket generation — loops so more than one ticket can arrive in a
      // single tick once the interval (via upgrades) drops below the tick
      // length, instead of capping arrivals at exactly one per 100ms.
      {
        const interval = ticketGenIntervalMs(next);
        let queue = [...next.queue];
        let activeTicket = next.activeTicket;
        let nextId = next.nextId;
        let accum = next.ticketGenAccumMs;
        let arrivals = 0;

        while (accum >= interval && queue.length + (activeTicket ? 1 : 0) < MAX_QUEUE) {
          const ticket = makeTicket(nextId);
          nextId += 1;
          if (activeTicket) queue.push(ticket);
          else activeTicket = ticket;
          accum -= interval;
          arrivals += 1;
        }

        // If the queue is (still) full, don't let unspent arrival time pile up into
        // a backlog. Without this, every tick the queue sits capped keeps adding to
        // `accum` even though nothing can spawn — so the moment automation frees up
        // a single slot, the entire backlog dumps back in and the queue snaps right
        // back to full. That makes the queue feel impossible to get under control
        // no matter how many upgrades you buy, since clearing a ticket instantly
        // gets replaced from the stockpile instead of at the normal pace.
        // Clamping to one interval's worth of credit means a freed slot refills
        // once, at the normal rate, instead of flooding from stored-up debt.
        if (queue.length + (activeTicket ? 1 : 0) >= MAX_QUEUE) {
          accum = Math.min(accum, interval);
        }

        next = arrivals > 0
          ? { ...next, queue, activeTicket, nextId, ticketGenAccumMs: accum, arrivalPulse: next.arrivalPulse + arrivals }
          : { ...next, ticketGenAccumMs: accum };
      }

      // Auto-canned-response upgrade — the instant the cooldown clears (and
      // there's a ticket in progress), automatically fire a full canned
      // response AND send it, exactly as if the player clicked RESOLVE then SEND.
      {
        const autoCannedLvl = upLevel(next, 'autoCannedResponses') + upLevel(next, 'autoTemplates');
        const cannedUnlocked = next.milestonesUnlocked.cannedResponses || next.milestonesUnlocked.briefingTemplates;
        if (autoCannedLvl > 0 && cannedUnlocked && next.cannedCooldownMs <= 0 && next.activeTicket) {
          const cooldownLvl = upLevel(next, 'cannedCooldown') + upLevel(next, 'templateFirmware');
          next = resolveTicket(next);
          next = {
            ...next,
            cannedCooldownMs: Math.max(800, 3200 - cooldownLvl * 450),
            autoSendPulse: next.autoSendPulse + 1,
          };
        }
      }
      // AI bot automation — loops so multiple nodes can each close a ticket
      // within the same tick, rather than capping at one resolve per tick
      // regardless of node count.
      if (next.aiBotNodes > 0 && next.queue.length > 0) {
        const threshold = aiThresholdMs(next);
        const payout = aiPayout(next);
        let accum = next.aiBotAccumMs + delta * next.aiBotNodes;
        let queue = [...next.queue];
        let nextId = next.nextId;
        let floaters = [...next.floaters];
        let particles = [...next.particles];
        let resolved = 0;

        while (accum >= threshold && queue.length > 0) {
          queue.shift();
          accum -= threshold;
          resolved += 1;
          const floaterId = nextId;
          const autoParticles = spawnAutoParticles(next, '--staple-blue');
          floaters.push({ id: floaterId, amount: payout, left: 20 + Math.random() * 60 });
          particles.push(...autoParticles);
          nextId = floaterId + autoParticles.length + 1;
        }

        next = {
          ...next,
          queue,
          aiBotAccumMs: accum,
          funds: next.funds + payout * resolved,
          ticketsClosed: next.ticketsClosed + resolved,
          closedThisSecond: next.closedThisSecond + resolved,
          nextId,
          floaters: floaters.slice(-MAX_PARTICLES),
          particles: particles.slice(-MAX_PARTICLES),
        };
      }

      // Human agents — same fix: multiple agents can each close a ticket in
      // the same tick instead of one resolve per tick no matter how many
      // agents are working.
      if (next.agentCount > 0 && next.queue.length > 0) {
        const threshold = agentThresholdMs(next);
        const payout = agentPayout(next);
        let accum = next.agentAccumMs + delta * next.agentCount;
        let queue = [...next.queue];
        let nextId = next.nextId;
        let floaters = [...next.floaters];
        let particles = [...next.particles];
        let resolved = 0;

        while (accum >= threshold && queue.length > 0) {
          queue.shift();
          accum -= threshold;
          resolved += 1;
          const floaterId = nextId;
          const autoParticles = spawnAutoParticles(next, '--synergy-green');
          floaters.push({ id: floaterId, amount: payout, left: 20 + Math.random() * 60 });
          particles.push(...autoParticles);
          nextId = floaterId + autoParticles.length + 1;
        }

        next = {
          ...next,
          queue,
          agentAccumMs: accum,
          funds: next.funds + payout * resolved,
          ticketsClosed: next.ticketsClosed + resolved,
          closedThisSecond: next.closedThisSecond + resolved,
          nextId,
          floaters: floaters.slice(-MAX_PARTICLES),
          particles: particles.slice(-MAX_PARTICLES),
        };

        const upkeepAccum = next.agentUpkeepAccumMs + delta;
        if (upkeepAccum >= AGENT_UPKEEP_INTERVAL_MS) {
          next = {
            ...next,
            agentUpkeepAccumMs: 0,
            funds: Math.max(0, next.funds - next.agentCount * 4),
          };
        } else {
          next = { ...next, agentUpkeepAccumMs: upkeepAccum };
        }
      }

      // Rate display + shake threshold + income/min tracking, once per second.
      const secondAccum = next.secondAccumMs + delta;
      if (secondAccum >= 1000) {
        const fundsDeltaThisSecond = next.funds - next.secondFundsSnapshot;
        const instantRatePerMin = fundsDeltaThisSecond * 60;
        // Light smoothing (EMA) so the displayed number doesn't jitter wildly
        // every single second — it settles toward the true rate over a few
        // seconds instead of snapping to each second's raw reading.
        const smoothedRatePerMin = next.incomeRatePerMin * 0.7 + instantRatePerMin * 0.3;
        next = {
          ...next,
          secondAccumMs: secondAccum - 1000,
          ticketsPerSec: next.closedThisSecond,
          closedThisSecond: 0,
          shake: next.queue.length / MAX_QUEUE > 0.8,
          incomeRatePerMin: smoothedRatePerMin,
          secondFundsSnapshot: next.funds,
        };
      } else {
        next = { ...next, secondAccumMs: secondAccum };
      }

      // Rewarded-ad ("Insider Trading Opportunity") popup — fires on a random
      // 1-5 minute cadence. It never auto-dismisses; if this timer fires again
      // while a popup is still up, the new one (fresh id + freshly-rolled
      // reward + freshly-rolled joke) just overwrites it.
      {
        const adTimerMs = next.adTimerMs - delta;
        if (adTimerMs <= 0) {
          next = {
            ...next,
            adPopup: {
              id: next.adPopup ? next.adPopup.id + 1 : 1,
              rewardAmount: computeAdReward(next.maxFundsEver),
              ...pickAdFlavor(adsEffectivelyUnlocked(next.adsUnlocked)),
            },
            adTimerMs: randomAdDelayMs(),
          };
        } else {
          next = { ...next, adTimerMs };
        }
      }

      return next;
    }

    default:
      return state;
  }
}

/**
 * Fast-forwards a GameState by `totalMs` of game time using the same TICK
 * logic as real-time play, but as a tight synchronous loop with no
 * dispatch/render in between — this is what powers AFK catch-up on boot.
 * Runs in 2s simulated steps (instead of the normal 100ms) purely for speed;
 * every TICK accumulator is linear, so larger steps don't change the result.
 */
function simulateAfk(state: GameState, totalMs: number): GameState {
  let sim = state;
  const STEP_MS = 2000;
  let remaining = totalMs;
  while (remaining > 0) {
    const step = Math.min(STEP_MS, remaining);
    sim = applyAction(sim, { type: 'TICK', deltaMs: step });
    remaining -= step;
  }
  return sim;
}

/**
 * Wraps applyAction so any net funds change (from any action) produces a
 * floating +$X / -$X delta near the Corporate Capital figure, and triggers
 * the big screen-shake (via moneyShakeId) when the change is >=60% of the
 * funds you had going in. HYDRATE is excluded so restoring a save doesn't
 * read as one giant "gain". This is also where `maxFundsEver` gets updated,
 * since it needs to track the peak across every possible source of funds —
 * manual sends, automation, ad rewards, everything.
 */
function reducer(state: GameState, action: Action): GameState {
  const prevFunds = state.funds;
  let next = applyAction(state, action);

  if (next.funds > next.maxFundsEver) {
    next = { ...next, maxFundsEver: next.funds };
  }

  if (action.type === 'HYDRATE' || action.type === 'CLEAR_MONEY_FLOATER') return next;

  const delta = next.funds - prevFunds;
  if (delta === 0) return next;

  const pctSwing = prevFunds > 0 ? Math.abs(delta) / prevFunds : 0;
  const floaterId = next.moneyFloaterSeq + 1;
  const floater: MoneyFloater = { id: floaterId, amount: delta };

  return {
    ...next,
    moneyFloaterSeq: floaterId,
    moneyFloaters: [...next.moneyFloaters, floater].slice(-8),
    moneyShakeId: pctSwing >= MONEY_SHAKE_PCT ? next.moneyShakeId + 1 : next.moneyShakeId,
  };
}

export function useGameEngine() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const confettiTimer = useRef<number | null>(null);
  const starterAdTimerRef = useRef<number | null>(null);
  const prevArrivalPulse = useRef(state.arrivalPulse);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Start-menu gating ────────────────────────────────────────────────
  // The game boots straight into the reducer's initial state as always
  // (cheap, synchronous, no flash-of-wrong-content), but the tick loop is
  // held off via `startedRef` until the player actually presses the
  // start/continue button on the menu — that way tickets don't pile up
  // and funds don't move while they're just staring at the title screen.
  // `saveChecked`/`hasSave` let the menu know whether to offer "start a
  // new career" or "continue" wording, and whether it's safe to render
  // stats yet (state is only trustworthy once HYDRATE has landed).
  const [saveChecked, setSaveChecked] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const startedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  // ── Pause gate for rewarded ads ─────────────────────────────────────
  // While a rewarded ad (Insider Trading popup, the starter Welcome Bonus
  // popup, or the AFK "double your earnings" ad) is actually playing, we
  // don't want tickets arriving, automation resolving, cooldowns ticking
  // down, etc. behind it — the player would come back to a pile of state
  // changes they never saw happen. `pausedRef` gates the TICK dispatch
  // itself (see the interval effect below); `setAdMuted` separately
  // silences our own SFX for the same window without touching the
  // player's persisted mute preference.
  const pausedRef = useRef(false);

  // ── Disguised interstitial ("loading screen") on phase transitions ────
  // While true, App renders a full-screen "processing your promotion"
  // loading card. The platform's real interstitial ad plays underneath/on
  // top of it during that window, so it reads to the player as a load
  // transition rather than an ad break.
  const [phaseTransitioning, setPhaseTransitioning] = useState(false);

  const start = useCallback(() => {
    startedRef.current = true;
    setHasStarted(true);

    // One-time "Welcome Bonus" rewarded-ad offer — only for a genuinely new
    // career (never when continuing a save), and only once per career
    // (guarded again inside the reducer via `starterAdOffered`). Delayed a
    // few seconds so it doesn't compete with the very first render.
    if (!hasSave) {
      starterAdTimerRef.current = window.setTimeout(() => {
        if (!stateRef.current.starterAdOffered) {
          dispatch({ type: 'SHOW_STARTER_AD' });
        }
      }, STARTER_AD_DELAY_MS);
    }
  }, [hasSave]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (startedRef.current && !pausedRef.current) dispatch({ type: 'TICK', deltaMs: 100 });
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  // Clean up the starter-ad timeout if the component unmounts before it fires.
  useEffect(() => {
    return () => {
      if (starterAdTimerRef.current) window.clearTimeout(starterAdTimerRef.current);
    };
  }, []);

  // Bring the platform bridge up, restore any saved career progress, and —
  // if AFK play is unlocked and enough real-world time has passed since the
  // last save — silently fast-forward the game and surface a "while you
  // were gone" summary popup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await platform.init();
      } catch (e) {
        console.error('[Game] platform init failed, continuing without it', e);
      }
      // Hydrate persisted mute preferences (audio + visual effects) now that
      // the platform storage bridge is up.
      initMuted().catch(() => { });
      initVisualsMuted().catch(() => { });
      platform.gameReady();
      const save = await loadSaveData();
      if (cancelled) return;

      if (!save) {
        setSaveChecked(true);
        return;
      }

      setHasSave(true);
      dispatch({ type: 'HYDRATE', data: save });

      const afkUnlocked = save.afkUnlocked ?? false;
      const afkCap = save.afkMinutesCap ?? 0;
      const lastSavedAt = save.lastSavedAt ?? Date.now();
      const elapsedMs = Date.now() - lastSavedAt;

      if (afkUnlocked && afkCap > 0 && elapsedMs >= AFK_MIN_TRIGGER_MS) {
        const minutesAway = elapsedMs / 60_000;
        const minutesToSim = Math.min(minutesAway, afkCap);
        const baseState: GameState = { ...initialState(), ...(save as unknown as Partial<GameState>) };
        const simmed = simulateAfk(baseState, minutesToSim * 60_000);

        const ticketsGained = Math.max(0, simmed.ticketsClosed - baseState.ticketsClosed);
        const rawFundsGained = simmed.funds - baseState.funds;
        // Only credit a fraction of what the simulation actually produced —
        // the rest is recoverable via the "watch an ad to double" button on
        // the summary popup below.
        const fundsGained = Math.round(rawFundsGained * AFK_PAYOUT_FACTOR);
        const adjustedFunds = baseState.funds + fundsGained;
        const { headline, subline } = buildAfkSummary(simmed.phase, minutesToSim, ticketsGained, fundsGained);

        dispatch({
          type: 'HYDRATE',
          data: {
            ...simmed,
            funds: adjustedFunds,
            // Reset anything purely cosmetic/per-frame so nothing stale replays on screen.
            particles: [],
            floaters: [],
            moneyFloaters: [],
            confettiBurst: 'none',
            adPopup: null,
            shake: false,
            titleFlashMs: 0,
            arrivalPulse: baseState.arrivalPulse,
            autoSendPulse: baseState.autoSendPulse,
            upgradeFlashId: baseState.upgradeFlashId,
            moneyShakeId: baseState.moneyShakeId,
            stamp: baseState.stamp,
            afkSummary: {
              id: Date.now(),
              minutes: Math.round(minutesToSim),
              ticketsClosed: ticketsGained,
              fundsGained,
              headline,
              subline,
              bonusClaimed: false,
            },
          },
        });
      }

      setSaveChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Autosave on an interval, and make sure the last bit of progress lands
  // when the tab is hidden/closed rather than only on a fixed timer.
  useEffect(() => {
    const interval = window.setInterval(() => {
      saveGame(extractSaveData(stateRef.current));
    }, 5000);

    function saveNow() {
      saveGame(extractSaveData(stateRef.current));
    }
    function handleVisibility() {
      if (document.visibilityState === 'hidden') saveNow();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', saveNow);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', saveNow);
    };
  }, []);

  useEffect(() => {
    if (state.confettiBurst !== 'none') {
      if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
      confettiTimer.current = window.setTimeout(() => {
        dispatch({ type: 'CLEAR_CONFETTI' });
      }, CONFETTI_MS[state.confettiBurst]);
    }
  }, [state.confettiBurst]);

  // A quiet notification blip whenever a fresh ticket lands in the queue.

  useEffect(() => {
    if (state.arrivalPulse !== prevArrivalPulse.current) {
      prevArrivalPulse.current = state.arrivalPulse;
      audio.tick(0.2);
    }
  }, [state.arrivalPulse]);
  const prevAutoSendPulse = useRef(state.autoSendPulse);
  useEffect(() => {
    if (state.autoSendPulse !== prevAutoSendPulse.current) {
      prevAutoSendPulse.current = state.autoSendPulse;
      audio.correct();
    }
  }, [state.autoSendPulse]);
  const keypress = useCallback(() => {
    audio.click();
    dispatch({ type: 'KEYPRESS' });
  }, []);

  const send = useCallback(() => {
    audio.correct();
    dispatch({ type: 'SEND' });
  }, []);

  const useCanned = useCallback((pct: number) => {
    audio.select();
    dispatch({ type: 'CANNED', pct });
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    audio.clutch();
    dispatch({ type: 'BUY_UPGRADE', id });
  }, []);
  const buyMilestone = useCallback((id: string) => {
    const isPhaseTransition = id === 'acceptPromotion' || id === 'executiveReset';

    setAdMuted(true);
    pausedRef.current = true;
    const interstitialDone = platform.showInterstitial(id).finally(() => {
      setAdMuted(false);
      pausedRef.current = false;
    });

    if (isPhaseTransition) {
      setPhaseTransitioning(true);
      Promise.allSettled([delay(1500), interstitialDone]).finally(() => {
        audio.win();
        dispatch({ type: 'BUY_MILESTONE', id });
        setPhaseTransitioning(false);
      });
      return;
    }

    interstitialDone.finally(() => {
      audio.win();
    });
    dispatch({ type: 'BUY_MILESTONE', id });
  }, []);


  const clearParticle = useCallback((id: number) => dispatch({ type: 'CLEAR_PARTICLE', id }), []);
  const clearFloater = useCallback((id: number) => dispatch({ type: 'CLEAR_FLOATER', id }), []);
  const clearMoneyFloater = useCallback((id: number) => dispatch({ type: 'CLEAR_MONEY_FLOATER', id }), []);
  const clearAfkSummary = useCallback(() => dispatch({ type: 'CLEAR_AFK_SUMMARY' }), []);

  const watchAd = useCallback(async () => {
    const popup = stateRef.current.adPopup;
    if (!popup) return;

    if (adsEffectivelyUnlocked(stateRef.current.adsUnlocked)) {
      audio.win();
      dispatch({ type: 'CLAIM_AD_REWARD' });
      return;
    }

    pausedRef.current = true;
    setAdMuted(true);
    let rewarded = false;
    try {
      rewarded = await platform.showRewarded('insider_trading_tip');
    } catch (e) {
      console.error('[Game] showRewarded failed', e);
    } finally {
      setAdMuted(false);
      pausedRef.current = false;
    }
    if (rewarded) {
      audio.win();
      dispatch({ type: 'CLAIM_AD_REWARD' });
    }
  }, []);
  // Exposed so callers (e.g. the onboarding tutorial) can pause the tick
  // loop for reasons other than ad playback. Uses the same pausedRef gate
  // as watchAd/claimAfkBonus, so it's safe if both happen to overlap —
  // just make sure whichever call turns it on is also responsible for
  // turning it back off.
  const setEnginePaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);
  // claimAfkBonus
  const claimAfkBonus = useCallback(async () => {
    const summary = stateRef.current.afkSummary;
    if (!summary || summary.bonusClaimed || summary.fundsGained <= 0) return;

    if (adsEffectivelyUnlocked(stateRef.current.adsUnlocked)) {
      audio.win();
      dispatch({ type: 'CLAIM_AFK_BONUS' });
      return;
    }

    pausedRef.current = true;
    setAdMuted(true);
    let rewarded = false;
    try {
      rewarded = await platform.showRewarded('afk_double_bonus');
    } catch (e) {
      console.error('[Game] showRewarded (AFK bonus) failed', e);
    } finally {
      setAdMuted(false);
      pausedRef.current = false;
    }
    if (rewarded) {
      audio.win();
      dispatch({ type: 'CLAIM_AFK_BONUS' });
    }
  }, []);
  const cheatAddFunds = useCallback((amount = 100_000) => {
    dispatch({ type: 'CHEAT_ADD_FUNDS', amount });
  }, []);

  const currentTitle = `${state.titleModifiers.join(' ')} ${BASE_TITLE[state.phase]}`.trim();

  return {
    state,
    currentTitle,
    keypress,
    send,
    useCanned,
    buyUpgrade,
    buyMilestone,
    clearParticle,
    clearFloater,
    clearMoneyFloater,
    watchAd,
    clearAfkSummary,
    claimAfkBonus,
    phaseTransitioning,
    saveChecked,
    hasSave,
    hasStarted,
    start,
    cheatAddFunds,
    setEnginePaused
  };
}
