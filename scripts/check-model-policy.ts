import { shouldEscalate, pickInitialModel, escalatedModel, clampAttempts } from "@/src/lib/agents/model-policy";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exitCode = 1;
  } else {
    console.log("PASS:", message);
  }
}

function main() {
  console.log("Model defaults:", pickInitialModel(), escalatedModel(), "maxAttempts", clampAttempts(2));

  // comment reply short should not escalate
  let res = shouldEscalate(
    { taskName: "comment_reply", hasTools: false, inputLength: 120 },
    { validationOk: true, content: "ok", errorMessage: undefined, toolCalls: 0 },
  );
  assert(!res.escalate, "Comment reply short does not escalate");

  // followup plan valid schema should not escalate
  res = shouldEscalate(
    { taskName: "followup_plan", hasTools: false, inputLength: 200 },
    { validationOk: true, content: "{}", errorMessage: undefined, toolCalls: 0 },
  );
  assert(!res.escalate, "Followup plan valid does not escalate");

  // tool error should escalate
  res = shouldEscalate(
    { taskName: "dm_reply", hasTools: true, inputLength: 200 },
    { validationOk: false, content: "", errorMessage: "tool missing name", toolCalls: 0 },
  );
  assert(res.escalate, "Tool error escalates");

  // long emyth can escalate
  res = shouldEscalate(
    { taskName: "emyth_role_map", hasTools: false, inputLength: 1500 },
    { validationOk: true, content: "{}", errorMessage: undefined, toolCalls: 0 },
  );
  assert(res.escalate, "Long emyth may escalate");
}

main();
