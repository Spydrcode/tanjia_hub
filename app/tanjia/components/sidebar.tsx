"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  Mic, 
  Map, 
  CheckCircle,
  LifeBuoy,
  Users,
  Video,
  Clock,
  Flag,
  Settings,
  Presentation,
  Plus,
  UserPlus,
  CalendarDays,
  Pin,
  X,
  History,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useEffect, useState } from "react";
import { addRecent } from "../lib/recents";
import { getPins, removePin, type PinnedItem } from "../lib/pins";
import { getRecents, type RecentItem } from "../lib/recents";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export function Sidebar() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<{
    upcomingMeetings: number;
    overdueFollowups: number;
    newBookings: number;
    untriagedLeads: number;
  }>({ upcomingMeetings: 0, overdueFollowups: 0, newBookings: 0, untriagedLeads: 0 });
  const [pins, setPins] = useState<PinnedItem[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tanjia_collapsed_sections");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Load pins and recents
  useEffect(() => {
    setPins(getPins());
    setRecents(getRecents().slice(0, 5));

    // Listen for storage changes to sync across tabs
    const handleStorageChange = () => {
      setPins(getPins());
      setRecents(getRecents().slice(0, 5));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Refresh metrics periodically
  useEffect(() => {
    const fetchMetrics = () => {
      Promise.all([
        fetch("/api/tanjia/metrics").then((r) => r.json()),
        fetch("/api/tanjia/work-metrics").then((r) => r.json()),
      ])
        .then(([metricsData, workData]) => {
          setMetrics({
            upcomingMeetings: workData.upcomingMeetings || 0,
            overdueFollowups: workData.overdueFollowups || 0,
            newBookings: metricsData.current?.bookings?.unmatchedCount || 0,
            untriagedLeads: workData.untriagedLeads || 0,
          });
        })
        .catch(console.error);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section: string) => {
    const updated = { ...collapsedSections, [section]: !collapsedSections[section] };
    setCollapsedSections(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("tanjia_collapsed_sections", JSON.stringify(updated));
    }
  };

  const handleNavClick = (item: NavItem) => {
    // Track in recents (skip Hub/Today unless nothing else exists)
    const skipRecents = ["/tanjia", "/tanjia/today", "/tanjia/system", "/tanjia/share"];
    const shouldTrack = !skipRecents.includes(item.href) || recents.length === 0;

    if (shouldTrack) {
      addRecent({
        id: item.href,
        type: "page",
        title: item.name,
        href: item.href,
        icon: item.icon.name,
      });
      // Refresh recents immediately
      setRecents(getRecents().slice(0, 5));
    }
  };

  const handleUnpin = (href: string) => {
    removePin(href);
    setPins(getPins());
  };

  const sections: NavSection[] = [
    {
      title: "Workspace",
      items: [
        { name: "Hub", href: "/tanjia", icon: Home, exact: true },
        { name: "Today", href: "/tanjia/today", icon: CalendarDays },
      ],
    },
    {
      title: "Zones",
      items: [
        { name: "Listen", href: "/tanjia/listen", icon: Mic },
        { name: "Clarify", href: "/tanjia/clarify", icon: CheckCircle },
        { name: "Map", href: "/tanjia/map", icon: Map },
        { name: "Decide", href: "/tanjia/decide", icon: Flag },
        { name: "Support", href: "/tanjia/support", icon: LifeBuoy },
      ],
    },
    {
      title: "Work",
      items: [
        { name: "Leads", href: "/tanjia/leads", icon: Users, badge: metrics.untriagedLeads || metrics.newBookings },
        { name: "Meetings", href: "/tanjia/meetings", icon: Video, badge: metrics.upcomingMeetings },
        { name: "Scheduler", href: "/tanjia/scheduler", icon: Clock },
        { name: "Followups", href: "/tanjia/followups", icon: Flag, badge: metrics.overdueFollowups },
      ],
    },
    {
      title: "System",
      items: [
        { name: "System Overview", href: "/tanjia/system", icon: Settings },
        { name: "Client View", href: "/tanjia/share", icon: Presentation },
      ],
    },
  ];

  const quickActions = [
    { name: "New Lead", icon: UserPlus, href: "/tanjia/leads?action=new" },
    { name: "New Meeting", icon: Plus, href: "/tanjia/meetings?action=new" },
    { name: "Schedule Call", icon: Calendar, href: "/tanjia/scheduler" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      {/* Brand */}
      <div className="border-b border-neutral-200 px-4 py-4">
        <Link
          href="/tanjia"
          className="block rounded-lg bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-90"
        >
          2ndmynd Hub
        </Link>
        <p className="mt-1.5 text-center text-[10px] text-neutral-400 tracking-wide">
          Listen → Clarify → Map → Decide → Support
        </p>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-neutral-200 px-3 py-3">
        <div className="space-y-1">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <action.icon className="h-4 w-4" />
              {action.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {/* Pinned Section */}
          {pins.length > 0 && (
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Pinned
              </h3>
              <div className="space-y-1">
                {pins.map((item) => (
                  <div
                    key={item.href}
                    className="group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <Link href={item.href} className="flex flex-1 items-center gap-3 overflow-hidden">
                      <Pin className="h-4 w-4 flex-shrink-0 text-neutral-500" />
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate font-medium text-neutral-900">{item.title}</div>
                        {item.subtitle && (
                          <div className="truncate text-xs text-neutral-500">{item.subtitle}</div>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleUnpin(item.href)}
                      className="flex-shrink-0 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                      title="Unpin"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recents Section */}
          {recents.length > 0 && (
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Recent
              </h3>
              <div className="space-y-1">
                {recents.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <History className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium text-neutral-700">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-neutral-500">{item.subtitle}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.title] || false;
            const isCollapsible = section.title === "Zones" || section.title === "Work";

            return (
              <div key={section.title}>
                <div className="mb-2 flex items-center justify-between px-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {section.title}
                  </h3>
                  {isCollapsible && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => handleNavClick(item)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                            active
                              ? "bg-neutral-100 text-neutral-900"
                              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("h-5 w-5", active ? "text-neutral-900" : "text-neutral-500")} />
                            <span>{item.name}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200 px-4 py-3">
        <p className="text-center text-xs text-neutral-400">
          <Link href="https://2ndmynd.com" className="hover:text-neutral-600" target="_blank" rel="noreferrer">
            2ndmynd
          </Link>
        </p>
      </div>
    </aside>
  );
}
