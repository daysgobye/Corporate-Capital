export type Phase = 1 | 2 | 3;
export interface AfkSummaryState {
  id: number;
  minutes: number;
  ticketsClosed: number;
  fundsGained: number;
  headline: string;
  subline: string;
}
export interface Ticket {
  id: number;
  requiredChars: number;
}
export interface MoneyFloater {
  id: number;
  amount: number; // positive = gain, negative = loss
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

/**
 * The "Insider Trading Opportunity" rewarded-ad popup. It does not auto-dismiss —
 * it only goes away when the player watches the ad (or, once `adsUnlocked` is on,
 * taps to instantly collect). If the timer fires again while one is still showing,
 * the new popup (fresh id + freshly-rolled reward + freshly-rolled flavor text)
 * simply overwrites it.
 */
export interface AdPopupState {
  id: number;
  rewardAmount: number;
  /** Rotating "eyebrow" tag, e.g. "Insider Tip" / "Hot Tip" / "Off The Record". */
  eyebrow: string;
  /** The joke one-liner body copy for this particular popup. */
  copy: string;
}
export interface AfkSummaryState {
  id: number;
  minutes: number;
  ticketsClosed: number;
  fundsGained: number;
  headline: string;
  subline: string;
  /** Whether the player watched an ad to double the (already-nerfed) fundsGained. */
  bonusClaimed: boolean;
}
export interface GameState {
  /** Total AFK-play minutes unlocked so far via automation + milestones. */
  afkMinutesCap: number;
  /** True once the first automation upgrade in a phase has been bought. */
  afkUnlocked: boolean;
  /** Real-world epoch ms of the last save — used to compute AFK catch-up on boot. */
  lastSavedAt: number;
  /** Set right after a boot-time AFK catch-up runs, to trigger the summary popup. */
  afkSummary: AfkSummaryState | null;
  /** Increments each time the auto-canned-response upgrade fires a full auto-send — used to play a sound cue. */
  autoSendPulse: number;
  moneyFloaters: MoneyFloater[];
  moneyFloaterSeq: number;
  /** Increments any time a funds change is >=60% of prior funds — used to retrigger the shake CSS animation. */
  moneyShakeId: number

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

  /** Highest `funds` value ever reached this prestige run — the basis for the rewarded-ad payout. */
  maxFundsEver: number;
  /** Countdown to the next "Insider Trading Opportunity" popup. */
  adTimerMs: number;
  /** The currently-showing rewarded-ad popup, if any. Null = nothing showing. */
  adPopup: AdPopupState | null;
  /**
   * Dev/config toggle: when true, the popup still appears on its normal
   * schedule but tapping it instantly grants the reward instead of playing
   * a rewarded ad first.
   */
  adsUnlocked: boolean;
}
