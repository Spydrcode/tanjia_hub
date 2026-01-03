"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Calendar, 
  Mic, 
  Map, 
  Flag,
  CheckCircle,
  LifeBuoy,
  Users,
  Video,
  Clock,
  Settings,
  Presentation,
  CalendarDays,
  Plus,
  UserPlus,
  Search,
  Pin,
  History
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getRecents, type RecentItem } from "../lib/recents";
import { getPins, type PinnedItem } from "../lib/pins";

type Command = {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
};

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [pins, setPins] = useState<PinnedItem[]>([]);

  // Load recents and pins
  useEffect(() => {
    if (isOpen) {
      setRecents(getRecents().slice(0, 5));
      setPins(getPins());
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  // Define static commands
  const staticCommands: Command[] = useMemo(
    () => [
      // Create
      {
        id: "create-lead",
        label: "New Lead",
        group: "Create",
        icon: UserPlus,
        action: () => navigate("/tanjia/leads?action=new"),
        keywords: ["lead", "contact", "person"],
      },
      {
        id: "create-meeting",
        label: "New Meeting",
        group: "Create",
        icon: Plus,
        action: () => navigate("/tanjia/meetings?action=new"),
        keywords: ["meeting", "call", "conversation"],
      },
      {
        id: "schedule-call",
        label: "Schedule Call",
        group: "Create",
        icon: Calendar,
        action: () => navigate("/tanjia/scheduler"),
        keywords: ["schedule", "book", "calendar"],
      },

      // Navigate - Workspace
      {
        id: "nav-hub",
        label: "Hub",
        group: "Navigate",
        icon: Home,
        action: () => navigate("/tanjia"),
        keywords: ["home", "hub", "start"],
      },
      {
        id: "nav-today",
        label: "Today",
        group: "Navigate",
        icon: CalendarDays,
        action: () => navigate("/tanjia/today"),
        keywords: ["today", "dashboard", "daily"],
      },

      // Navigate - Zones
      {
        id: "nav-listen",
        label: "Listen",
        group: "Navigate",
        icon: Mic,
        action: () => navigate("/tanjia/listen"),
        keywords: ["listen", "comments", "feedback"],
      },
      {
        id: "nav-clarify",
        label: "Clarify",
        group: "Navigate",
        icon: CheckCircle,
        action: () => navigate("/tanjia/clarify"),
        keywords: ["clarify", "understand"],
      },
      {
        id: "nav-map",
        label: "Map",
        group: "Navigate",
        icon: Map,
        action: () => navigate("/tanjia/map"),
        keywords: ["map", "research", "explore"],
      },
      {
        id: "nav-decide",
        label: "Decide",
        group: "Navigate",
        icon: Flag,
        action: () => navigate("/tanjia/decide"),
        keywords: ["decide", "queue", "next"],
      },
      {
        id: "nav-support",
        label: "Support",
        group: "Navigate",
        icon: LifeBuoy,
        action: () => navigate("/tanjia/support"),
        keywords: ["support", "help", "draft", "reply"],
      },

      // Navigate - Work
      {
        id: "nav-leads",
        label: "Leads",
        group: "Navigate",
        icon: Users,
        action: () => navigate("/tanjia/leads"),
        keywords: ["leads", "contacts", "people"],
      },
      {
        id: "nav-meetings",
        label: "Meetings",
        group: "Navigate",
        icon: Video,
        action: () => navigate("/tanjia/meetings"),
        keywords: ["meetings", "calls"],
      },
      {
        id: "nav-scheduler",
        label: "Scheduler",
        group: "Navigate",
        icon: Clock,
        action: () => navigate("/tanjia/scheduler"),
        keywords: ["scheduler", "bookings", "appointments"],
      },
      {
        id: "nav-followups",
        label: "Followups",
        group: "Navigate",
        icon: Flag,
        action: () => navigate("/tanjia/followups"),
        keywords: ["followups", "tasks", "reminders"],
      },

      // Navigate - System
      {
        id: "nav-system",
        label: "System Overview",
        group: "Navigate",
        icon: Settings,
        action: () => navigate("/tanjia/system"),
        keywords: ["system", "settings", "overview"],
      },
      {
        id: "nav-client-view",
        label: "Client View",
        group: "Navigate",
        icon: Presentation,
        action: () => navigate("/tanjia/share"),
        keywords: ["client", "share", "presentation"],
      },
    ],
    [navigate]
  );

  // Build commands from recents
  const recentCommands: Command[] = useMemo(
    () =>
      recents.map((item) => ({
        id: `recent-${item.id}`,
        label: item.title,
        group: "Recent",
        icon: History,
        action: () => navigate(item.href),
        keywords: [item.title.toLowerCase(), item.type],
      })),
    [recents, navigate]
  );

  // Build commands from pins
  const pinCommands: Command[] = useMemo(
    () =>
      pins.map((item) => ({
        id: `pin-${item.id}`,
        label: item.title,
        group: "Pinned",
        icon: Pin,
        action: () => navigate(item.href),
        keywords: [item.title.toLowerCase(), item.type],
      })),
    [pins, navigate]
  );

  // Combine all commands
  const allCommands = useMemo(
    () => [...pinCommands, ...recentCommands, ...staticCommands],
    [pinCommands, recentCommands, staticCommands]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands;
    }

    const searchTerms = query.toLowerCase().split(" ").filter(Boolean);
    return allCommands.filter((cmd) => {
      const searchableText = [
        cmd.label.toLowerCase(),
        cmd.group.toLowerCase(),
        ...(cmd.keywords || []),
      ].join(" ");

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [query, allCommands]);

  // Group filtered commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          selectedCommand.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border border-neutral-200 bg-white shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, or jump to..."
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
            autoFocus
          />
          <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono text-neutral-500">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([group, commands]) => (
              <div key={group} className="border-b border-neutral-100 last:border-0">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {group}
                </div>
                <div className="pb-2">
                  {commands.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition",
                          isSelected
                            ? "bg-emerald-50 text-emerald-900"
                            : "text-neutral-700 hover:bg-neutral-50"
                        )}
                      >
                        <cmd.icon className={cn("h-4 w-4", isSelected ? "text-emerald-600" : "text-neutral-400")} />
                        <span className="flex-1">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">↵</kbd>
              Select
            </span>
          </div>
          <span>Ctrl/Cmd+K to toggle</span>
        </div>
      </div>
    </>
  );
}
