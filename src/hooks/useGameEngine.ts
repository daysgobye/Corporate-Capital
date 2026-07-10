import { useReducer, useEffect, useCallback, useRef } from 'react';
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
  PRESTIGE_COST_SCALE,
  TICKET_SPAWN_BASE_INTERVAL_MS,
  TICKET_SPAWN_UPGRADE_MODIFIERS,
  TICKET_SPAWN_MILESTONE_MS,
} from '../game/content';
import { audio } from '../lib/audio';
import { platform } from '../lib/platform';
import { loadSaveData, saveGame, extractSaveData, type SaveData } from '../lib/storage';

const MAX_QUEUE = 40;
const TITLE_FLASH_MS = 2600;
const CONFETTI_MS = { small: 900, big: 2200 } as const;
const AGENT_UPKEEP_INTERVAL_MS = 3000;

// Any single funds change that's this fraction (or more) of the funds you
// had beforehand triggers the big screen shake — small trickles of income
// shouldn't rattle the screen, but losing/gaining a huge chunk should.
const MONEY_SHAKE_PCT = 0.6;

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
    particles: [],
    floaters: [],
    shake: false,
    confettiBurst: 'none',
    stamp: { id: 0, text: '' },
    arrivalPulse: 0,
    upgradeFlashId: 0,
    upgradeFlashLabel: '',
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
  | { type: 'HYDRATE'; data: SaveData }
  | { type: 'CLEAR_MONEY_FLOATER'; id: number };

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
      return {
        ...state,
        funds: state.funds - cost,
        upgradeLevels: { ...state.upgradeLevels, [def.id]: level + 1 },
        aiBotNodes: state.aiBotNodes + extraNode,
        agentCount: state.agentCount + extraAgent,
        confettiBurst: 'small',
        upgradeFlashId: state.upgradeFlashId + 1,
        upgradeFlashLabel: def.name,
      };
    }
    case 'BUY_MILESTONE': {
      const def = MILESTONES.find((m) => m.id === action.id);
      if (!def) return state;
      if (state.milestonesUnlocked[def.id]) return state;
      if (def.requires && !state.milestonesUnlocked[def.requires]) return state;
      const cost = scaledMilestoneCost(def, state.promotions);
      if (state.funds < cost) return state;

      const base: GameState = {
        ...state,
        funds: state.funds - cost,
        milestonesUnlocked: { ...state.milestonesUnlocked, [def.id]: true },
        confettiBurst: 'big',
        titleFlashMs: TITLE_FLASH_MS,
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
          payoutMultiplier: Math.pow(PRESTIGE_COST_SCALE, promotions),
          currencyLabel: CURRENCY_LABEL[nextPhase],
          confettiBurst: 'big',
          titleFlashMs: TITLE_FLASH_MS,
          jobLevel: state.jobLevel,
          titleModifiers: [],
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

    case 'HYDRATE':
      return { ...state, ...action.data };

    case 'CLEAR_CONFETTI':
      return { ...state, confettiBurst: 'none' };
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

      // Rate display + shake threshold, once per second
      const secondAccum = next.secondAccumMs + delta;
      if (secondAccum >= 1000) {
        next = {
          ...next,
          secondAccumMs: secondAccum - 1000,
          ticketsPerSec: next.closedThisSecond,
          closedThisSecond: 0,
          shake: next.queue.length / MAX_QUEUE > 0.8,
        };
      } else {
        next = { ...next, secondAccumMs: secondAccum };
      }

      return next;
    }

    default:
      return state;
  }
}

/**
 * Wraps applyAction so any net funds change (from any action) produces a
 * floating +$X / -$X delta near the Corporate Capital figure, and triggers
 * the big screen-shake (via moneyShakeId) when the change is >=60% of the
 * funds you had going in. HYDRATE is excluded so restoring a save doesn't
 * read as one giant "gain".
 */
function reducer(state: GameState, action: Action): GameState {
  const prevFunds = state.funds;
  const next = applyAction(state, action);

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
  const prevArrivalPulse = useRef(state.arrivalPulse);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const interval = window.setInterval(() => dispatch({ type: 'TICK', deltaMs: 100 }), 100);
    return () => window.clearInterval(interval);
  }, []);

  // Bring the platform bridge up, then restore any saved career progress.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await platform.init();
      } catch (e) {
        console.error('[Game] platform init failed, continuing without it', e);
      }
      platform.gameReady();
      const save = await loadSaveData();
      if (!cancelled && save) dispatch({ type: 'HYDRATE', data: save });
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
    audio.win();
    dispatch({ type: 'BUY_MILESTONE', id });
  }, []);

  const clearParticle = useCallback((id: number) => dispatch({ type: 'CLEAR_PARTICLE', id }), []);
  const clearFloater = useCallback((id: number) => dispatch({ type: 'CLEAR_FLOATER', id }), []);
  const clearMoneyFloater = useCallback((id: number) => dispatch({ type: 'CLEAR_MONEY_FLOATER', id }), []);

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
  };
}
