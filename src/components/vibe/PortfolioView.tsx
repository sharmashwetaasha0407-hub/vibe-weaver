import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, Linkedin, Twitter, Code2 } from "lucide-react";
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

  return (
    <div className="relative">
      {/* Persona-tinted ambient glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={persona + "-glow"}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={transition}
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse at top, hsl(${meta.accentVar} / 0.18), transparent 60%)`,
          }}
        />
      </AnimatePresence>

      {/* Hero */}
      <div className="px-6 md:px-10 pt-10 md:pt-16 pb-10">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: `hsl(${meta.accentVar})` }}
          />
          {meta.name.toUpperCase()}
        </div>

        <AnimatePresence mode="wait">
          <motion.h1
            key={persona + "-h1"}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={transition}
            className="font-display text-3xl md:text-5xl mt-3 leading-tight"
          >
            {data.profile.full_name || "Your name"}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={persona + "-headline"}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={transition}
            className="mt-3 text-lg md:text-xl"
            style={{ color: `hsl(${meta.accentVar})` }}
          >
            {p?.headline || meta.tagline}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={persona + "-summary"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={transition}
            className="mt-5 text-muted-foreground max-w-2xl whitespace-pre-line"
          >
            {p?.summary || data.profile.bio || "Add some links and a resume to generate your bio."}
          </motion.p>
        </AnimatePresence>

        {/* Socials */}
        <div className="mt-6 flex flex-wrap gap-2">
          {data.profile.github_url && <SocialPill icon={Github} url={data.profile.github_url} label="GitHub" />}
          {data.profile.linkedin_url && <SocialPill icon={Linkedin} url={data.profile.linkedin_url} label="LinkedIn" />}
          {data.profile.twitter_url && <SocialPill icon={Twitter} url={data.profile.twitter_url} label="Twitter" />}
          {data.profile.leetcode_url && <SocialPill icon={Code2} url={data.profile.leetcode_url} label="LeetCode" />}
        </div>

        {/* Skills */}
        {p?.skills && p.skills.length > 0 && (
          <motion.div
            key={persona + "-skills"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            className="mt-6 flex flex-wrap gap-1.5"
          >
            {p.skills.slice(0, 16).map((s) => (
              <span key={s} className="font-mono text-[11px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                {s}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Projects */}
      <div className="px-6 md:px-10 pb-16">
        <div className="font-mono text-xs text-muted-foreground mb-3">PROJECTS · {data.projects.length}</div>
        <div className="grid md:grid-cols-2 gap-4">
          {data.projects.map((proj, i) => (
            <motion.div
              key={proj.id}
              layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg">{proj.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {proj.github_link && (
                    <a href={proj.github_link} target="_blank" rel="noreferrer" aria-label="GitHub">
                      <Github className="size-4 hover:text-foreground" />
                    </a>
                  )}
                  {proj.live_demo_url && (
                    <a href={proj.live_demo_url} target="_blank" rel="noreferrer" aria-label="Live demo">
                      <ExternalLink className="size-4 hover:text-foreground" />
                    </a>
                  )}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={persona + proj.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-muted-foreground mt-2"
                >
                  {proj.narratives[persona] || proj.description || ""}
                </motion.p>
              </AnimatePresence>
              {proj.tech_stack?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {proj.tech_stack.slice(0, 8).map((t) => (
                    <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialPill({ icon: Icon, url, label }: { icon: typeof Github; url: string; label: string }) {
  return (
    <a
      href={url} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs hover:bg-secondary transition-colors"
    >
      <Icon className="size-3.5" /> {label}
    </a>
  );
}
