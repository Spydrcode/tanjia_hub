export function stripInternalMeta<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
  const internalKeys = new Set([
    "_meta",
    "model_used",
    "attempt_count",
    "escalation_reason",
    "toolsUsed",
    "traceId",
    "durationMs",
  ]);

  for (const key of Object.keys(clone)) {
    if (internalKeys.has(key)) {
      delete clone[key];
      continue;
    }
    const val = clone[key];
    if (val && typeof val === "object") {
      clone[key] = stripInternalMeta(val as any);
    }
  }
  return clone;
}
