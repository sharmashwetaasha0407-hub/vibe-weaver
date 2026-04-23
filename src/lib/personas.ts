export type Persona = "architect" | "impact" | "visionary";

export const PERSONAS: Record<Persona, {
  id: Persona;
  name: string;
  tagline: string;
  description: string;
  accentVar: string; // hsl values
  glowVar: string;
}> = {
  architect: {
    id: "architect",
    name: "The Architect",
    tagline: "System design. Code quality. Depth.",
    description: "For technical reviewers — focuses on architecture, performance, and engineering rigor.",
    accentVar: "200 95% 60%",
    glowVar: "190 100% 70%",
  },
  impact: {
    id: "impact",
    name: "The Impact",
    tagline: "Results. People. STAR-shaped outcomes.",
    description: "For recruiters and HR — surfaces business impact, soft skills, and measurable wins.",
    accentVar: "150 70% 50%",
    glowVar: "160 90% 60%",
  },
  visionary: {
    id: "visionary",
    name: "The Visionary",
    tagline: "Speed. Vision. Product-market fit.",
    description: "For founders and investors — emphasizes velocity, originality, and craft.",
    accentVar: "20 95% 60%",
    glowVar: "330 95% 65%",
  },
};

export const ACCENTS: Record<string, { name: string; hsl: string; glow: string }> = {
  violet: { name: "Violet", hsl: "258 89% 66%", glow: "270 100% 75%" },
  cyan:   { name: "Cyan",   hsl: "190 95% 55%", glow: "180 100% 65%" },
  emerald:{ name: "Emerald",hsl: "152 70% 50%", glow: "160 90% 60%" },
  amber:  { name: "Amber",  hsl: "35 95% 58%",  glow: "20 95% 65%"  },
  pink:   { name: "Pink",   hsl: "330 90% 62%", glow: "320 100% 72%"},
};

export const FONT_PAIRS: Record<string, { name: string; display: string; body: string; mono: string }> = {
  "inter-jetbrains": { name: "Modern · Inter / Space Grotesk", display: "'Space Grotesk'", body: "'Inter'", mono: "'JetBrains Mono'" },
  "serif-manrope":   { name: "Editorial · DM Serif / Manrope", display: "'DM Serif Display'", body: "'Manrope'", mono: "'IBM Plex Mono'" },
  "mono-only":       { name: "Terminal · JetBrains Mono",      display: "'JetBrains Mono'", body: "'JetBrains Mono'", mono: "'JetBrains Mono'" },
};

export const THEMES = ["dark", "minimal", "creative"] as const;
export type Theme = (typeof THEMES)[number];
