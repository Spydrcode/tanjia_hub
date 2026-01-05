"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CommandPalette } from "./command-palette";
import { useState, useEffect } from "react";

const demoRouteAllowlist = [
  "/today",
  "/leads",
  "/meetings",
  "/followups",
  "/support",
  "/groups",
  "/referrals",
  "/scheduler",
  "/decide",
];

const pageInfo: Record<string, { title: string; description: string }> = {
  "/tanjia": { 
    title: "Hub", 
    description: "A calm workspace to capture, clarify, and move one thing forward." 
  },
  "/tanjia/today": { 
    title: "Today", 
    description: "What needs attention in the next 24 hours." 
  },
  "/tanjia/listen": { 
    title: "Listen", 
    description: "See what people have said and find your next step." 
  },
  "/tanjia/clarify": { 
    title: "Clarify", 
    description: "Understand the signal before taking action." 
  },
  "/tanjia/map": { 
    title: "Map", 
    description: "Research people and companies before reaching out." 
  },
  "/tanjia/decide": { 
    title: "Decide", 
    description: "View your queue and pick one move." 
  },
  "/tanjia/support": { 
    title: "Support", 
    description: "Draft replies, intros, and check-ins without pressure." 
  },
  "/tanjia/leads": { 
    title: "Leads", 
    description: "Track conversations and next steps with contacts." 
  },
  "/tanjia/meetings": { 
    title: "Meetings", 
    description: "Prepare, run, and recap conversations." 
  },
  "/tanjia/scheduler": { 
    title: "Scheduler", 
    description: "Set meetings without losing the thread." 
  },
  "/tanjia/followups": { 
    title: "Followups", 
    description: "Keep threads moving without pressure." 
  },
  "/tanjia/tools": { 
    title: "Tools", 
    description: "Utilities and helpers for your work." 
  },
  "/tanjia/system": { 
    title: "System Overview", 
    description: "Monitor health and performance across the platform." 
  },
  "/tanjia/share": { 
    title: "Client View", 
    description: "A clean view of your work to share with others." 
  },
  "/tanjia/present": { 
    title: "Presentation", 
    description: "Full-screen presentations for meetings." 
  },
  "/tanjia/system-overview": { 
    title: "System Overview", 
    description: "Monitor health and performance across the platform." 
  },
};

export function Topbar({ onSignOut }: { onSignOut?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const isDemo = Boolean(pathname?.startsWith("/demo"));
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);

  // Get page info
  const getPageInfo = () => {
    // Try exact match first
    if (pageInfo[pathname || ""]) {
      return pageInfo[pathname || ""];
    }
    // Try prefix match
    const matchingKey = Object.keys(pageInfo).find((key) => pathname?.startsWith(key));
    return matchingKey ? pageInfo[matchingKey] : { title: "2ndmynd Hub", description: "" };
  };

  const currentPage = getPageInfo();
  const demoPathname = (path: string) => path.replace(/^\/demo/, "") || "/";
  const isDemoRouteAllowed = (path: string) => {
    const candidate = demoPathname(path);
    return demoRouteAllowlist.some((route) => candidate === route || candidate.startsWith(`${route}/`));
  };
  const getSwitchTarget = () => {
    const currentPath = pathname || "/";
    const target = isDemo
      ? currentPath.replace(/^\/demo/, "/tanjia")
      : currentPath.replace(/^\/tanjia/, "/demo");

    if (!isDemo && isDemoRouteAllowed(target)) return target;
    if (!isDemo && !isDemoRouteAllowed(target)) return "/demo/today";
    if (!target.startsWith("/tanjia")) return "/tanjia/today";
    return target;
  };

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResetDemo = async () => {
    if (!confirm("Reset demo data? This will restore demo content for your workspace.")) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      alert("Demo reset complete");
      // reload to show new data
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Demo reset failed");
    } finally {
      setIsResetting(false);
      setIsDemoMenuOpen(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 flex-col justify-center gap-1 px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Page Title + Description */}
            <div className="flex-1 overflow-hidden">
              <h1 className="text-lg font-semibold text-neutral-900">{currentPage.title}</h1>
              {currentPage.description && (
                <p className="truncate text-xs text-neutral-500">{currentPage.description}</p>
              )}
            </div>

            {/* Center: Search (triggers command palette) */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              data-testid="topbar-search"
              className="flex min-w-[300px] items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Search className="h-4 w-4" />
              <span>Search or run command...</span>
              <kbd className="ml-auto rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-600">
                ⌘K
              </kbd>
            </button>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mode pill: show DEMO when path starts with /demo */}
              {pathname?.startsWith('/demo') ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800" data-testid="topbar-mode-pill">DEMO</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDemoMenuOpen((open) => !open)}
                      data-testid="topbar-demo-menu"
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      aria-label="Demo actions"
                    >
                      ...
                    </button>
                    {isDemoMenuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          disabled={isResetting}
                          onClick={handleResetDemo}
                          data-testid="topbar-reset-demo"
                          className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
                        >
                          {isResetting ? "Resetting..." : "Reset demo data"}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(getSwitchTarget())}
                    data-testid="topbar-switch-mode"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Switch to Director
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800" data-testid="topbar-mode-pill">DIRECTOR</span>
                  <button
                    onClick={() => router.push(getSwitchTarget())}
                    data-testid="topbar-switch-mode"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Switch to Demo
                  </button>
                </div>
              )}

              {onSignOut && (
                <Button variant="ghost" size="sm" onClick={onSignOut}>
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
}

