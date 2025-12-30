export const brandGradients = {
  accentA: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  accentB: "from-blue-500/20 via-blue-400/10 to-transparent",
  surface: "from-neutral-50 to-white",
};

export function gradientBg(type: keyof typeof brandGradients) {
  return `bg-gradient-to-br ${brandGradients[type]}`;
}
