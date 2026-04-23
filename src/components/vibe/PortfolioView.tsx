import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, Linkedin, Twitter, Code2, ArrowUpRight, Mail } from "lucide-react";
import { PERSONAS, type Persona } from "@/lib/personas";

export interface PortfolioData {
  profile: {
    full_name: string | null;
    bio: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    leetcode_url: string | null;
  };
  pnarr: Record<Persona, { headline: string | null; summary: string | null; skills: string[] } | undefined>;
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    tech_stack: string[];
    github_link: string | null;
    live_demo_url: string | null;
    narratives: Record<Persona, string | undefined>;
  }>;
}

const transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

export function PortfolioView({ data, persona }: { data: PortfolioData; persona: Persona }) {
  const p = data.pnarr[persona];
  const meta = PERSONAS[persona];
  const initials = (data.profile.full_name || "You")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      {/* Persona-tinted ambient glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={persona + "-glow"}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={transition}
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -10%, hsl(${meta.accentVar} / 0.22), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, hsl(${meta.glowVar} / 0.12), transparent 60%)`,
          }}
        />
      </AnimatePresence>

      {/* HERO */}
      <section className="relative px-6 md:px-12 pt-16 md:pt-28 pb-20 md:pb-28 min-h-[85vh] flex flex-col justify-center">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full animate-pulse" style={{ background: `hsl(${meta.accentVar})` }} />
          Available · {meta.name}
        </div>

        <AnimatePresence mode="wait">
          <motion.h1
            key={persona + "-h1"}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={transition}
            className="font-display text-5xl md:text-7xl lg:text-8xl mt-6 leading-[0.95] tracking-tight"
          >
            {data.profile.full_name || "Your Name"}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={persona + "-headline"}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ ...transition, delay: 0.05 }}
            className="mt-6 text-xl md:text-3xl font-display max-w-3xl leading-snug"
            style={{ color: `hsl(${meta.accentVar})` }}
          >
            {p?.headline || meta.tagline}
          </motion.p>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {data.profile.github_url && <CtaPill icon={Github} url={data.profile.github_url} label="GitHub" />}
          {data.profile.linkedin_url && <CtaPill icon={Linkedin} url={data.profile.linkedin_url} label="LinkedIn" />}
          {data.profile.twitter_url && <CtaPill icon={Twitter} url={data.profile.twitter_url} label="Twitter" />}
          {data.profile.leetcode_url && <CtaPill icon={Code2} url={data.profile.leetcode_url} label="LeetCode" />}
        </div>

        <a href="#projects" className="mt-16 text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-2 w-fit">
          <span className="h-px w-8 bg-current" /> SCROLL TO WORK
        </a>
      </section>

      {/* ABOUT */}
      <section className="relative px-6 md:px-12 py-20 border-t border-border/60">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">01 — About</div>
            <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">A little about me.</h2>
            <div
              className="mt-6 size-20 rounded-2xl grid place-items-center font-display text-2xl"
              style={{ background: `linear-gradient(135deg, hsl(${meta.accentVar} / 0.9), hsl(${meta.glowVar} / 0.7))`, color: "hsl(var(--primary-foreground))" }}
            >
              {initials}
            </div>
          </div>
          <div className="md:col-span-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={persona + "-summary"}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={transition}
                className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line"
              >
                {p?.summary || data.profile.bio || "Add some links and a resume to generate your bio."}
              </motion.p>
            </AnimatePresence>

            {p?.skills && p.skills.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={persona + "-skills"}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8"
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Stack & Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {p.skills.slice(0, 20).map((s) => (
                      <span
                        key={s}
                        className="font-mono text-xs px-3 py-1.5 rounded-full border border-border bg-card/50"
                        style={{ borderColor: `hsl(${meta.accentVar} / 0.25)` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="relative px-6 md:px-12 py-20 border-t border-border/60">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">02 — Selected Work</div>
            <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">Things I&apos;ve built.</h2>
          </div>
          <div className="font-mono text-xs text-muted-foreground">{String(data.projects.length).padStart(2, "0")} projects</div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {data.projects.map((proj, i) => (
            <motion.a
              key={proj.id}
              href={proj.live_demo_url || proj.github_link || "#"}
              target={proj.live_demo_url || proj.github_link ? "_blank" : undefined}
              rel="noreferrer"
              layout
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-7 overflow-hidden transition-colors hover:border-primary/70 flex flex-col"
            >
              <div
                className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-3xl"
                style={{ background: `hsl(${meta.accentVar} / 0.35)` }}
              />

              <div className="flex items-start justify-between gap-3 relative">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Project · {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight">{proj.title}</h3>
                </div>
                <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={persona + proj.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed relative"
                >
                  {proj.narratives[persona] || proj.description || ""}
                </motion.p>
              </AnimatePresence>

              {proj.tech_stack?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5 relative">
                  {proj.tech_stack.slice(0, 8).map((t) => (
                    <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground relative">
                {proj.github_link && (
                  <span onClick={(e) => { e.stopPropagation(); window.open(proj.github_link!, "_blank"); }} className="inline-flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                    <Github className="size-3.5" /> Code
                  </span>
                )}
                {proj.live_demo_url && (
                  <span onClick={(e) => { e.stopPropagation(); window.open(proj.live_demo_url!, "_blank"); }} className="inline-flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                    <ExternalLink className="size-3.5" /> Live
                  </span>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="relative px-6 md:px-12 py-24 border-t border-border/60">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">03 — Contact</div>
        <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[1] tracking-tight max-w-4xl">
          Let&apos;s build <span style={{ color: `hsl(${meta.accentVar})` }}>something</span> together.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {data.profile.github_url && <CtaPill icon={Github} url={data.profile.github_url} label="GitHub" />}
          {data.profile.linkedin_url && <CtaPill icon={Linkedin} url={data.profile.linkedin_url} label="LinkedIn" />}
          {data.profile.twitter_url && <CtaPill icon={Twitter} url={data.profile.twitter_url} label="Twitter" />}
          {data.profile.leetcode_url && <CtaPill icon={Code2} url={data.profile.leetcode_url} label="LeetCode" />}
        </div>
      </section>
    </div>
  );
}

function CtaPill({ icon: Icon, url, label }: { icon: typeof Github; url: string; label: string }) {
  return (
    <a
      href={url} target="_blank" rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-2 text-sm hover:border-primary/70 hover:bg-card transition-all"
    >
      <Icon className="size-4" /> {label}
      <ArrowUpRight className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
}
