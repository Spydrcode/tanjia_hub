/**
 * 2ndmynd OS — Zones of Thinking
 * 
 * The system follows a single operating model:
 * LISTEN → CLARIFY → MAP → DECIDE → SUPPORT
 * 
 * Each zone answers ONE question and groups related tools.
 */

export type ZoneId = 'listen' | 'clarify' | 'map' | 'decide' | 'support';

export type Zone = {
  id: ZoneId;
  label: string;
  shortLabel: string;
  question: string;
  description: string;
  useWhen: string;
  route: string;
  clientSafeEligible: boolean;
  tools: ZoneTool[];
  badge: 'listen' | 'clarify' | 'map' | 'decide' | 'support';
};

export type ZoneTool = {
  id: string;
  name: string;
  description: string;
  route?: string;
};

export const zones: Zone[] = [
  {
    id: 'listen',
    label: 'LISTEN',
    shortLabel: 'Listen',
    question: 'What did they say, and what\'s the next open thread?',
    description: 'Stay present. Read one line. Ask one question.',
    useWhen: 'You are in a live meeting or conversation.',
    route: '/tanjia/listen',
    clientSafeEligible: false,
    badge: 'listen',
    tools: [
      { id: 'context-card', name: 'Context Card', description: 'Last thing they mentioned' },
      { id: 'open-thread', name: 'Open Thread', description: 'What you\'re waiting on' },
      { id: 'suggested-question', name: 'Suggested Question', description: 'One calm question to ask' },
      { id: 'second-look-share', name: 'Second Look', description: 'Share if helpful' },
    ],
  },
  {
    id: 'clarify',
    label: 'CLARIFY',
    shortLabel: 'Clarify',
    question: 'What matters most right now?',
    description: 'Help them see they\'re not alone and there\'s a path forward.',
    useWhen: 'You need to understand their real priority before offering anything.',
    route: '/tanjia/clarify',
    clientSafeEligible: false,
    badge: 'clarify',
    tools: [
      { id: 'clarifying-question', name: 'Clarifying Question', description: 'One question to surface priority' },
      { id: 'belief-triad', name: 'The Triad', description: 'Not alone, improvement identified, we help' },
      { id: 'next-question', name: 'Next Best Question', description: 'If they\'re ready to go deeper' },
      { id: 'second-look-offer', name: 'Second Look Offer', description: 'Permission-based next step' },
    ],
  },
  {
    id: 'map',
    label: 'MAP',
    shortLabel: 'Map',
    question: 'Where is pressure coming from in the business?',
    description: 'Scan their world quietly. Surface signals without speculation.',
    useWhen: 'You want to understand their business before offering insight.',
    route: '/tanjia/map',
    clientSafeEligible: false,
    badge: 'map',
    tools: [
      { id: 'website-scan', name: 'Website Scan', description: 'Fetch and extract public signals' },
      { id: 'signal-summary', name: 'Signal Summary', description: 'What changed with growth' },
      { id: 'friction-points', name: 'Friction Points', description: 'Where they might be stuck' },
      { id: 'second-look-generate', name: 'Generate Second Look', description: 'Create shareable summary' },
    ],
  },
  {
    id: 'decide',
    label: 'DECIDE',
    shortLabel: 'Decide',
    question: 'What\'s the smallest calm next move?',
    description: 'Pick one action. Not everything—just the next thing.',
    useWhen: 'You need to plan a follow-up or choose a next step.',
    route: '/tanjia/decide',
    clientSafeEligible: false,
    badge: 'decide',
    tools: [
      { id: 'followup-queue', name: 'Follow-up Queue', description: 'What\'s due today and next' },
      { id: 'one-calm-move', name: 'One Calm Move', description: 'Suggested action for next 24 hours' },
      { id: 'add-followup', name: 'Add Follow-up', description: 'Schedule a gentle check-in' },
      { id: 'propose-plan', name: 'Propose Plan', description: 'Let the agent suggest a sequence' },
    ],
  },
  {
    id: 'support',
    label: 'SUPPORT',
    shortLabel: 'Support',
    question: 'How do I communicate this without pressure?',
    description: 'Draft replies that are calm, clear, and human.',
    useWhen: 'You need to write a message, comment, or email.',
    route: '/tanjia/support',
    clientSafeEligible: false,
    badge: 'support',
    tools: [
      { id: 'draft-reply', name: 'Draft Reply', description: 'Generate a calm response' },
      { id: 'copy-blocks', name: 'Copy Blocks', description: 'Ready-to-use message fragments' },
      { id: 'intro-script', name: 'Intro Script', description: 'What to say when they ask what you do' },
      { id: 'second-look-share', name: 'Second Look', description: 'Share the offer' },
    ],
  },
];

export const zoneMap = zones.reduce((acc, zone) => {
  acc[zone.id] = zone;
  return acc;
}, {} as Record<ZoneId, Zone>);

export const zoneOrder: ZoneId[] = ['listen', 'clarify', 'map', 'decide', 'support'];

export const loopLine = 'Listen → Clarify → Map → Decide → Support';

export function getZoneByRoute(route: string): Zone | undefined {
  return zones.find(z => route.startsWith(z.route));
}

export function getNextZone(currentId: ZoneId): Zone | undefined {
  const idx = zoneOrder.indexOf(currentId);
  return idx >= 0 && idx < zoneOrder.length - 1 ? zoneMap[zoneOrder[idx + 1]] : undefined;
}

export function getPrevZone(currentId: ZoneId): Zone | undefined {
  const idx = zoneOrder.indexOf(currentId);
  return idx > 0 ? zoneMap[zoneOrder[idx - 1]] : undefined;
}

// Badge color variants for zones
export const zoneBadgeVariants: Record<ZoneId, string> = {
  listen: 'bg-blue-100 text-blue-800',
  clarify: 'bg-violet-100 text-violet-800',
  map: 'bg-amber-100 text-amber-800',
  decide: 'bg-emerald-100 text-emerald-800',
  support: 'bg-rose-100 text-rose-800',
};
