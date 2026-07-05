import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, Ticket, FloatingParticle } from '../game/types';
import {
  UPGRADES,
  MILESTONES,
  JARGON_CHUNKS,
  SEND_PARTICLES,
  TITLE_MODIFIERS,
  BASE_TITLE,
  CURRENCY_LABEL,
  upgradeCost,
} from '../game/content';
import { playKeyClick, playSendDing, playCashRegister, playMilestoneFanfare } from '../game/audio';

const MAX_QUEUE = 40;
const TITLE_FLASH_MS = 2600;
const CONFETTI_MS = 2200;
const AGENT_UPKEEP_INTERVAL_MS = 3000;

function makeTicket(id: number): Ticket {
  return { id, requiredChars: 90 + Math.floor(Math.random() * 40) };
}

function initialState(): GameState {
  return {
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
    confetti: false,
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
  | { type: 'CLEAR_CONFETTI' };

function upLevel(state: GameState, id: string): number {
  return state.upgradeLevels[id] ?? 0;
}

function charsPerKey(state: GameState): number {
  const lvl = upLevel(state, 'keyboardLube');
  return [2, 4, 7, 13][Math.min(lvl, 3)];
}

function ticketGenIntervalMs(state: GameState): number {
  const mouse = upLevel(state, 'ergoMouse');
  const marketing = state.milestonesUnlocked.aiBot ? upLevel(state, 'marketingLeadGen') : 0;
  const ms = 4200 - mouse * 380 - marketing * 260;
  return Math.max(600, ms);
}

function manualPayout(state: GameState): number {
  const coffee = upLevel(state, 'coffeeMachine');
  const base = 9 + state.jobLevel * 1.6;
  return Math.round(base * (1 + coffee * 0.18) * state.payoutMultiplier);
}

function aiThresholdMs(state: GameState): number {
  const ctx = upLevel(state, 'contextWindow');
  return 2600 / (1 + ctx * 0.15);
}

function aiPayout(state: GameState): number {
  const patch = upLevel(state, 'hallucinationPatch');
  return Math.round((7 + state.jobLevel) * (1 + patch * 0.15) * state.payoutMultiplier);
}

function agentThresholdMs(state: GameState): number {
  const training = upLevel(state, 'agentTraining');
  return 1500 / (1 + training * 0.2);
}

function agentPayout(state: GameState): number {
  return Math.round((10 + state.jobLevel) * state.payoutMultiplier);
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

function pushJobLevel(state: GameState): Pick<GameState, 'jobLevel' | 'titleModifiers' | 'titleFlashMs'> {
  const newLevel = state.jobLevel + 1;
  const pool = TITLE_MODIFIERS[state.phase];
  const modifiers = [...state.titleModifiers, pool[Math.floor(Math.random() * pool.length)]].slice(-6);
  return { jobLevel: newLevel, titleModifiers: modifiers, titleFlashMs: TITLE_FLASH_MS };
}

function reducer(state: GameState, action: Action): GameState {
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
      if (!state.activeTicket || !state.milestonesUnlocked.cannedResponses) return state;
      if (state.cannedCooldownMs > 0) return state;
      const add = (state.activeTicket.requiredChars * action.pct) / 100;
      const cooldownLvl = upLevel(state, 'cannedCooldown');
      return {
        ...state,
        manualProgress: Math.min(state.activeTicket.requiredChars, state.manualProgress + add),
        cannedCooldownMs: Math.max(800, 3200 - cooldownLvl * 450),
      };
    }

    case 'SEND': {
      if (!state.activeTicket) return state;
      if (state.manualProgress < state.activeTicket.requiredChars) return state;
      const nextQueue = [...state.queue];
      const nextActive = nextQueue.length > 0 ? (nextQueue.shift() ?? null) : null;
      const closedTotal = state.ticketsClosed + 1;
      const levelUp = closedTotal % 8 === 0;
      const particles = spawnParticles(state);
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
        ...(levelUp ? pushJobLevel(state) : {}),
      };
    }

    case 'BUY_UPGRADE': {
      const def = UPGRADES.find((u) => u.id === action.id);
      if (!def) return state;
      const level = upLevel(state, def.id);
      if (level >= def.maxLevel) return state;
      const cost = upgradeCost(def, level);
      if (state.funds < cost) return state;
      return {
        ...state,
        funds: state.funds - cost,
        upgradeLevels: { ...state.upgradeLevels, [def.id]: level + 1 },
      };
    }

    case 'BUY_MILESTONE': {
      const def = MILESTONES.find((m) => m.id === action.id);
      if (!def) return state;
      if (state.milestonesUnlocked[def.id]) return state;
      if (def.requires && !state.milestonesUnlocked[def.requires]) return state;
      if (state.funds < def.cost) return state;

      const base: GameState = {
        ...state,
        funds: state.funds - def.cost,
        milestonesUnlocked: { ...state.milestonesUnlocked, [def.id]: true },
        confetti: true,
        titleFlashMs: TITLE_FLASH_MS,
      };

      if (def.id === 'aiBot') return { ...base, aiBotNodes: 3 };
      if (def.id === 'outsourceAgents') return { ...base, agentCount: 2 };

      if (def.id === 'acceptPromotion' || def.id === 'executiveReset') {
        const nextPhase = def.id === 'acceptPromotion' ? 3 : 1;
        const promotions = state.promotions + 1;
        return {
          ...initialState(),
          nextId: base.nextId + 40,
          phase: nextPhase,
          promotions,
          payoutMultiplier: 1 + promotions * 0.35,
          currencyLabel: CURRENCY_LABEL[nextPhase],
          confetti: true,
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

    case 'CLEAR_CONFETTI':
      return { ...state, confetti: false };

    case 'TICK': {
      const delta = action.deltaMs;
      let next: GameState = {
        ...state,
        cannedCooldownMs: Math.max(0, state.cannedCooldownMs - delta),
        titleFlashMs: Math.max(0, state.titleFlashMs - delta),
        ticketGenAccumMs: state.ticketGenAccumMs + delta,
      };

      // Ticket generation
      if (next.ticketGenAccumMs >= ticketGenIntervalMs(next) && next.queue.length + (next.activeTicket ? 1 : 0) < MAX_QUEUE) {
        const id = next.nextId;
        const ticket = makeTicket(id);
        next = next.activeTicket
          ? { ...next, queue: [...next.queue, ticket], nextId: id + 1, ticketGenAccumMs: 0 }
          : { ...next, activeTicket: ticket, nextId: id + 1, ticketGenAccumMs: 0 };
      }

      // AI bot automation
      if (next.aiBotNodes > 0 && next.queue.length > 0) {
        const accum = next.aiBotAccumMs + delta * next.aiBotNodes;
        const threshold = aiThresholdMs(next);
        if (accum >= threshold) {
          const q = [...next.queue];
          q.shift();
          const floaterId = next.nextId;
          next = {
            ...next,
            queue: q,
            aiBotAccumMs: accum - threshold,
            funds: next.funds + aiPayout(next),
            ticketsClosed: next.ticketsClosed + 1,
            closedThisSecond: next.closedThisSecond + 1,
            nextId: floaterId + 1,
            floaters: [...next.floaters, { id: floaterId, amount: aiPayout(next), left: 20 + Math.random() * 60 }],
          };
        } else {
          next = { ...next, aiBotAccumMs: accum };
        }
      }

      // Human agents
      if (next.agentCount > 0 && next.queue.length > 0) {
        const accum = next.agentAccumMs + delta * next.agentCount;
        const threshold = agentThresholdMs(next);
        if (accum >= threshold) {
          const q = [...next.queue];
          q.shift();
          const floaterId = next.nextId;
          next = {
            ...next,
            queue: q,
            agentAccumMs: accum - threshold,
            funds: next.funds + agentPayout(next),
            ticketsClosed: next.ticketsClosed + 1,
            closedThisSecond: next.closedThisSecond + 1,
            nextId: floaterId + 1,
            floaters: [...next.floaters, { id: floaterId, amount: agentPayout(next), left: 20 + Math.random() * 60 }],
          };
        } else {
          next = { ...next, agentAccumMs: accum };
        }

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

export function useGameEngine() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const confettiTimer = useRef<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => dispatch({ type: 'TICK', deltaMs: 100 }), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.confetti) {
      if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
      confettiTimer.current = window.setTimeout(() => {
        dispatch({ type: 'CLEAR_CONFETTI' });
      }, CONFETTI_MS);
    }
  }, [state.confetti]);

  const keypress = useCallback(() => {
    playKeyClick();
    dispatch({ type: 'KEYPRESS' });
  }, []);

  const send = useCallback(() => {
    playSendDing();
    dispatch({ type: 'SEND' });
  }, []);

  const useCanned = useCallback((pct: number) => {
    playCashRegister();
    dispatch({ type: 'CANNED', pct });
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    playCashRegister();
    dispatch({ type: 'BUY_UPGRADE', id });
  }, []);

  const buyMilestone = useCallback((id: string) => {
    playMilestoneFanfare();
    dispatch({ type: 'BUY_MILESTONE', id });
  }, []);

  const clearParticle = useCallback((id: number) => dispatch({ type: 'CLEAR_PARTICLE', id }), []);
  const clearFloater = useCallback((id: number) => dispatch({ type: 'CLEAR_FLOATER', id }), []);

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
  };
}
