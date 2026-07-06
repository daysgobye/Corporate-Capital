export type Phase = 1 | 2 | 3;

export interface Ticket {
  id: number;
  requiredChars: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  phase: Phase;
  requiresMilestone?: string;
}

export interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  phase: Phase;
  requires?: string;
  buttonLabel: string;
}

export interface FloatingParticle {
  id: number;
  text: string;
  left: number;
  colorVar: string;
}

export interface IncomeFloater {
  id: number;
  amount: number;
  left: number;
}

/** 'none' = nothing playing, 'small' = upgrade sparkle, 'big' = milestone blowout */
export type ConfettiBurst = 'none' | 'small' | 'big';

/** The big rubber-stamp slam that lands on SEND. id 0 = never fired yet. */
export interface StampMark {
  id: number;
  text: string;
}

export interface GameState {
  nextId: number;
  phase: Phase;
  promotions: number;
  payoutMultiplier: number;

  funds: number;
  currencyLabel: string;

  queue: Ticket[];
  activeTicket: Ticket | null;
  manualProgress: number;
  typedPreview: string;

  jobLevel: number;
  titleModifiers: string[];
  titleFlashMs: number;

  upgradeLevels: Record<string, number>;
  milestonesUnlocked: Record<string, boolean>;

  cannedCooldownMs: number;
  aiBotNodes: number;
  aiBotAccumMs: number;
  agentCount: number;
  agentAccumMs: number;
  agentUpkeepAccumMs: number;

  ticketGenAccumMs: number;
  ticketsClosed: number;
  closedThisSecond: number;
  ticketsPerSec: number;
  secondAccumMs: number;

  particles: FloatingParticle[];
  floaters: IncomeFloater[];
  shake: boolean;
  confettiBurst: ConfettiBurst;

  /** Big slammed word ("SYNERGY!" etc.) shown when a reply is sent. */
  stamp: StampMark;
  /** Increments every time a new ticket arrives — used to pop a one-shot "ping" badge. */
  arrivalPulse: number;
  /** Increments every time an upgrade is bought — used to pop a one-shot toast. */
  upgradeFlashId: number;
  upgradeFlashLabel: string;
}
