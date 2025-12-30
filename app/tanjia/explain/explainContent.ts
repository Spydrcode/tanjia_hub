export const explainContent = {
  "scheduler.cards": {
    why: "Keeps scheduling in one calm place without bouncing between tools.",
    replaces: "External scheduling links and back-and-forth emails.",
    clientVersion: "Cards can be themed per team with client-specific durations.",
  },
  "scheduler.embed": {
    why: "Booking stays inside the workspace to avoid redirects.",
    replaces: "Opening new tabs and losing context mid-call.",
    clientVersion: "Embed can sit in any client hub with their branding.",
  },
  "followups.autoCreate": {
    why: "Ensures commitments are tracked without relying on memory.",
    replaces: "Sticky notes, ad-hoc reminders, and inbox searching.",
    clientVersion: "Follow-ups can align to each client's cadence and tone.",
  },
  "lead.detail": {
    why: "Gives one quiet view of context, actions, and status.",
    replaces: "Spreadsheet rows and fragmented notes across apps.",
    clientVersion: "Fields and layout can mirror client-specific workflows.",
  },
  "lead.enrich": {
    why: "Pulls light public signals before adding a lead.",
    replaces: "Opening tabs to copy snippets manually before saving.",
    clientVersion: "Can point at client-approved sources and stay scoped.",
  },
  "agent.outputs": {
    why: "Drafts and prompts to reduce friction without removing judgment.",
    replaces: "Blank-screen pauses and scattered templates.",
    clientVersion: "Guardrails adjust to client voice; can run on private models.",
  },
  "schedule.button": {
    why: "Single entry to scheduling with the right context pre-attached.",
    replaces: "Hunting for links and retyping names/emails.",
    clientVersion: "Can route to client-branded schedulers or team calendars.",
  },
  "metrics.operatingRhythm": {
    why: "Shows the cadence of activity without exposing any identities.",
    replaces: "Screens full of raw data that can't be shared live.",
    clientVersion: "Can surface the few signals a client cares about.",
  },
  "bookings.webhook": {
    why: "Keeps bookings in sync and triggers follow-ups automatically.",
    replaces: "Manual logging after every reschedule or cancellation.",
    clientVersion: "Can plug into any client calendar stack behind the scenes.",
  },
} as const;
