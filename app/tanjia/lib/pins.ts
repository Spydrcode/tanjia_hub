"use client";

export type PinnedItem = {
  id: string;
  type: "lead" | "meeting" | "followup" | "zone" | "page";
  title: string;
  href: string;
  subtitle?: string;
  icon?: string;
};

const STORAGE_KEY = "tanjia_pins";

/**
 * Get all pinned items.
 */
export function getPins(): PinnedItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored) as PinnedItem[];
  } catch (error) {
    console.error("Failed to parse pins:", error);
    return [];
  }
}

/**
 * Check if an item is pinned.
 */
export function isPinned(href: string): boolean {
  const pins = getPins();
  return pins.some((p) => p.href === href);
}

/**
 * Toggle pin status of an item.
 * If pinned, unpin it. If not pinned, pin it.
 */
export function togglePin(item: PinnedItem): void {
  if (typeof window === "undefined") return;

  const pins = getPins();
  const existing = pins.findIndex((p) => p.href === item.href);

  let updated: PinnedItem[];
  if (existing >= 0) {
    // Unpin
    updated = pins.filter((p) => p.href !== item.href);
  } else {
    // Pin
    updated = [...pins, item];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Pin an item (add if not already pinned).
 */
export function addPin(item: PinnedItem): void {
  if (typeof window === "undefined") return;

  const pins = getPins();
  const existing = pins.find((p) => p.href === item.href);

  if (!existing) {
    const updated = [...pins, item];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

/**
 * Unpin an item (remove if pinned).
 */
export function removePin(href: string): void {
  if (typeof window === "undefined") return;

  const pins = getPins();
  const updated = pins.filter((p) => p.href !== href);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clear all pins.
 */
export function clearPins(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
