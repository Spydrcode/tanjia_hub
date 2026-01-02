const bannedPhrases = [
  "too thin",
  "unable to",
  "cannot determine",
  "insufficient data",
  "no data",
  "not enough data",
];

const replacements: Record<string, string> = {
  "too thin": "No explicit signal found on public pages yet.",
  "unable to": "No explicit signal found on public pages yet.",
  "cannot determine": "Here is what we can responsibly infer so far.",
  "insufficient data": "Signals are light on public pages so far.",
  "no data": "Signals are light on public pages so far.",
  "not enough data": "Signals are light on public pages so far.",
};

function applyRules(text: string) {
  let output = text;
  for (const phrase of bannedPhrases) {
    const re = new RegExp(phrase, "ig");
    if (re.test(output)) {
      output = output.replace(re, replacements[phrase]);
    }
  }
  return output
    .replace(/\bAI\b/gi, "")
    .replace(/\bscrap(?:e|ing)\b/gi, "read")
    .trim();
}

export function formatCalmCopy(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((v) => applyRules(v)).filter(Boolean);
  }
  return applyRules(value);
}

export function confidenceLabel(confidence: "high" | "medium" | "low" | undefined) {
  switch (confidence) {
    case "high":
      return "Strong signal";
    case "medium":
      return "Some signal";
    case "low":
    default:
      return "Light signal";
  }
}
