export const brandGradients = {
  accentA: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  accentB: "from-blue-500/20 via-blue-400/10 to-transparent",
  surface: "from-neutral-50 to-white",
};

export const brandTextGradients = {
  anchor: "from-emerald-400 via-cyan-400 to-blue-500",
  calm: "from-neutral-900 via-neutral-800 to-neutral-700",
};

export function gradientBg(type: keyof typeof brandGradients) {
  return `bg-gradient-to-br ${brandGradients[type]}`;
}

export function gradientText(type: keyof typeof brandTextGradients = "anchor") {
  return `bg-gradient-to-r ${brandTextGradients[type]} bg-clip-text text-transparent`;
}
