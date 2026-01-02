# Tanjia Networking Hub – Implementation Notes

## CHANGELOG: Tanjia Reply Helper Rewrite (Jan 2026)

### What Changed
**Fixed the Tanjia Reply Helper to consistently generate tailored, 2ndmynd-aware replies using a deterministic two-step agent flow.**

### Core Changes
1. **New Schema Layer** (`src/lib/tanjia/signal-schema.ts`)
   - `SignalExtractSchema`: Structured extraction of values, pressures, stage, risks, openings from input
   - `ReplyDraftSchema`: Validation schema for final reply with style checks and CTA tracking
   - Enforces consistent signal analysis before reply generation

2. **Prompt Architecture** (`src/lib/tanjia/reply-prompts.ts`)
   - Exact, non-negotiable SYSTEM and DEVELOPER prompts
   - Two-step flow: ANALYZE → RESPOND
   - Hard rules against roleplay, generic paraphrasing, SaaS language
   - Always mentions 2ndmynd + 2nd Look + link by default

3. **Copy Rules & Tone Guard** (`src/lib/tanjia/copy-rules.ts`)
   - Banned phrases list (40+ terms: optimize, leverage, scale, synergy, AI-powered, etc.)
   - Preferred "Quiet Founder" language examples
   - Validation helpers to enforce tone at runtime

4. **Two-Step Agent Service** (`src/lib/tanjia/reply-helper.ts`)
   - `generateReply()` function powers all reply routes
   - Step 1: Extract signals into JSON (with retry/repair on parse failure)
   - Step 2: Generate reply based on signals + validate against schema
   - Step 3: Self-repair if validation fails (one retry attempt)
   - Returns: `{ reply_text, analysis, checks, meta }` with failure tracking

5. **API Route Refactor**
   - `app/api/tanjia/comment-reply/route.ts`: Now uses `generateReply()`
   - `app/api/tanjia/dm-reply/route.ts`: Now uses `generateReply()`
   - Both routes return structured payload with analysis + validation checks
   - Removed old inline prompts and helper functions

6. **UI Enhancement** (`app/tanjia/helper/helper-client.tsx`)
   - Added "Why this reply" collapsible section showing:
     - Recommended angle (one-sentence strategy)
     - Values (chips)
     - Pressures (chips)
     - Confidence score (progress bar)
     - Validation checks (green checkmarks / red X)
   - "Regenerate (new angle)" button to rerun full flow
   - Analysis data returned from API displayed inline

7. **Test Coverage** (`src/lib/tanjia/reply-helper.test.ts`)
   - Unit tests for banned phrase detection
   - Tone validation tests (exclamation points, bullet points, all-caps)
   - Schema validation tests
   - Scenario tests covering:
     - Plumbing comment example (from screenshot) - validates NO roleplay
     - Realtor post - validates pressure reflection
     - Overwhelmed post - validates supportive tone
     - Short vague comment - validates graceful handling

### Validation Gate
**Every reply must pass these checks before being returned:**
- ✅ Directed to commenter (not about them, not as them)
- ✅ References specific detail from their message
- ✅ Mentions 2ndmynd
- ✅ Mentions "2nd Look" by name
- ✅ Includes link: https://www.2ndmynd.com/second-look
- ✅ At most ONE call-to-action
- ✅ Avoids SaaS/marketing language
- ✅ Avoids roleplay as commenter (e.g., "I own Desert Pioneer Plumbing")

### Length Constraints (by channel)
- **Comment**: 40-110 words
- **DM**: 40-140 words
- **Followup**: 30-90 words

### Acceptance Criteria Met
- ✅ Helper ALWAYS produces reply addressing the commenter (not speaking as them)
- ✅ Mentions 2ndmynd + 2nd Look + link by default
- ✅ Never roleplays as the commenter
- ✅ Never outputs generic paraphrase responses
- ✅ UI displays "why this reply" signals
- ✅ Tests cover core failure modes from screenshot

### Files Created
- `src/lib/tanjia/signal-schema.ts`
- `src/lib/tanjia/reply-prompts.ts`
- `src/lib/tanjia/copy-rules.ts`
- `src/lib/tanjia/reply-helper.ts`
- `src/lib/tanjia/reply-helper.test.ts`

### Files Modified
- `app/api/tanjia/comment-reply/route.ts`
- `app/api/tanjia/dm-reply/route.ts`
- `app/tanjia/helper/helper-client.tsx`

### How to Test
1. Go to `/tanjia/helper` (Reply Helper)
2. Paste a comment like: "I own Desert Pioneer Plumbing specializing in water heaters, softeners, and leak repair. Honesty and keeping customers informed is what we do."
3. Click Generate
4. Verify:
   - Reply addresses them (not as them)
   - Mentions "2nd Look" and includes link
   - References specific detail (e.g., "honesty", "water heater")
   - Shows "Why this reply" section with values/pressures
   - No banned phrases (optimize, leverage, scale, etc.)
5. Try regenerating to confirm consistent behavior

### Internal Logging
- All replies save trace with `analysis`, `checks`, and `failures` in metadata
- Failed validation attempts logged in `meta.failures` array
- Can be inspected in Supabase `messages` table

