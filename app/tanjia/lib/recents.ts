"use client";

export type RecentItem = {
  id: string;
  type: "lead" | "meeting" | "followup" | "zone" | "page";
  title: string;
  href: string;
  subtitle?: string;
  icon?: string;
  timestamp: number;
};

const STORAGE_KEY = "tanjia_recents";
const MAX_RECENTS = 8;

/**
 * Add an item to the recents list.
 * Automatically deduplicates and limits to MAX_RECENTS.
 */
export function addRecent(item: Omit<RecentItem, "timestamp">): void {
  if (typeof window === "undefined") return;

  const recents = getRecents();
  const newItem: RecentItem = {
    ...item,
    timestamp: Date.now(),
  };

  // Remove any existing item with the same href
  const filtered = recents.filter((r) => r.href !== item.href);

  // Add new item at the beginning
  const updated = [newItem, ...filtered].slice(0, MAX_RECENTS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Get the list of recent items, sorted by most recent first.
 */
export function getRecents(): RecentItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const recents = JSON.parse(stored) as RecentItem[];
    return recents.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to parse recents:", error);
    return [];
  }
}

/**
 * Clear all recents.
 */
export function clearRecents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Remove a specific recent item by href.
 */
export function removeRecent(href: string): void {
  if (typeof window === "undefined") return;

  const recents = getRecents();
  const filtered = recents.filter((r) => r.href !== href);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
