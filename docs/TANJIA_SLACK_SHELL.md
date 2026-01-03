# Tanjia Slack-Style Shell

This document describes the Slack-inspired workspace layout for the Tanjia app, designed to provide a cohesive, persistent navigation experience with familiar interaction patterns.

## Overview

The Tanjia app uses a **Slack-style workspace layout** with:
- **Persistent left sidebar** for navigation with Recents and Pinned items
- **Context-aware top bar** with page title, description, and command palette trigger
- **Main work canvas** that adapts to each section
- **Command palette** (Ctrl/Cmd+K) for fast navigation and actions
- **Composer** on Hub and Today for quick capture
- **Live badges** with trustworthy, stable counts

## Architecture

### Components

#### 1. AppShell (`app/tanjia/components/app-shell.tsx`)
The main layout wrapper using CSS Grid:
- **Left column**: Fixed-width sidebar (256px)
- **Right column**: Flexible main content area with topbar + content

```tsx
<AppShell onSignOut={signOutAction}>
  {children}
</AppShell>
```

#### 2. Sidebar (`app/tanjia/components/sidebar.tsx`)
Persistent left navigation with:
- **Brand header** with 2ndmynd branding
- **Quick Actions** buttons (New Lead, New Meeting, Schedule Call)
- **Pinned section**: User-pinned leads, meetings, or followups
  - Shows pin icon, title, subtitle
  - Click X to unpin
  - Persisted in localStorage
- **Recents section**: Last 5 visited items
  - Automatically tracked on navigation
  - Excludes Hub/Today/System unless empty
  - Shows history icon, title, subtitle
- **Grouped navigation sections** (collapsible):
  - **Workspace**: Hub, Today
  - **Zones**: Listen, Clarify, Map, Decide, Support
  - **Work**: Leads, Meetings, Scheduler, Followups
  - **System**: System Overview, Client View
- **Live badges** showing counts (meetings in 48h, overdue followups, untriaged leads)
- **Footer** with branding link

#### 3. Topbar (`app/tanjia/components/topbar.tsx`)
Sticky header within main content showing:
- **Page title** (auto-derived from route)
- **One-line descriptor** explaining the page purpose
- **Search/command trigger** (clickable, opens palette on ⌘K)
- **Quick actions**: Client View button, Logout

#### 4. Command Palette (`app/tanjia/components/command-palette.tsx`)
Global search and command runner:
- **Trigger**: Ctrl/Cmd+K anywhere in /tanjia
- **Grouped commands**:
  - **Pinned**: Jump to pinned items
  - **Recent**: Jump to recent items
  - **Create**: New Lead, New Meeting, Schedule Call
  - **Navigate**: All workspace sections
- **Keyboard navigation**: Arrow keys, Enter to select, Esc to close
- **Search**: Filters commands by label and keywords

#### 5. Composer (`app/tanjia/components/composer.tsx`)
Quick capture box for text snippets:
- **Location**: Top of Hub and Today pages
- **Placeholder**: "Paste a comment, a lead message, or call notes…"
- **Actions**:
  - Draft reply (routes to Support)
  - Create follow-up (routes to Followups with prefilled note)
  - Log lead (routes to Leads with prefilled note)
  - Turn into meeting notes (routes to Meetings with prefilled notes)
- **Persistence**: Uses sessionStorage to pass text to destination page

#### 6. Pin Button (`app/tanjia/components/pin-button.tsx`)
Reusable button to pin/unpin items:
- **Appears on**: Meeting detail, Lead detail pages
- **Shows**: "Pin" or "Pinned" with icon
- **Syncs**: Updates sidebar immediately via storage event

### Layout Integration

The layout is integrated in `app/tanjia/layout.tsx`:
- Authenticated users see the full AppShell
- Unauthenticated users see a minimal layout
- All child routes automatically render inside the shell

## Key Features

### 1. Recents & Pins

**Recents** (`app/tanjia/lib/recents.ts`):
- Tracks last 8 visited items (shows 5 in sidebar)
- Auto-tracked on navigation click
- Excludes Hub/Today/System unless nothing else exists
- Stored in localStorage as `tanjia_recents`

**Pins** (`app/tanjia/lib/pins.ts`):
- User can pin any meeting, lead, or followup
- Pin button available on detail pages
- No limit on pins (but keep sidebar UX reasonable)
- Stored in localStorage as `tanjia_pins`

**Item model**:
```ts
{
  id: string;
  type: "lead" | "meeting" | "followup" | "zone" | "page";
  title: string;
  href: string;
  subtitle?: string;
  icon?: string;
  timestamp?: number; // for recents
}
```

### 2. Command Palette

**Keyboard shortcuts**:
- **Ctrl/Cmd+K**: Toggle palette
- **Arrow keys**: Navigate commands
- **Enter**: Execute selected command
- **Esc**: Close palette

