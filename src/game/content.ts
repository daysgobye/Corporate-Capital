import type { UpgradeDef, MilestoneDef, Phase } from './types';

export const JARGON_CHUNKS: Record<Phase, string[]> = {
  1: [
    'Per my last email, ',
    'circling back on this — ',
    'per our conversation, ',
    'just floating this back up, ',
    'happy to hop on a quick sync, ',
    'per the SLA, ',
    'per policy, ',
    'as previously stated, ',
    'looping in my manager, ',
    'per the FAQ, ',
    'per the terms of service, ',
    "not sure that's actionable, but ",
  ],
  2: [
    'per SynergyBot 3.0, ',
    'confidence score 94%, ',
    'per the training data, ',
    'per the knowledge base, ',
    'generating response... ',
    'per the escalation matrix, ',
    'per the model card, ',
    'per the outsourced SOP, ',
  ],
  3: [
    'per the mission statement, ',
    'per the employee handbook, ',
    'per HR policy 4.2, ',
    'we value your feedback, ',
    'per the org chart, ',
    'per the PIP framework, ',
    'circling back on your grievance, ',
    'per the town hall recap, ',
  ],
};

export const SEND_PARTICLES: Record<Phase, string[]> = {
  1: ['SYNERGY!', 'KPI!', 'ROI!', 'OPTIMIZE!', 'ALIGNED!', 'CIRCLE BACK!'],
  2: ['AUTOMATE!', 'SCALE!', 'DEPLOYED!', 'HALLUCINATE!', 'NODE++'],
  3: ['MORALE!', 'COMPLIANCE!', 'HEADCOUNT!', 'SYNERGY!', 'PIP!'],
};

export const TITLE_MODIFIERS: Record<Phase, string[]> = {
  1: ['Junior', 'Deputy', 'Interim', 'Assistant', 'Associate', 'Tier-1'],
  2: ['Senior', 'Lead', 'Strategic', 'Global', 'Automation', 'Principal'],
  3: ['Executive', 'Vice', 'Chief', 'Distinguished', 'Regional', 'Fellow'],
};

export const BASE_TITLE: Record<Phase, string> = {
  1: 'Ticket Wrangler',
  2: 'Support Operations Coordinator',
  3: 'HR Associate',
};

export const CURRENCY_LABEL: Record<Phase, string> = {
  1: 'Corporate Capital',
  2: 'Corporate Capital',
  3: 'Morale Violations Resolved',
};

