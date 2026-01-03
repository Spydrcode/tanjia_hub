"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ 
  children,
  onSignOut 
}: { 
  children: React.ReactNode;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#f9fafb] via-[#fdfcf8] to-[#f6efe3]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onSignOut={onSignOut} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Subtle background overlay */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.03),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.02),transparent_35%)]" />
    </div>
  );
}