**Command groups**:
- Pinned items (if any)
- Recent items (if any)
- Create actions (New Lead, New Meeting, Schedule Call)
- Navigate to all workspace sections

### 3. Composer (Quick Capture)

On **Hub** and **Today** pages, a composer box allows:
1. Paste text (comment, message, notes)
2. Choose action:
   - **Draft reply**: Routes to `/tanjia/support?from=composer`
   - **Create follow-up**: Routes to `/tanjia/followups?action=new&from=composer`
   - **Log lead**: Routes to `/tanjia/leads?action=new&from=composer`
   - **Meeting notes**: Routes to `/tanjia/meetings?action=new&from=composer`
3. Text stored in `sessionStorage` with keys:
   - `tanjia_composer_text`
   - `tanjia_composer_action`

Destination pages should read from sessionStorage to prefill forms.

### 4. Live Metrics & Badges

**Badge semantics** (Slack-style, trustworthy):
- **Meetings**: Meetings in next **48 hours** (not 7 days)
- **Followups**: **Overdue only** (past due_at, not done)
- **Leads**: **Untriaged** (status = "new" OR missing next_step)

**API**: `/api/tanjia/work-metrics` returns:
```json
{
  "upcomingMeetings": 3,
  "overdueFollowups": 1,
  "untriagedLeads": 5,
  "inProgressMeetings": 0,
  "recentCompletedMeetings": 2,
  "lastUpdated": "2026-01-03T12:00:00Z"
}
```

**Refresh cadence**:
- Initial load
- Every 60 seconds while on `/tanjia`
- No flicker: keep previous values until new response arrives

### 5. Today Dashboard (`app/tanjia/today/page.tsx`)

A daily operations page showing:
- **Composer** at the top
- **Upcoming meetings** (next 7 days) with Start/Resume actions
- **Overdue followups** (highlighted)
- **Today's followups**
- **Recent bookings** (last 7 days)
- **7-day metrics summary**

### 6. Refactored Hub Page (`app/tanjia/page.tsx`)

The main hub now has:
- **Composer** for quick capture
- **Primary action cards** for core zones (Listen, Clarify, Map, Decide, Support)
- **Quick Access section** highlighting Meetings, Scheduler, and Leads
- **Prominent link** to Today dashboard
### 7. Meeting Recording/Transcript Support

Meetings now support optional attachments:
- **Migration**: `supabase/migrations/011_meeting_recordings.sql`
  - `recording_url` (text, nullable)
  - `transcript_text` (text, nullable)
  - `transcript_source` (text, nullable)

**UI**:
- Meeting detail page includes `<RecordingSection>` component
- Add/edit recording URL and transcript
- View mode displays recording link + formatted transcript
- Server action: `updateMeetingRecording()` in `app/tanjia/meetings/actions.ts`

### 8. Consistent "Client View" Terminology

All references to "Client-safe" have been replaced with "Client View" for clarity and professionalism:
- Sidebar navigation
- Button labels
- Documentation

### 9. Interaction Polish

**Sidebar enhancements**:
- Hover states: Subtle `bg-neutral-50` on items
- Selected state: Clear `bg-neutral-100` highlight
- Collapsible sections: Click chevron on "Zones" and "Work" headers
  - State persisted in localStorage as `tanjia_collapsed_sections`

**Keyboard shortcuts**:
- **Ctrl/Cmd+K**: Toggle command palette anywhere
- **Esc**: Close command palette
- **Arrow keys**: Navigate commands in palette
- **Enter**: Execute selected command

**Topbar channel header**:
- Title + one-line descriptor for context
- Route-based descriptions explain page purpose
- Search trigger is clickable and shows ⌘K hint

## Adding New Sections

To add a new tool or section to the workspace:

1. **Create your page** in `app/tanjia/your-section/page.tsx`
2. **Add to sidebar** in `app/tanjia/components/sidebar.tsx`:
   ```tsx
   {
     title: "Your Section Group",
     items: [
       { 
         name: "Your Tool", 
         href: "/tanjia/your-section", 
         icon: YourIcon,
         badge: optionalCount 
       },
     ],
   }
   ```
3. **Add page info** in `app/tanjia/components/topbar.tsx`:
   ```tsx
   const pageInfo: Record<string, { title: string; description: string }> = {
     // ...
     "/tanjia/your-section": { 
       title: "Your Tool", 
       description: "One-line explanation of what this page does." 
     },
   };
   ```
4. **Add to command palette** in `app/tanjia/components/command-palette.tsx`:
   ```tsx
   {
     id: "nav-your-section",
     label: "Your Tool",
     group: "Navigate",
     icon: YourIcon,
     action: () => navigate("/tanjia/your-section"),
     keywords: ["your", "tool", "keywords"],
   }
   ```

## Styling Guidelines

