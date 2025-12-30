export type DemoLead = {
  id: string;
  name: string;
  website: string;
  location?: string;
  status?: string;
  notes?: string;
  updated_at?: string;
  created_at?: string;
  snapshot?: {
    summary: string;
    talkingPoints: string[];
    questions: string[];
    drafts: {
      comment: string[];
      dm: string[];
      email: string[];
    };
    modelsUsed?: string[];
  };
};

export const demoLeads: DemoLead[] = [
  {
    id: "demo-quiet-studio",
    name: "Quiet Studio",
    website: "https://quiet.studio",
    location: "Remote",
    status: "new",
    updated_at: "2024-09-12T12:00:00Z",
    created_at: "2024-09-01T12:00:00Z",
    notes: "Demo only. No real data.",
    snapshot: {
      summary: "Quiet Studio builds thoughtful digital experiences; public site highlights calm onboarding and small engagements.",
      talkingPoints: [
        "They emphasize small, steady engagements over big launches.",
        "Site mentions collaborative reviews before changes ship.",
        "They keep scheduling flexible with async updates.",
      ],
      questions: [
        "Is it useful to send a short review of your latest sprint?",
        "Would a 15-minute check-in help or should we keep it async?",
      ],
      drafts: {
        comment: [
          "Thanks for sharing this update—happy to take a quiet look if you want.",
          "Looks solid. Want a quick second glance before you ship?",
        ],
        dm: [
          "Saw your latest work. I can send a brief second look if that's helpful. If not, all good.",
          "Appreciate the calm approach you're taking. Want me to review anything specific?",
        ],
        email: [
          "If a short second look would be useful, I can send a few notes. If not, no worries.",
          "Happy to review your next sprint quietly. Tell me if you'd rather keep it async.",
        ],
      },
      modelsUsed: ["gpt-4o-mini"],
    },
  },
];

export const demoFollowups: Record<
  string,
  { id: string; note: string; due_at?: string; done?: boolean; created_at?: string }[]
> = {
  "demo-quiet-studio": [
    {
      id: "demo-follow-1",
      note: "Send brief notes after reviewing homepage copy.",
      due_at: "2024-09-15T15:00:00Z",
      done: false,
      created_at: "2024-09-10T12:00:00Z",
    },
  ],
};
