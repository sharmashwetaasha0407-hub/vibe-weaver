import { ACCENTS, FONT_PAIRS, type Theme } from "./personas";

export function applyTheme(opts: { theme: Theme; accent: keyof typeof ACCENTS; fontPair: keyof typeof FONT_PAIRS; }) {
  const root = document.documentElement;
  root.classList.remove("theme-minimal", "theme-creative");
  if (opts.theme === "minimal") root.classList.add("theme-minimal");
  if (opts.theme === "creative") root.classList.add("theme-creative");

  const a = ACCENTS[opts.accent] ?? ACCENTS.violet;
  root.style.setProperty("--primary", a.hsl);
  root.style.setProperty("--primary-glow", a.glow);
  root.style.setProperty("--accent", a.hsl);
  root.style.setProperty("--ring", a.hsl);

  const f = FONT_PAIRS[opts.fontPair] ?? FONT_PAIRS["inter-jetbrains"];
  root.style.setProperty("--font-display", f.display);
  root.style.setProperty("--font-body", f.body);
  root.style.setProperty("--font-mono", f.mono);
}
