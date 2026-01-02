'use client';

import { useState, useEffect } from "react";
import type { DirectorSnapshot } from "@/src/lib/tanjia/director-metrics";

export function useDirectorSnapshot() {
  const [snapshot, setSnapshot] = useState<DirectorSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSnapshot() {
      try {
        const response = await fetch("/api/tanjia/director-snapshot");
        if (!response.ok) {
          throw new Error("Failed to fetch director snapshot");
        }
        const data = await response.json();
        setSnapshot(data.snapshot);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSnapshot();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tanjia/director-snapshot");
      if (!response.ok) {
        throw new Error("Failed to fetch director snapshot");
      }
      const data = await response.json();
      setSnapshot(data.snapshot);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { snapshot, loading, error, refresh };
}
