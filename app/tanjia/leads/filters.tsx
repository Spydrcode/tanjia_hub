'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { useEffect, useState } from "react";

type Props = {
  status: string;
  snapshot: string;
  q: string;
};

const statusOptions = ["all", "new", "contacted", "active", "parked"];

export default function LeadsFilters({ status, snapshot, q }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const updateParams = (next: Record<string, string>) => {
    const newParams = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => newParams.set(key, value));
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ q: e.currentTarget.value, status, snapshot });
            }
          }}
          placeholder="Search by name or website"
          aria-label="Search leads"
        />
      </div>
      <Select
        value={status}
        onChange={(e) => updateParams({ q: search, status: e.target.value, snapshot })}
        aria-label="Filter by status"
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All statuses" : s}
          </option>
        ))}
      </Select>
      <Select
        value={snapshot}
        onChange={(e) => updateParams({ q: search, status, snapshot: e.target.value })}
        aria-label="Filter by snapshot"
      >
        <option value="any">Snapshot: any</option>
        <option value="yes">Snapshot: has</option>
        <option value="no">Snapshot: none</option>
      </Select>
    </div>
  );
}
