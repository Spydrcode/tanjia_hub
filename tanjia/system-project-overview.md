# System Project Overview (Tanjia Networking Hub)

## Current System Map
- **Routes / Pages**
  - `app/tanjia/layout.tsx` — shared header/footer, ViewModesProvider, toggles for Explain/Presentation/Walkthrough.
  - `app/tanjia/page.tsx` — dashboard summary.
  - `app/tanjia/leads/page.tsx`, `app/tanjia/leads/[id]/page.tsx`, `app/tanjia/leads/new/page.tsx` — lead list/detail/create with masking support.
  - `app/tanjia/followups/page.tsx` — follow-up board (client + server pieces).
  - `app/tanjia/helper/page.tsx` — reply helper; intent “schedule” supported.
  - `app/tanjia/scheduler/page.tsx` — in-app Cal embed with 15/30 cards, presentation-safe prefill suppression.
  - `app/tanjia/system-overview/page.tsx` — Client View overview (cards + aggregated metrics, no PII).
- **API Routes**
  - `app/api/tanjia-auth/route.ts` — helper passcode auth.
  - `app/api/tanjia-agent/route.ts` — agent (reflect/invite/schedule/encourage) with schedule agent path.
  - `app/api/scheduling/log/route.ts` — logs scheduler funnel events.
  - `app/api/send-email/route.ts` — email via Resend, logs messages.
  - `app/api/tanjia/metrics/route.ts` — per-user aggregated counts (last 7d + deltas vs prev 7d).
  - `app/api/cal/webhook/route.ts` — Cal.com webhook ingestion, booking upsert, logging, followups (when owner+lead known).
- **Supabase Tables (migrations `supabase/migrations`)**
  - `leads`, `lead_snapshots`, `messages`, `followups` (`001_init.sql`).
  - `lead_bookings` with Cal fields, needs_review, match_reason (`002`, `004`).
  - `followups.completed_at` + triggers (`003`).
  - RLS: leads/followups/messages owner-scoped; lead_bookings policy currently owner-based (owner_id).
- **Major UI Modes**
  - Explain Mode (internal-only, default OFF, /tanjia scope, ⓘ popovers on scheduler/lead detail/followups/metrics).
  - Presentation Mode (UI masking of names/emails/notes/messages/followups; suppresses scheduler prefill; banner + Client View link copy; data untouched).
  - Walkthrough button (header) flips Presentation Mode and opens system overview.
- **Metrics**
  - `/api/tanjia/metrics`: schedule_opened, duration_selected, bookings_created/canceled, followups_created/completed, unmatched_bookings; each returns `{ last7d, prev7d, delta }`.
  - System overview renders these as aggregated-only cards; no identifiers.

## What’s Live Now
- In-app Cal scheduling with 15/30-minute cards and embedded booking; logging via scheduler log endpoint; webhooks upsert bookings and (when mapped) create followups and messages.
- Lead + follow-up workspace with masking-aware UI, helper agent, and scheduling links.
- Client View system overview with aggregated Operating Rhythm metrics and Explain-Mode walkthrough script.
- Guardrails: /tanjia/* is noindex; Explain content rendered only when toggled; Presentation masking is UI-only and suppresses prefill.
- RLS tightened to owner_id on lead_bookings (policy in `004_bookings_attribution.sql`), pending confirmation in 005.

## Known Risks / Guardrails
- **Webhook idempotency edge** (must fix): if a booking is already stored as `canceled`, a later `created` retry can overwrite it. Needs an existing-status check to keep `canceled`, set `needs_review=true`, and `match_reason="cancel_precedes_create"`.
- Metrics: currently count unmatched where owner/user matches via OR; ensure future queries rely on owner_id only once RLS policy finalized.
- Presentation Mode is UI masking only; operators must ensure it’s enabled before sharing screens.
- Webhook unmatched rows with `owner_id` null are stored but should remain invisible to users; unmatched counts should only include rows with owner_id = auth.uid().

## Next 7 Days: Must-Do Tasks
- **Fix Cal webhook idempotency**: in `app/api/cal/webhook/route.ts`, before upsert, read existing `status` by `cal_booking_id`; if existing is `canceled` and incoming resolves to `created`, force status to `canceled`, set `needsReview=true`, and `match_reason="cancel_precedes_create"` (if empty). Prevent followups/messages in this path.
- **Finalize lead_bookings RLS**: apply migration 005 to enforce owner-only RLS (remove any reliance on user_id/coalesce).
- **Adjust metrics query**: update `/api/tanjia/metrics` to drop `user_id` from the OR and rely solely on owner_id once RLS is finalized.
- **Validate unmatched counts**: ensure unmatched_bookings only counts rows with owner_id = auth.uid() and needs_review=true (exclude owner_id null).

## Later Roadmap (Director of Networking)
- Lightweight lead-to-booking reconciliation UI for unmatched bookings (owner-scoped, masked by default).
- Calendar slot preview endpoint (optional) for custom availability surfaces.
- Quiet reminders digest (aggregated, no PII) for daily workflow.
- Configurable follow-up templates per intent/duration, still guardrailed and calm.
- Optional admin-only audit log for webhook events and matches.

## File/Folder Index (key references)
- Layout & Modes: `app/tanjia/layout.tsx`, `src/components/ui/view-modes.tsx`, `src/components/ui/view-mode-controls.tsx`, `src/components/ui/view-mode-indicator.tsx`.
- Scheduler: `app/tanjia/scheduler/page.tsx`, `app/tanjia/scheduler/scheduler-client.tsx`.
- Leads: `app/tanjia/leads/page.tsx`, `app/tanjia/leads/[id]/page.tsx`, `app/tanjia/leads/[id]/client.tsx`.
- Followups: `app/tanjia/followups/page.tsx`, `app/tanjia/followups/client.tsx`.
- Helper: `app/tanjia/helper/page.tsx`, `app/tanjia/helper/helper-client.tsx`.
- System Overview: `app/tanjia/system-overview/page.tsx`, `app/tanjia/system-overview/walkthrough-panel.tsx`.
- API: `app/api/tanjia-agent/route.ts`, `app/api/tanjia-auth/route.ts`, `app/api/scheduling/log/route.ts`, `app/api/send-email/route.ts`, `app/api/tanjia/metrics/route.ts`, `app/api/cal/webhook/route.ts`.
- Supabase schema: `supabase/migrations/001_init.sql`, `002_cal_bookings.sql`, `003_followups_completed.sql`, `004_bookings_attribution.sql` (lead_bookings ownership), planned `005_fix_bookings_rls.sql`.

## Director of Networking: What This System Does / Does Not Do
- **Provides**
  - In-app scheduling with two calm duration choices; embedded booking; automatic followups when mapped.
  - Lead context, followups, and messaging helper with masking options for client-facing screens.
  - Operating Rhythm metrics that show activity without exposing identities.
  - Explain/Presentation modes to safely narrate and share the workspace.
- **Intentionally Does NOT**
  - Automate outreach or pushy cadences; no sales funnels or CTAs.
  - Expose PII in client-facing views; system overview stays aggregated-only.
  - Add complexity or automation creep without clear value; features stay minimal and owner-led.