export const CANNED_LABELS: Record<Phase, { pct: number; label: string }[]> = {
  1: [
    { pct: 30, label: 'APOLOGIZE' },
    { pct: 50, label: 'ESCALATE' },
    { pct: 100, label: 'RESOLVE' },
  ],
  2: [
    { pct: 30, label: 'APOLOGIZE' },
    { pct: 50, label: 'ESCALATE' },
    { pct: 100, label: 'RESOLVE' },
  ],
  3: [
    { pct: 30, label: 'REMIND OF MISSION STATEMENT' },
    { pct: 50, label: 'SCHEDULE A SYNC' },
    { pct: 100, label: 'DENY LEAVE' },
  ],
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'keyboardLube',
    name: 'Mechanical Keyboard Switch Lubing',
    description: 'Each keypress types more of the reply.',
    baseCost: 25,
    costGrowth: 1.6,
    maxLevel: 6,
    phase: 1,
  },
  {
    id: 'ergoMouse',
    name: 'Ergonomic Mouse',
    description: 'Reduces the wait between incoming tickets.',
    baseCost: 25,
    costGrowth: 1.45,
    maxLevel: 10,
    phase: 1,
  },
  {
    id: 'coffeeMachine',
    name: 'Aggressive Coffee Machine',
    description: 'Keeps you wired — boosts payout per manual ticket.',
    baseCost: 60,
    costGrowth: 1.8,
    maxLevel: Infinity,
    phase: 1,
  },
  {
    id: 'autoCannedResponses',
    name: 'Canned Response Autopilot',
    description: 'Automatically completes and sends a canned response the instant the cooldown clears.',
    baseCost: 1500,
    costGrowth: 1.5,
    maxLevel: 1,
    phase: 1,
    requiresMilestone: 'cannedResponses',
  },
  {
    id: 'cannedCooldown',
    name: 'Macro Shortcut Firmware',
    description: 'Shortens the cooldown on canned responses.',
    baseCost: 200,
    costGrowth: 1.9,
    maxLevel: 5,
    phase: 1,
    requiresMilestone: 'cannedResponses',
  },
  {
    id: 'agentPayRaise',
    name: 'Overseas Pay Raise',
    description: 'Increases payout per resolved ticket for Overseas Team agents.',
    baseCost: 1800,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 1,
    requiresMilestone: 'outsourceAgents',
  },
  {
    id: 'additionalAgents',
    name: 'Hire Another Overseas Agent',
    description: 'Adds another Overseas Team agent working the queue.',
    baseCost: 6000,
    costGrowth: 2.0,
    maxLevel: 3,
    phase: 1,
    requiresMilestone: 'outsourceAgents',
  },
  {
    id: 'marketingLeadGen',
    name: 'Marketing Lead Generation',
    description: 'Increases the incoming ticket rate.',
    baseCost: 4000,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 1,
    requiresMilestone: 'outsourceAgents',
  },
  {
    id: 'agentTraining',
    name: 'Overseas Agent Training',
    description: 'Agents resolve tickets faster.',
    baseCost: 1500,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 1,
    requiresMilestone: 'outsourceAgents',
  },
  {
    id: 'contextWindow',
    name: 'Context Window Expansion',
    description: 'SynergyBot resolves tickets faster.',
    baseCost: 2500,
    costGrowth: 1.7,
    maxLevel: 6,
    phase: 1,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'hallucinationPatch',
    name: 'Hallucination Patch',
    description: 'Fewer refunds — more payout per AI ticket.',
    baseCost: 3200,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 1,
    requiresMilestone: 'aiBot',
  },

  {
    id: 'aiOutreachBlitz',
    name: 'AI-Powered Outreach Blitz',
    description: 'The bots start cold-emailing prospects too. Massively increases the incoming ticket rate.',
    baseCost: 6000,
    costGrowth: 2.1,
    maxLevel: 4,
    phase: 1,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'additionalBotNodes',
    name: 'Deploy Additional Node',
    description: 'Adds another SynergyBot node working the queue.',
    baseCost: 10000,
    costGrowth: 1.6,
    maxLevel: 20,
    phase: 1,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'redTapeReflexes',
    name: 'Red Tape Reflexes',
    description: 'Each keypress logs more of the memo.',
    baseCost: 150,
    costGrowth: 1.65,
    maxLevel: 6,
    phase: 3,
  },
  {
    id: 'calendarSync',
    name: 'Calendar Sync',
    description: 'Reduces the wait between incoming grievances.',
    baseCost: 150,
    costGrowth: 1.5,
    maxLevel: 10,
    phase: 3,
  },
  {
    id: 'expenseAccount',
    name: 'Discretionary Expense Account',
    description: 'Boosts payout per manual grievance.',
    baseCost: 540,
    costGrowth: 1.85,
    maxLevel: Infinity,
    phase: 3,
  },
  {
    id: 'autoTemplates',
    name: 'Grievance Template Autopilot',
    description: 'Automatically fires a full canned response the instant the cooldown clears.',
    baseCost: 24000,
    costGrowth: 1.5,
    maxLevel: 1,
    phase: 3,
    requiresMilestone: 'briefingTemplates',
  },
  {
    id: 'templateFirmware',
    name: 'Template Library Firmware',
    description: 'Shortens the cooldown on canned responses.',
    baseCost: 1500,
    costGrowth: 2.0,
    maxLevel: 5,
    phase: 3,
    requiresMilestone: 'briefingTemplates',
  },
  {
    id: 'managerPayRaise',
    name: 'Manager Stipend Increase',
    description: 'Increases payout per resolved grievance for Middle Managers.',
    baseCost: 14400,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'additionalManagers',
    name: 'Hire Another Middle Manager',
    description: 'Adds another Middle Manager working the queue.',
    baseCost: 48000,
    costGrowth: 2.1,
    maxLevel: 3,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'managerCoaching',
    name: 'Middle Manager Coaching',
    description: 'Managers resolve grievances faster.',
    baseCost: 12000,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'hrBotFirmware',
    name: 'HR Bot Firmware Update',
    description: 'HR Bots resolve grievances faster.',
    baseCost: 21000,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'sensitivityTraining',
    name: 'Mandatory Sensitivity Training',
    description: 'Fewer escalations — more payout per resolved grievance.',
    baseCost: 27000,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'townHallInvites',
    name: 'Town Hall Invitations',
    description: 'Increases the incoming grievance rate.',
    baseCost: 33000,
    costGrowth: 2.0,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'hrOutreachBlitz',
    name: 'Grievance Outreach Blitz',
    description: 'HR starts proactively soliciting complaints. Massively increases the incoming grievance rate.',
    baseCost: 51000,
    costGrowth: 2.2,
    maxLevel: 4,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'additionalHrBotNodes',
    name: 'Deploy Additional HR Bot',
    description: 'Adds another HR Bot node working the queue.',
    baseCost: 84000,
    costGrowth: 2.1,
    maxLevel: 20,
    phase: 3,
    requiresMilestone: 'hrBots',
  }
];

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'cannedResponses',
    name: 'Canned Responses',
    description: 'Unlocks one-click macro buttons to skip typing.',
    cost: 1000,
    phase: 1,
    buttonLabel: 'UNLOCK CANNED RESPONSES',
  },
  {
    id: 'outsourceAgents',
    name: 'Outsource To Overseas Agents',
    description: 'Human agents close tickets faster, for a small upkeep.',
    cost: 4000,
    phase: 1,
    requires: 'cannedResponses',
    buttonLabel: 'HIRE AGENTS',
  },
  {
    id: 'aiBot',
    name: 'SynergyBot v1.0',
    description: 'Replaces your overseas agents with an AI chatbot that claims and closes tickets on its own.',
    cost: 100000,
    phase: 1,
    requires: 'outsourceAgents',
    buttonLabel: 'DEPLOY SYNERGYBOT',
  },
  {
    id: 'acceptPromotion',
    name: 'Accept Promotion',
    description: 'Give up your support upgrades. Become Junior HR Associate.',
    cost: 2500000,
    phase: 1,
    requires: 'aiBot',
    buttonLabel: 'ACCEPT PROMOTION',
  },
  {
    id: 'briefingTemplates',
    name: 'Standardized Grievance Templates',
    description: 'Unlocks one-click macro buttons to close out complaints.',
    cost: 1200,
    phase: 3,
    buttonLabel: 'UNLOCK TEMPLATES',
  },
  {
    id: 'middleManagers',
    name: 'Hire Middle Managers',
    description: 'Managers absorb complaints so you do not have to.',
    cost: 5000,
    phase: 3,
    requires: 'briefingTemplates',
    buttonLabel: 'HIRE MANAGERS',
  },
  {
    id: 'hrBots',
    name: 'Automated HR Bots',
    description: 'Replaces your middle managers with bots that auto-deny leave requests and log grievances.',
    cost: 150000,
    phase: 3,
    requires: 'middleManagers',
    buttonLabel: 'DEPLOY HR BOTS',
  },
  {
    id: 'executiveReset',
    name: 'Fire The Middle Managers',
    description: 'Consolidate power. Restart as a more efficient tyrant.',
    cost: 2000000,
    phase: 3,
    requires: 'hrBots',
    buttonLabel: 'RESTRUCTURE THE COMPANY',
  },
];