The workspace uses the existing Tanjia design system:
- **Background**: Gradient from `#f9fafb` via `#fdfcf8` to `#f6efe3`
- **Borders**: `border-neutral-200`
- **Active states**: `bg-neutral-100` with `text-neutral-900`
- **Hover states**: `bg-neutral-50` with slight border change
- **Primary actions**: `bg-emerald-600` (brand green)
- **Cards**: White background with subtle shadows
- **Typography**: Font weights and tracking match existing components
- **Icons**: 4-5px size with appropriate color (neutral-400/500/600)

## Navigation Flow

### Recommended User Paths:

1. **Start of day**: `/tanjia/today` → Review meetings, followups, metrics
2. **Quick capture**: Use Composer on Hub or Today
3. **During work**: 
   - Use sidebar to navigate between zones
   - Pin important items for quick access
   - Use Ctrl/Cmd+K for fast navigation
4. **End of day**: Check Today dashboard for completion status

### Zones:
- **Listen**: Capture conversation context
- **Clarify**: Process and understand
- **Map**: Research and explore relationships
- **Decide**: Prioritize and plan next steps
- **Support**: Generate drafts and materials

## Acceptance Criteria

✅ **Pinning works**: Pin a meeting/lead, refresh page, pin persists  
✅ **Recents update**: Navigate to items, sidebar shows last 5  
✅ **Command palette**: Ctrl/Cmd+K opens, search works, navigate/create actions work  
✅ **Composer**: Available on Hub and Today, text routes to destination pages  
✅ **Badges are stable**: Show correct counts (48h meetings, overdue followups, untriaged leads)  
✅ **No flicker**: Badges don't flash on refresh  
✅ **Topbar descriptors**: Each page shows title + one-line description  
✅ **Collapsible sections**: Zones and Work sections can collapse/expand  
✅ **Pin buttons**: Available on meeting and lead detail pages

### Work Items:
- **Leads**: Contact database with enrichment
- **Meetings**: Schedule, capture, generate results
- **Scheduler**: Share Cal.com availability
- **Followups**: Task tracking tied to leads

## API Endpoints

### Metrics
- **`GET /api/tanjia/metrics`**: Last 7 days activity (bookings, followups, messages)
- **`GET /api/tanjia/work-metrics`**: Work status (upcoming/in-progress meetings, overdue followups)

Both endpoints are owner-scoped (auth.uid()) and used by:
- Sidebar badges
- Today dashboard
- System overview

## Implementation Notes

### Why Slack-style?

The previous horizontal navigation made it easy to "lose" important features like Meetings and Scheduler. A persistent sidebar ensures:
- **Always visible** navigation
- **Logical grouping** of related features
- **Visual hierarchy** through sections
- **Live status** via badges
- **Room to grow** as new tools are added

### Migration from Old Layout

The old layout (`app/tanjia/layout.tsx`) used:
- Sticky top header with horizontal nav
- Brand + zone links in header
- Max-width centered content

New layout:
- Full-height sidebar (always visible)
- Topbar within main content area
- Wider canvas (max-w-7xl)
- No footer (moved to sidebar bottom)

All existing routes work without changes—they just render inside the new shell.

## Future Enhancements

Potential improvements:
- **Command palette** (⌘K) with fuzzy search
- **Recent items** section in sidebar
- **Pinned tools** customization
- **Sidebar collapse** on narrow screens
- **Keyboard shortcuts** for navigation
- **Notification center** in topbar
- **Real-time updates** for badges via WebSocket

## Troubleshooting

### Sidebar not showing
- Check that user is authenticated
- Verify `app/tanjia/layout.tsx` is using `<AppShell>`

### Badges not updating
- Check `/api/tanjia/metrics` and `/api/tanjia/work-metrics` endpoints
- Verify Supabase RLS policies allow owner access
- Check browser console for fetch errors

### Page title wrong
- Add route to `pageTitles` object in `topbar.tsx`

### Layout breaks on mobile
- Sidebar uses fixed width—consider adding responsive breakpoints
- May need collapse/drawer pattern for narrow screens

## Related Files

- `app/tanjia/components/app-shell.tsx` - Main layout wrapper
- `app/tanjia/components/sidebar.tsx` - Left navigation
- `app/tanjia/components/topbar.tsx` - Top context bar
- `app/tanjia/layout.tsx` - Layout integration
- `app/tanjia/today/page.tsx` - Today dashboard
- `app/tanjia/page.tsx` - Hub page
- `app/api/tanjia/work-metrics/route.ts` - Work metrics endpoint
- `app/tanjia/meetings/components/recording-section.tsx` - Meeting attachments
- `supabase/migrations/011_meeting_recordings.sql` - Recording schema
- `src/lib/utils.ts` - Utility functions (cn, etc.)

---

**Quiet Founder tone preserved**: The layout changes don't alter the product voice. All existing components (GradientHeading, HubCard, PageShell, etc.) continue to work. The workspace just provides better structure and discoverability.
