import { serverEnv } from "@/src/lib/env";

export type ModelTier = "mini" | "standard";

export type EscalationReason =
  | "validation_failed"
  | "tools_needed_failed"
  | "long_input"
  | "analysis_requested"
  | "thin_signals"
  | "postprocess_loss"
  | "schema_fail";

export type PolicyContext = {
  taskName?: string;
  hasTools?: boolean;
  inputLength?: number;
  schemaName?: string;
  mode?: "prospecting" | "meeting" | "client" | "onsite";
  userText?: string;
  priorAttempt?: number;
  requestBudget?: { escalationsUsed: number; escalationsMax: number };
  complexityHint?: boolean;
};

const envEnabled = (serverEnv.MODEL_ESCALATION_ENABLED ?? "true").toLowerCase() !== "false";
const envDefault = serverEnv.MODEL_DEFAULT || "gpt-4o-mini";
const envEscalated = serverEnv.MODEL_ESCALATED || "gpt-4o";
const envMaxAttempts = Number.parseInt(serverEnv.MODEL_ESCALATION_MAX_ATTEMPTS || "2", 10);
const envBudget = Number.parseInt(serverEnv.MODEL_ESCALATION_MINI_BUDGET || "0", 10);

export function pickInitialModel(_ctx?: PolicyContext): string {
  return envDefault;
}

export function escalatedModel(): string {
  return envEscalated;
}

export function clampAttempts(n: number): number {
  return envEnabled ? Math.min(Math.max(n, 1), Number.isFinite(envMaxAttempts) && envMaxAttempts > 0 ? envMaxAttempts : 2) : 1;
}

export function shouldEscalate(
  ctx: PolicyContext | undefined,
  opts: { validationOk: boolean; content?: string; errorMessage?: string; toolCalls?: number },
): { escalate: boolean; reason?: EscalationReason } {
  if (!envEnabled) return { escalate: false };

  const inputLength = ctx?.inputLength ?? 0;
  const noEscalateTasks = new Set(["comment_reply", "dm_reply"]);

  if (!opts.validationOk) {
    if (ctx?.hasTools) return { escalate: true, reason: "tools_needed_failed" };
    return { escalate: true, reason: "validation_failed" };
  }

  if (opts.errorMessage && /tool|schema|missing required parameter|tool_call/i.test(opts.errorMessage)) {
    return { escalate: true, reason: "schema_fail" };
  }

  if (ctx?.hasTools && (opts.toolCalls ?? 0) === 0 && !opts.validationOk) {
    return { escalate: true, reason: "tools_needed_failed" };
  }

  if (!noEscalateTasks.has(ctx?.taskName || "") && inputLength > 1200) {
    if (ctx?.taskName && ["emyth_role_map", "emyth_on_vs_in", "orchestrator"].includes(ctx.taskName)) {
      return { escalate: true, reason: "long_input" };
    }
  }

  if (ctx?.complexityHint && ctx.taskName && ["emyth_role_map", "emyth_on_vs_in", "orchestrator"].includes(ctx.taskName)) {
    return { escalate: true, reason: "analysis_requested" };
  }

  if (ctx?.taskName && ["emyth_role_map", "emyth_on_vs_in"].includes(ctx.taskName)) {
    const content = opts.content || "";
    if (content.length < 120 || /\"roles\"\\s*:\\s*\\[\\s*\\]/i.test(content)) {
      return { escalate: true, reason: "thin_signals" };
    }
  }

  return { escalate: false };
}

export function escalationEnabled() {
  return envEnabled;
}

export function escalationBudgetLimit(): number {
  return Number.isFinite(envBudget) && envBudget > 0 ? envBudget : 0;
}