---

## What changed
- Added MCP health check API (`app/api/tanjia/mcp-health/route.ts`) and explain-only status card on the system overview.
- Introduced lead enrichment API (`app/api/tanjia/lead-enrich/route.ts`) using fetch/search tools + quiet agent prompt.
- Rebuilt the New Lead flow with enrichment preview and snapshot saving to `lead_snapshots`.
- Standardized gradients via `src/components/ui/brand.ts` and applied to scheduler/system overview cards.
- Copy audit across scheduler/system overview/helper to keep Quiet Founder tone and remove dev-ish wording.
- Hardened Cal webhook idempotency guardrails in code and added RLS fix migration `005_fix_bookings_rls.sql`.
- Meetings workflow end-to-end with capture/results (`006_meetings.sql`).

## How to test MCP health
1. Ensure MCP feature flags/URLs are set in env (`MCP_SERVER_URL`, `MCP_ENABLED` if applicable).
2. Visit `/tanjia/system-overview` and turn on Explain Mode (Ctrl+Shift+E).
3. Confirm the MCP card shows OK/Check states; failures should not throw, only show “Check”.
4. API direct test: `curl -X GET http://localhost:3000/api/tanjia/mcp-health` while authenticated.

## How to test lead enrichment
1. Go to `/tanjia/leads/new` while logged in.
2. Enter a website (and optional name/location/notes).
3. Click “Fetch website signals” (or “Generate quick overview”) and confirm preview cards populate.
4. Submit “Create lead”. After redirect, verify a `lead_snapshots` row exists with `runType: "enrich"` in `extracted_json`.
5. Test with MCP disabled to ensure graceful, cautious outputs.

## Meetings workflow
- Create: `/tanjia/meetings/new` (title, time, location). Saved to `meetings` table.
- Start/capture: `/tanjia/meetings/[id]/start` to log interactions and optional quick lead creation; Presentation Mode masks names/notes automatically via `SensitiveText`.
- End: "End and generate results" sets status completed and runs agent to store `meeting_results` (summary, follow-up plan, intros, improvements).
- Results: `/tanjia/meetings/[id]/results` shows generated outputs (aggregated, masked when Presentation Mode is on).
- Dashboard: Upcoming meetings card surfaces next 3 and quick Start.

## Final verification
- Presentation Mode suppresses Explain-only UI (walkthrough + MCP card hidden when presentation is on).
- Metrics are owner-scoped; unmatched bookings counted only for owner rows; canceled?created resurrection blocked in Cal webhook.
- Meeting results generation idempotent (skip if results already exist); meeting pages scoped by owner_id.
- Lead enrichment snapshots save structured JSON only (signals/overview) with lead-linked RLS.

## Copy sweep
- Removed dev-ish terms in user UI; no public-facing “clarity”, “Cal embed”, or “client-side” phrasing in /tanjia surfaces.

## Icons/OG
- Added favicon/app icons and OG image in `public/`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`, `og.png`.
- Metadata wired in `app/layout.tsx` for icons/manifest/Open Graph/Twitter. Verify via hard refresh and social debuggers (OG image `/og.png`).

## Tree hygiene
- Restored initial migration content; ensured new migrations are additive (005_fix_bookings_rls.sql, 006_meetings.sql). Favicon/OG assets placed under `public/` to replace earlier missing favicon state.

## OpenAI tool calling alignment
- Agents now use the OpenAI Responses API with function tools; tool schemas are explicit JSON schema and validated with zod before execution.
- Tools supported: `fetch_public_page` (https-only, snippet truncated) and `web_search` (results truncated). MCP integration uses a single `MCP_SERVER_URL` when enabled.
- Health check `/api/tanjia/mcp-health` exercises the tools (not direct POSTs) and returns availability + latency without leaking payloads.

### How to test tool/MCP path
- Run an agent flow that needs `web_search` or `fetch_public_page` (e.g., lead enrichment) and confirm trace shows tool calls.
- Hit `/api/tanjia/mcp-health` while authenticated to confirm tools execute; when MCP is enabled ensure `MCP_SERVER_URL` responds.


## MCP stub
- Minimal MCP server at `mcp-server/index.ts` (node-based) exposing `fetch_public_page` and `web_search` (read-only, https-only for fetch).
- Run locally: `node mcp-server/index.ts` (uses PORT env or 8787). Set `MCP_SERVER_URL=http://localhost:8787` and `MCP_ENABLED=true` to exercise tools.

## Dashboard polish and presentation access
- /tanjia now uses a GradientHeading hero + GradientPills, 12-col grid, Today/quick actions/operating rhythm strips, and subtle Framer Motion transitions to match the 2ndmynd visual style.
- Presentation Mode: use the dashboard "Presentation Mode" primary CTA (or the header "Client view" control). It turns off Explain, enables presentation mode, and routes to `/tanjia/system-overview`; the secondary dashboard button copies the client-safe link.
- Anchor gradients: page headers now use `PageHeader` with `anchor` for /tanjia, Leads, Follow-ups, Meetings, Scheduler, Helper, and System overview. Confirm by checking the gradient word in each heading.
