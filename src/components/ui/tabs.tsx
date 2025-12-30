import clsx from "clsx";
import React from "react";

type Tab = { id: string; label: string };

type TabsProps = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            activeId === tab.id
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
          )}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

