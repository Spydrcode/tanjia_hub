# Tanjia Implementation Acceptance Checklist

This checklist ensures core 2ndmynd/Tanjia features remain intact and accessible.

## Core Features

### Second Look Availability
- [ ] Second Look is copyable from `/tanjia/explore` (via ActionZone)
- [ ] Second Look is copyable from `/tanjia/present` (via ShareBlock)
- [ ] Second Look is copyable from `/tanjia/introduce` (via CopySecondLookButton)

### Navigation & Routes
- [ ] `/tanjia/prepare` route exists and contains operator checklist
- [ ] "Prepare →" link is visible on `/tanjia/explore` (top-right, near "Next →")
- [ ] "Open client view" link in header points to `/tanjia/present` and works

### Presentation Page
- [ ] `/tanjia/present` is client-safe (no internal tool references)
- [ ] `/tanjia/present` includes the loop line
- [ ] `/tanjia/present` includes ShareBlock with "Copy note" + "Copy Second Look"
- [ ] `/tanjia/present` has minimal operator navigation (header only)

### Prepare Page
- [ ] `/tanjia/prepare` is labeled "Prepare" (NOT "Tools")
- [ ] Page feels like a checklist, not a dashboard
- [ ] No jargon, internal tool names, or MCP references
- [ ] Contains fast actions: capture lead, add note, plan follow-up, draft reply
- [ ] Is clearly operator-facing, not client-safe

### Language & Tone
- [ ] No SaaS language (dashboard, command center, modes)
- [ ] No system states exposed to client views
- [ ] No AI/automation promises on client-facing pages
- [ ] Tone is calm, observational, and grounded

## Testing Checklist

- [ ] Navigate to `/tanjia/introduce` and verify Second Look button appears
- [ ] Navigate to `/tanjia/explore` and verify "Prepare →" link appears
- [ ] Click "Prepare →" and verify `/tanjia/prepare` loads correctly
- [ ] Navigate to `/tanjia/present` and verify ShareBlock with copy buttons
- [ ] Test all "Copy Second Look" buttons across the three pages
- [ ] Verify no 404s on any core routes

## Guard Rails

If any of the above items fail:
1. Stop implementation
2. Restore missing feature from this specification
3. Verify all checklist items again before deployment

---
Last verified: [Date]
Verified by: [Name]
