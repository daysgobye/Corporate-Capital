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
    maxLevel: 4,
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
    id: 'marketingLeadGen',
    name: 'Marketing Lead Generation',
    description: 'Increases the incoming ticket rate.',
    baseCost: 4000,
    costGrowth: 1.9,
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
    costGrowth: 2.0,
    maxLevel: 5,
    phase: 1,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'redTapeReflexes',
    name: 'Red Tape Reflexes',
    description: 'Each keypress logs more of the memo.',
    baseCost: 25,
    costGrowth: 1.6,
    maxLevel: 3,
    phase: 3,
  },
  {
    id: 'calendarSync',
    name: 'Calendar Sync',
    description: 'Reduces the wait between incoming grievances.',
    baseCost: 25,
    costGrowth: 1.45,
    maxLevel: 10,
    phase: 3,
  },
  {
    id: 'expenseAccount',
    name: 'Discretionary Expense Account',
    description: 'Boosts payout per manual grievance.',
    baseCost: 60,
    costGrowth: 1.8,
    maxLevel: 5,
    phase: 3,
  },
  {
    id: 'autoTemplates',
    name: 'Grievance Template Autopilot',
    description: 'Automatically fires a full canned response the instant the cooldown clears.',
    baseCost: 3000,
    costGrowth: 1.5,
    maxLevel: 1,
    phase: 3,
    requiresMilestone: 'briefingTemplates',
  },
  {
    id: 'templateFirmware',
    name: 'Template Library Firmware',
    description: 'Shortens the cooldown on canned responses.',
    baseCost: 200,
    costGrowth: 1.9,
    maxLevel: 5,
    phase: 3,
    requiresMilestone: 'briefingTemplates',
  },
  {
    id: 'managerPayRaise',
    name: 'Manager Stipend Increase',
    description: 'Increases payout per resolved grievance for Middle Managers.',
    baseCost: 1800,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'additionalManagers',
    name: 'Hire Another Middle Manager',
    description: 'Adds another Middle Manager working the queue.',
    baseCost: 6000,
    costGrowth: 2.0,
    maxLevel: 3,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'managerCoaching',
    name: 'Middle Manager Coaching',
    description: 'Managers resolve grievances faster.',
    baseCost: 1500,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'middleManagers',
  },
  {
    id: 'hrBotFirmware',
    name: 'HR Bot Firmware Update',
    description: 'HR Bots resolve grievances faster.',
    baseCost: 2500,
    costGrowth: 1.7,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'sensitivityTraining',
    name: 'Mandatory Sensitivity Training',
    description: 'Fewer escalations — more payout per resolved grievance.',
    baseCost: 3200,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'townHallInvites',
    name: 'Town Hall Invitations',
    description: 'Increases the incoming grievance rate.',
    baseCost: 4000,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'hrOutreachBlitz',
    name: 'Grievance Outreach Blitz',
    description: 'HR starts proactively soliciting complaints. Massively increases the incoming grievance rate.',
    baseCost: 6000,
    costGrowth: 2.1,
    maxLevel: 4,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
  {
    id: 'additionalHrBotNodes',
    name: 'Deploy Additional HR Bot',
    description: 'Adds another HR Bot node working the queue.',
    baseCost: 10000,
    costGrowth: 2.0,
    maxLevel: 5,
    phase: 3,
    requiresMilestone: 'hrBots',
  },
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
    cost: 1000000,
    phase: 1,
    requires: 'aiBot',
    buttonLabel: 'ACCEPT PROMOTION',
  },
  {
    id: 'briefingTemplates',
    name: 'Standardized Grievance Templates',
    description: 'Unlocks one-click macro buttons to close out complaints.',
    cost: 1000,
    phase: 3,
    buttonLabel: 'UNLOCK TEMPLATES',
  },
  {
    id: 'middleManagers',
    name: 'Hire Middle Managers',
    description: 'Managers absorb complaints so you do not have to.',
    cost: 4000,
    phase: 3,
    requires: 'briefingTemplates',
    buttonLabel: 'HIRE MANAGERS',
  },
  {
    id: 'hrBots',
    name: 'Automated HR Bots',
    description: 'Replaces your middle managers with bots that auto-deny leave requests and log grievances.',
    cost: 80000,
    phase: 3,
    requires: 'middleManagers',
    buttonLabel: 'DEPLOY HR BOTS',
  },
  {
    id: 'executiveReset',
    name: 'Fire The Middle Managers',
    description: 'Consolidate power. Restart as a more efficient tyrant.',
    cost: 1000000,
    phase: 3,
    requires: 'hrBots',
    buttonLabel: 'RESTRUCTURE THE COMPANY',
  },
];

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