/**
 * === Ticket spawn-rate tuning ===
 * Controls how fast tickets arrive (ticketGenIntervalMs in useGameEngine.ts).
 * Each upgrade/milestone that speeds up arrivals gets its own knob here
 * instead of being lumped into a shared "mouse"/"marketing" bucket — bump a
 * number up to make that specific upgrade/milestone speed up arrivals more,
 * drop it toward 0 to make it barely matter, or remove an entry entirely to
 * make that upgrade/milestone not affect spawn rate at all.
 *
 * All values are milliseconds shaved OFF the base interval (bigger number =
 * faster tickets). The formula floors at 1ms no matter how much is shaved off.
 */
export const TICKET_SPAWN_BASE_INTERVAL_MS = 4200;

export interface SpawnRateUpgradeModifier {
  /** Must match an UpgradeDef id above. */
  upgradeId: string;
  /** ms shaved off the arrival interval per level of this upgrade. */
  msPerLevel: number;
  /** Optional — this modifier only applies once the given milestone is unlocked. */
  requiresMilestone?: string;
}

export const TICKET_SPAWN_UPGRADE_MODIFIERS: SpawnRateUpgradeModifier[] = [
  { upgradeId: 'ergoMouse', msPerLevel: 300 },
  { upgradeId: 'calendarSync', msPerLevel: 300 },
  { upgradeId: 'marketingLeadGen', msPerLevel: 80 },
  { upgradeId: 'aiOutreachBlitz', msPerLevel: 20, requiresMilestone: 'aiBot' },
  { upgradeId: 'townHallInvites', msPerLevel: 320, requiresMilestone: 'hrBots' },
  { upgradeId: 'hrOutreachBlitz', msPerLevel: 320, requiresMilestone: 'hrBots' },
];

