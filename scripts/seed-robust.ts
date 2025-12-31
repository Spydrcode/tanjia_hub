#!/usr/bin/env tsx
import "./_bootstrap";
import { randomUUID } from "crypto";
import { createSupabaseScriptClient } from "@/lib/supabase/script";
import { runEmythTask, savePrimaryAim } from "@/lib/agents/emyth";

type LeadSeed = {
  name: string;
  location: string;
  website: string;
  notes: string;
  source: string;
  stage: "prospecting" | "meeting" | "client" | "onsite";
  status: "active" | "nurturing" | "stalled";
  owner_load: "low" | "medium" | "high";
  followup_risk: "low" | "med" | "high";
  industry: string;
  signals: string[];
};

const seedKey = "seed_key:robust_v1";

const primaryAim = {
  statement:
    "Build a calm, owner-led business that grows without the owner becoming the bottleneck, using simple systems that protect relationships and follow-through.",
  non_negotiables: [
    "Respect time and attention during meetings",
    "Keep follow-up consistent and human",
    "Use systems that reduce owner load, not add tools",
  ],
  avoidances: ["Overly salesy outreach", "New tools that require training", "Anything that makes the owner feel judged"],
};

const leads: LeadSeed[] = [
  {
    name: "Canyon Ridge Pressure Washing",
    location: "Gilbert, AZ",
    website: "https://canyonridge-pressure.example.com",
    notes:
      "22yo founder, values excellence, wants 2026 growth. Seasonal demand swings; pricing/quotes done on phone; equipment maintenance eats mornings; wants consistent weekly schedule + repeat commercial accounts; currently tracks jobs in notes app; wants a simple way to see what to do next.",
    source: "facebook",
    stage: "prospecting",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "exterior_cleaning",
    signals: ["seasonal", "pricing-on-phone", "maintenance-time"],
  },
  {
    name: "Desert Gate Handyman",
    location: "Mesa, AZ",
    website: "https://desertgate-handyman.example.com",
    notes:
      "Solo owner, evenings spent scheduling/estimates; misses callbacks; repeat clients but no system; wants weekly route, checklists, and follow-up reminders; uses text threads + paper; feels like work expands to fill nights.",
    source: "referral",
    stage: "meeting",
    status: "active",
    owner_load: "high",
    followup_risk: "high",
    industry: "handyman",
    signals: ["scheduling-nights", "missed-callbacks", "paper-process"],
  },
  {
    name: "Sunstone Pool Care",
    location: "Queen Creek, AZ",
    website: "https://sunstone-pool.example.com",
    notes:
      "2 techs, owner answers most texts; route inefficiency; supply-store runs; inconsistent chemical inventory; wants better handoffs + fewer urgent interruptions; billing + schedule in separate places; wants calm weekly route planning.",
    source: "networking_event",
    stage: "prospecting",
    status: "active",
    owner_load: "high",
    followup_risk: "med",
    industry: "pool_service",
    signals: ["route-inefficiency", "owner-answering-texts", "inventory-issues"],
  },
  {
    name: "Copper Trail Landscaping",
    location: "Apache Junction, AZ",
    website: "https://coppertrail-landscaping.example.com",
    notes:
      "Seasonal spikes, reactive mode; crew capacity guessing; quotes slow; wants templated quote flow + capacity view; wants fewer last-minute reschedules; uses Google Calendar + group texts; feels like decisions stack.",
    source: "facebook",
    stage: "prospecting",
    status: "nurturing",
    owner_load: "high",
    followup_risk: "med",
    industry: "landscaping",
    signals: ["seasonal-spikes", "quote-delay", "capacity-guessing"],
  },
  {
    name: "Ironwood HVAC & Maintenance",
    location: "Chandler, AZ",
    website: "https://ironwood-hvac.example.com",
    notes:
      "Team of 5; cashflow uneven; completed jobs sometimes lag invoicing; approvals delay billing; parts availability creates return trips; wants visibility quote→schedule→completion→invoice; wants fewer disputes from missing notes.",
    source: "cold_outreach_reply",
    stage: "meeting",
    status: "active",
    owner_load: "high",
    followup_risk: "high",
    industry: "hvac",
    signals: ["cashflow-lag", "return-trips", "invoicing-delay"],
  },
  {
    name: "Saguaro Mobile Detail",
    location: "Tempe, AZ",
    website: "https://saguaro-detail.example.com",
    notes:
      "Solo; wants to move upmarket (fleet + repeat); inconsistent follow-up; wants reminder cadence + a few message scripts; current system is IG + texts; wants less mental load.",
    source: "instagram_dm",
    stage: "prospecting",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "detailing",
    signals: ["upmarket-goal", "followup-inconsistent", "ig-and-text"],
  },
  {
    name: "Pinnacle Home Painting",
    location: "Scottsdale, AZ",
    website: "https://pinnacle-painting.example.com",
    notes:
      "Subcontractor-heavy; quality varies; rework surprises; wants accountability checkpoints; wants jobs to run without owner on every job; wants clear handoffs + scope clarity; uses spreadsheets + photos; wants system, not babysitting.",
    source: "meetup",
    stage: "client",
    status: "active",
    owner_load: "high",
    followup_risk: "med",
    industry: "painting",
    signals: ["subs-quality-variance", "handoff-clarity", "rework-risk"],
  },
  {
    name: "Mesa Appliance Repair Co.",
    location: "Mesa, AZ",
    website: "https://mesa-appliance.example.com",
    notes:
      "High call volume; scheduling friction; parts ordering causes second trips; wants better job profitability view; wants fewer missed calls and proactive status updates; wants to reduce inbound where-are-you calls; currently manual scheduling.",
    source: "google",
    stage: "meeting",
    status: "active",
    owner_load: "high",
    followup_risk: "high",
    industry: "appliance",
    signals: ["parts-delay", "missed-calls", "manual-scheduling"],
  },
  {
    name: "Redstone Garage Doors",
    location: "Gilbert, AZ",
    website: "https://redstone-garage.example.com",
    notes:
      "Weekend emergencies; dispatch decisions made on the fly; wants simple prioritization rules; wants repeat customer plan; tracks in calendar + texts.",
    source: "facebook",
    stage: "prospecting",
    status: "nurturing",
    owner_load: "medium",
    followup_risk: "med",
    industry: "garage_doors",
    signals: ["emergency-weekend", "dispatch-on-fly", "repeat-plan"],
  },
  {
    name: "Sonoran Pest & Weed",
    location: "Queen Creek, AZ",
    website: "https://sonoran-pestweed.example.com",
    notes:
      "Recurring routes, upsell opportunities; cancellations create gaps; wants retention + reminders; wants clear next actions per account; tech notes inconsistent.",
    source: "bni",
    stage: "meeting",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "pest_control",
    signals: ["route-gaps", "retention", "notes-inconsistent"],
  },
  {
    name: "Desert Spark Electric",
    location: "Chandler, AZ",
    website: "https://desertspark-electric.example.com",
    notes:
      "Met onsite; owner juggling estimates, supply runs, callbacks; wants job templates and closeout checklist; wants fewer missing parts trips; wants handoff for billing.",
    source: "onsite",
    stage: "onsite",
    status: "active",
    owner_load: "high",
    followup_risk: "high",
    industry: "electrical",
    signals: ["onsite-meet", "supply-runs", "closeout-checklist"],
  },
  {
    name: "Copper State Cleaning",
    location: "Tempe, AZ",
    website: "https://copperstate-cleaning.example.com",
    notes:
      "Recurring contracts; QA issues; wants inspection flow + accountability; scheduling stable but reporting weak; uses checklists but no consistent follow-up.",
    source: "referral",
    stage: "prospecting",
    status: "nurturing",
    owner_load: "medium",
    followup_risk: "low",
    industry: "commercial_cleaning",
    signals: ["qa-issues", "inspection-flow", "reporting-weak"],
  },
  {
    name: "Canyonline Concrete Coatings",
    location: "Mesa, AZ",
    website: "https://canyonline-coatings.example.com",
    notes:
      "Leads come in bursts; quoting slow; deposit tracking manual; wants pipeline + scheduling visibility; wants fewer no-shows; uses phone + spreadsheet.",
    source: "facebook",
    stage: "meeting",
    status: "active",
    owner_load: "high",
    followup_risk: "med",
    industry: "coatings",
    signals: ["lead-bursts", "deposit-manual", "no-show-risk"],
  },
  {
    name: "Saffron Door & Trim",
    location: "Scottsdale, AZ",
    website: "https://saffron-trim.example.com",
    notes:
      "Premium work; wants fewer scope surprises; client communication time sink; wants pre-job checklist + change-order clarity; wants calm handoffs.",
    source: "meetup",
    stage: "client",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "carpentry",
    signals: ["scope-surprises", "communication-heavy", "handoff-clarity"],
  },
  {
    name: "East Valley Mobile Mechanic",
    location: "Mesa, AZ",
    website: "https://eastvalley-mechanic.example.com",
    notes:
      "Constant inbound; prioritization hard; parts runs; wants fewer cancellations and better ETA updates; wants to know which jobs are worth doing.",
    source: "facebook",
    stage: "prospecting",
    status: "active",
    owner_load: "high",
    followup_risk: "high",
    industry: "mobile_mechanic",
    signals: ["prioritization-hard", "eta-updates", "cancellation-risk"],
  },
  {
    name: "Gold Canyon Roof Repair",
    location: "Gold Canyon, AZ",
    website: "https://goldcanyon-roof.example.com",
    notes:
      "Storm spikes; inspection notes scattered; wants standardized inspection + estimate template; follow-ups often missed after inspection.",
    source: "google",
    stage: "prospecting",
    status: "nurturing",
    owner_load: "medium",
    followup_risk: "med",
    industry: "roofing",
    signals: ["storm-spikes", "scattered-notes", "followup-missed"],
  },
  {
    name: "Desert Bloom Irrigation",
    location: "Queen Creek, AZ",
    website: "https://desertbloom-irrigation.example.com",
    notes:
      "Repeat issues due to incomplete notes; wants better documentation and client history; wants fewer second trips; scheduling ok but handoffs weak.",
    source: "bni",
    stage: "meeting",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "irrigation",
    signals: ["documentation-gap", "second-trips", "handoff-weak"],
  },
  {
    name: "Mesa Tile & Grout Restore",
    location: "Mesa, AZ",
    website: "https://mesa-grout.example.com",
    notes:
      "Wants consistent outreach + reminders; lots of one-off jobs; wants plan for repeat/referrals; current followup ad-hoc.",
    source: "instagram_dm",
    stage: "prospecting",
    status: "active",
    owner_load: "low",
    followup_risk: "med",
    industry: "restoration",
    signals: ["one-off-jobs", "referral-plan", "reminder-needed"],
  },
  {
    name: "Arrowhead Junk Removal",
    location: "Chandler, AZ",
    website: "https://arrowhead-junk.example.com",
    notes:
      "Scheduling and routing; crew availability; wants standardized quote rules + dispatch; wants fewer missed details in handoffs.",
    source: "onsite",
    stage: "onsite",
    status: "active",
    owner_load: "medium",
    followup_risk: "med",
    industry: "junk_removal",
    signals: ["routing", "quote-rules", "handoff-details"],
  },
  {
    name: "Sun Mesa Window & Screen",
    location: "Mesa, AZ",
    website: "https://sunmesa-window.example.com",
    notes:
      "High inbound in spring; scheduling backlog; wants better prioritization + customer updates; wants fewer cancellations due to long lead times.",
    source: "facebook",
    stage: "meeting",
    status: "active",
    owner_load: "medium",
    followup_risk: "high",
    industry: "windows",
    signals: ["seasonal-spike", "backlog", "cancellation-risk"],
  },
];

