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
    maxLevel: 3,
    phase: 1,
  },
  {
    id: 'ergoMouse',
    name: 'Ergonomic Mouse',
    description: 'Reduces the wait between incoming tickets.',
    baseCost: 40,
    costGrowth: 1.7,
    maxLevel: 5,
    phase: 1,
  },
  {
    id: 'coffeeMachine',
    name: 'Aggressive Coffee Machine',
    description: 'Keeps you wired — boosts payout per manual ticket.',
    baseCost: 60,
    costGrowth: 1.8,
    maxLevel: 5,
    phase: 1,
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
    id: 'contextWindow',
    name: 'Context Window Expansion',
    description: 'SynergyBot resolves tickets faster.',
    baseCost: 500,
    costGrowth: 1.7,
    maxLevel: 6,
    phase: 2,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'hallucinationPatch',
    name: 'Hallucination Patch',
    description: 'Fewer refunds — more payout per AI ticket.',
    baseCost: 650,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 2,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'marketingLeadGen',
    name: 'Marketing Lead Generation',
    description: 'Increases the incoming ticket rate.',
    baseCost: 800,
    costGrowth: 1.9,
    maxLevel: 6,
    phase: 2,
    requiresMilestone: 'aiBot',
  },
  {
    id: 'agentTraining',
    name: 'Overseas Agent Training',
    description: 'Agents resolve tickets faster.',
    baseCost: 1500,
    costGrowth: 1.8,
    maxLevel: 6,
    phase: 2,
    requiresMilestone: 'outsourceAgents',
  },
];

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'cannedResponses',
    name: 'Canned Responses',
    description: 'Unlocks one-click macro buttons to skip typing.',
    cost: 150,
    phase: 1,
    buttonLabel: 'UNLOCK CANNED RESPONSES',
  },
  {
    id: 'aiBot',
    name: 'SynergyBot v1.0',
    description: 'An AI chatbot that claims and closes tickets on its own.',
    cost: 1200,
    phase: 1,
    requires: 'cannedResponses',
    buttonLabel: 'DEPLOY SYNERGYBOT',
  },
  {
    id: 'outsourceAgents',
    name: 'Outsource To Overseas Agents',
    description: 'Human agents close tickets faster, for a small upkeep.',
    cost: 3500,
    phase: 2,
    requires: 'aiBot',
    buttonLabel: 'HIRE AGENTS',
  },
  {
    id: 'acceptPromotion',
    name: 'Accept Promotion',
    description: 'Give up your support upgrades. Become Junior HR Associate.',
    cost: 9000,
    phase: 2,
    requires: 'outsourceAgents',
    buttonLabel: 'ACCEPT PROMOTION',
  },
  {
    id: 'hrBots',
    name: 'Automated HR Bots',
    description: 'Bots auto-deny leave requests and log grievances.',
    cost: 1200,
    phase: 3,
    buttonLabel: 'DEPLOY HR BOTS',
  },
  {
    id: 'middleManagers',
    name: 'Hire Middle Managers',
    description: 'Managers absorb complaints so you do not have to.',
    cost: 4000,
    phase: 3,
    requires: 'hrBots',
    buttonLabel: 'HIRE MANAGERS',
  },
  {
    id: 'executiveReset',
    name: 'Fire The Middle Managers',
    description: 'Consolidate power. Restart as a more efficient tyrant.',
    cost: 12000,
    phase: 3,
    requires: 'middleManagers',
    buttonLabel: 'RESTRUCTURE THE COMPANY',
  },
];

export function upgradeCost(def: UpgradeDef, level: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}