/** ms shaved off the arrival interval for each milestone unlocked, keyed by milestone id. */
export const TICKET_SPAWN_MILESTONE_MS: Record<string, number> = {
  cannedResponses: 250,
  outsourceAgents: 278,
  aiBot: 50,
  acceptPromotion: 250,
  briefingTemplates: 250,
  middleManagers: 250,
  hrBots: 250,
  executiveReset: 250,
};

export function upgradeCost(def: UpgradeDef, level: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

/**
 * Every prestige (promotion) multiplies all costs by this factor. Nothing
 * ever drops back to the loop-1 starting prices — each lap starts pricier
 * than the last lap ended, climbing into the hundred-thousands within a
 * few laps and billions/trillions many laps in. Tune this single number to
 * make the escalation faster/slower.
 */
export const PRESTIGE_COST_SCALE = 6;

export function costMultiplier(promotions: number): number {
  return Math.pow(PRESTIGE_COST_SCALE, promotions);
}

export function scaledUpgradeCost(def: UpgradeDef, level: number, promotions: number): number {
  return Math.round(upgradeCost(def, level) * costMultiplier(promotions));
}

export function scaledMilestoneCost(def: MilestoneDef, promotions: number): number {
  return Math.round(def.cost * costMultiplier(promotions));
}

/**
 * === Rewarded-ad ("Insider Trading Opportunity") tuning ===
 */

/** Popup re-checks/refreshes on a random cadence somewhere in this range. */
export const AD_POPUP_MIN_DELAY_MS = 60_000; // 1 minute
export const AD_POPUP_MAX_DELAY_MS = 5 * 60_000; // 5 minutes

/** Floor so the very first popup (before you've made any real money) still feels worth tapping. */
export const AD_REWARD_FLOOR = 50;

/** The payout always "feels like good value": it's your best-ever funds total, wobbled +/-20%. */
export function computeAdReward(maxFundsEver: number): number {
  const base = Math.max(maxFundsEver, AD_REWARD_FLOOR);
  const variance = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x
  return Math.max(1, Math.round(base * variance));
}

export function randomAdDelayMs(): number {
  return AD_POPUP_MIN_DELAY_MS + Math.random() * (AD_POPUP_MAX_DELAY_MS - AD_POPUP_MIN_DELAY_MS);
}