function buildTags(seed: LeadSeed) {
  return [
    "type:lead",
    `stage:${seed.stage}`,
    `industry:${seed.industry}`,
    `source:${seed.source}`,
    `owner_load:${seed.owner_load}`,
    `followup_risk:${seed.followup_risk}`,
    ...seed.signals.map((s) => `signal:${s}`),
    seedKey,
  ];
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function main() {
  const ownerId = process.env.OWNER_ID;

  if (!ownerId) {
    console.error("Missing env: OWNER_ID");
    process.exit(1);
  }

  const supabase = createSupabaseScriptClient();

  // Owner primary aim
  await savePrimaryAim(supabase, ownerId, primaryAim);

  // Existing leads
  const existing = await supabase
    .from("leads")
    .select("id,name,tags")
    .eq("owner_id", ownerId)
    .contains("tags", [seedKey]);
  const existingIds = new Set((existing.data || []).map((l) => l.id as string));

  const toInsert = leads
    .filter((lead) => !(existing.data || []).some((l) => (l.name || "").toLowerCase() === lead.name.toLowerCase()))
    .map((lead) => ({
      owner_id: ownerId,
      name: lead.name,
      website: lead.website,
      location: lead.location,
      notes: lead.notes,
      status: lead.status,
      tags: buildTags(lead),
    }));

  if (toInsert.length) {
    await supabase.from("leads").insert(toInsert);
  }

  const refreshed = await supabase
    .from("leads")
    .select("id,name")
    .eq("owner_id", ownerId)
    .contains("tags", [seedKey]);
  const leadMap = new Map<string, string>();
  (refreshed.data || []).forEach((row) => leadMap.set(row.name, row.id));

  // Clean old seeded followups/meetings
  await supabase.from("followups").delete().ilike("note", `%${seedKey}%`);
  await supabase.from("meeting_interactions").delete().ilike("notes", `%${seedKey}%`);
  await supabase.from("meetings").delete().ilike("notes", `%${seedKey}%`);

  // Followups
  const followupPlan = [
    { name: "Canyon Ridge Pressure Washing", days: 1, channel: "comment", draft: "Quiet check-in on quoting flow" },
    { name: "Desert Gate Handyman", days: 2, channel: "dm", draft: "Set weekly route reminder" },
    { name: "Sunstone Pool Care", days: 1, channel: "dm", draft: "Route smoothing note" },
    { name: "Copper Trail Landscaping", days: 0, channel: "comment", draft: "Capacity view share" },
    { name: "Ironwood HVAC & Maintenance", days: 1, channel: "dm", draft: "Invoice/closeout guardrail" },
    { name: "Saguaro Mobile Detail", days: 2, channel: "dm", draft: "Fleet outreach cadence" },
    { name: "Pinnacle Home Painting", days: 5, channel: "dm", draft: "Scope checkpoint template" },
    { name: "Mesa Appliance Repair Co.", days: 6, channel: "call", draft: "Proactive status update script" },
    { name: "Redstone Garage Doors", days: 7, channel: "dm", draft: "Prioritization rule draft" },
    { name: "Sonoran Pest & Weed", days: 5, channel: "dm", draft: "Retention reminder" },
    { name: "Desert Spark Electric", days: 6, channel: "onsite", draft: "Closeout checklist nudge" },
    { name: "Copper State Cleaning", days: 5, channel: "dm", draft: "QA inspection loop" },
    { name: "Canyonline Concrete Coatings", days: 7, channel: "dm", draft: "Deposit tracking flow" },
    { name: "Saffron Door & Trim", days: 6, channel: "dm", draft: "Change-order clarity" },
    { name: "East Valley Mobile Mechanic", days: 7, channel: "dm", draft: "ETA update habit" },
    { name: "Gold Canyon Roof Repair", days: 4, channel: "dm", draft: "Inspection follow-up template" },
    { name: "Desert Bloom Irrigation", days: 5, channel: "dm", draft: "Documentation reminder" },
    { name: "Mesa Tile & Grout Restore", days: 3, channel: "dm", draft: "Repeat/referral touch" },
    { name: "Arrowhead Junk Removal", days: 2, channel: "onsite", draft: "Dispatch rules share" },
    { name: "Sun Mesa Window & Screen", days: 1, channel: "dm", draft: "Backlog update" },
  ];

  const followupRows = followupPlan
    .map((f, idx) => {
      const leadId = leadMap.get(f.name);
      if (!leadId) return null;
      const due_at = daysFromNow(f.days);
      const done = idx >= 12 && idx < 16; // 4 completed
      const note = `${f.channel} - ${f.draft} ${seedKey}`;
      return {
        lead_id: leadId,
        due_at,
        note,
        done,
        completed_at: done ? daysFromNow(-2) : null,
      };
    })
    .filter(Boolean);

  if (followupRows.length) {
    await supabase.from("followups").insert(followupRows as any[]);
  }

  // Meetings
  const meetingSeeds = [
    { title: "BNI breakfast - Sonoran Pest", name: "Sonoran Pest & Weed", days: -3, type: "networking", location: "Mesa Cafe" },
    { title: "Route planning - Sunstone Pool", name: "Sunstone Pool Care", days: 2, type: "zoom", location: "Zoom" },
    { title: "Quality review - Pinnacle Painting", name: "Pinnacle Home Painting", days: 5, type: "client", location: "Client office" },
    { title: "Onsite walk - Desert Spark Electric", name: "Desert Spark Electric", days: 1, type: "onsite", location: "Job site" },
    { title: "Lead bursts - Canyonline Coatings", name: "Canyonline Concrete Coatings", days: -7, type: "zoom", location: "Zoom" },
    { title: "Retention plan - Sonoran Pest", name: "Sonoran Pest & Weed", days: 8, type: "client", location: "Office" },
    { title: "Backlog triage - Sun Mesa Window", name: "Sun Mesa Window & Screen", days: 3, type: "zoom", location: "Zoom" },
    { title: "Quote flow - Copper Trail Landscaping", name: "Copper Trail Landscaping", days: 0, type: "meeting", location: "Cafe" },
  ];

  const meetingRows: any[] = [];
  const interactionRows: any[] = [];
  meetingSeeds.forEach((m, idx) => {
    const leadId = leadMap.get(m.name);
    if (!leadId) return;
    const start = new Date();
    start.setDate(start.getDate() + m.days);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const meetingId = randomUUID();
    meetingRows.push({
      id: meetingId,
      owner_id: ownerId,
      title: m.title,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      location_name: m.location,
      status: m.days < 0 ? "completed" : "planned",
      notes: `${m.type} ${seedKey}`,
    });
    interactionRows.push({
      meeting_id: meetingId,
      owner_id: ownerId,
      person_name: m.name,
      company_name: m.name,
      lead_id: leadId,
      notes: `Interaction for ${m.name} ${seedKey}`,
      tags: [seedKey, `type:${m.type}`],
    });
  });

  if (meetingRows.length) await supabase.from("meetings").insert(meetingRows);
  if (interactionRows.length) await supabase.from("meeting_interactions").insert(interactionRows);

  // Run E-Myth tasks per lead
  let emythCount = 0;
  let skippedEmyth = 0;
  for (const [name, leadId] of leadMap.entries()) {
    const leadNotes = leads.find((l) => l.name === name)?.notes || "";
    for (const task of ["role_map", "on_vs_in", "follow_through"] as const) {
      try {
        await runEmythTask(supabase, { task, leadId, pastedText: leadNotes, notes: "", mode: "prospecting", deep: false, ownerId });
        emythCount += 1;
      } catch (err: any) {
        const msg = typeof err?.message === "string" ? err.message : "";
        if (msg.toLowerCase().includes("openai") || msg.toLowerCase().includes("api key") || msg.includes("tools[0].name")) {
          console.warn(`Skipping E-Myth generation for ${name} task=${task}: OpenAI/tools not configured.`);
          skippedEmyth += 1;
          continue;
        }
        console.error(`E-Myth task failed for ${name} task=${task}`, err);
      }
    }
  }

  console.log("Seed complete", {
    leads: leadMap.size,
    followups: followupRows.length,
    meetings: meetingRows.length,
    emythTasks: emythCount,
    emythSkipped: skippedEmyth,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
