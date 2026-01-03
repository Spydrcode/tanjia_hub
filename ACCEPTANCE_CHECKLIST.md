# 2ndmynd OS — Acceptance Checklist

This checklist verifies that the zone-based reframe is complete and working as intended.

## Navigation & Structure

- [ ] Hub page (`/tanjia`) shows 4 clear choices aligned to zones
- [ ] "Show someone what 2ndmynd does" link visible
- [ ] System Overview link visible at bottom
- [ ] Each zone page has ZoneHeader with loop line, badge, question, and use-when

## Zone Pages

### LISTEN (`/tanjia/listen`)
- [ ] Page loads without error
- [ ] Shows "What did they say, and what's the next open thread?"
- [ ] Context cards display (last mentioned, waiting on)
- [ ] Suggested question visible
- [ ] Second Look share button works
- [ ] Next lead navigation present

### CLARIFY (`/tanjia/clarify`)
- [ ] Page loads without error
- [ ] Shows "What matters most right now?"
- [ ] Clarifying question card displays
- [ ] Triad visible (not alone, path forward, here to help)
- [ ] Second Look share button works

### MAP (`/tanjia/map`)
- [ ] Page loads without error
- [ ] Shows "Where is pressure coming from in the business?"
- [ ] Lead selector works
- [ ] Custom URL input works
- [ ] Website scan runs with progress stepper
- [ ] Results show (growth changes, friction points, calm next steps)
- [ ] Second Look share button works

### DECIDE (`/tanjia/decide`)
- [ ] Page loads without error
- [ ] Shows "What's the one next move?"
- [ ] Current move card displays with priority badge
- [ ] "Mark complete" button works
- [ ] "Skip for now" button works
- [ ] Upcoming queue displays
- [ ] Add follow-up button present
- [ ] Second Look share button works

### SUPPORT (`/tanjia/support`)
- [ ] Page loads without error
- [ ] Shows "What should I say?"
- [ ] Lead selector works
- [ ] Draft type selection works (follow-up, intro, check-in, share)
- [ ] Generate draft button works
- [ ] Copy all button works
- [ ] Copy blocks visible
- [ ] Second Look share button works

## System Overview (`/tanjia/system`)
- [ ] Page loads without error
- [ ] Shows current lead status (if any)
- [ ] All 5 zone cards visible with numbered steps
- [ ] Quick stats grid displays
- [ ] Operator tools links work
- [ ] Loop reminder visible

## Present Page (`/tanjia/present`)
- [ ] Page loads without error
- [ ] Client View badge visible
- [ ] Back to Hub link works
- [ ] Growth messaging displays
- [ ] Second Look share button works
- [ ] Loop footer visible

## Second Look Integration
- [ ] Share buttons are buttons, not raw URLs
- [ ] Each zone's Second Look passes relevant context
- [ ] Standard note: "This gives you a clearer way to see how growth has changed what you're carrying."

## Brand & Tone
- [ ] All zone pages have subtle backdrop blur
- [ ] Zone badges use correct colors (blue/violet/amber/emerald/rose)
- [ ] GradientHeading uses anchor style for zone titles
- [ ] Loop line appears at top of zone headers
- [ ] Tone is calm and decisive, not vague

## Known Routes
- `/tanjia` — Hub (4 choices)
- `/tanjia/listen` — LISTEN zone
- `/tanjia/clarify` — CLARIFY zone
- `/tanjia/map` — MAP zone
- `/tanjia/decide` — DECIDE zone
- `/tanjia/support` — SUPPORT zone
- `/tanjia/system` — System Overview
- `/tanjia/present` — Client View presentation
- `/tanjia/leads` — Lead management (operator)
- `/tanjia/leads/[id]` — Lead detail
- `/tanjia/followups` — Follow-up queue (operator)
- `/tanjia/meetings` — Meetings (operator)
- `/tanjia/scheduler` — Scheduler (operator)

## Build Verification
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] All routes generate without 404
- [ ] No console errors on page load

---

**Last Updated:** $(date)
**Status:** Ready for review
