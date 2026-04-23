import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Code2, Target, Rocket, ArrowRight, Github, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme } from "@/lib/applyTheme";

const Index = () => {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    applyTheme({ theme: "dark", accent: "violet", fontPair: "inter-jetbrains" });
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const personas = [
    { icon: Code2, name: "The Architect", line: "System design, code quality, depth.", hsl: "200 95% 60%" },
    { icon: Target, name: "The Impact",   line: "Outcomes, STAR results, soft skills.", hsl: "152 70% 50%" },
    { icon: Rocket, name: "The Visionary",line: "Speed, taste, founder energy.",        hsl: "20 95% 60%" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-body relative overflow-hidden">
      {/* Hero gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <div className="size-7 rounded-md bg-gradient-primary shadow-glow" />
          VibeVault
        </Link>
        <div className="flex items-center gap-2">
          {hasSession ? (
            <Button onClick={() => navigate("/dashboard")} variant="default">Open dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button onClick={() => navigate("/auth")}>Get started</Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-10">
        <section className="max-w-5xl mx-auto pt-16 md:pt-28 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-mono text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            One profile. Three vibes. Infinite reads.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display mt-6 text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight"
          >
            The portfolio that <span className="text-gradient">morphs</span><br/>
            to whoever's reading it.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Drop in your GitHub, LinkedIn and resume. VibeVault uses AI to generate three voices —
            Architect, Impact, Visionary — and lets your reader pick the one that fits them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-9 flex items-center justify-center gap-3 flex-wrap"
          >
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-glow">
              Build my VibeVault <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              See an example
            </Button>
          </motion.div>

          {/* Persona triptych */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
            className="mt-20 grid md:grid-cols-3 gap-4"
          >
            {personas.map((p) => (
              <motion.div
                key={p.name}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6 }}
                className="glass rounded-2xl p-6 text-left"
                style={{ boxShadow: `0 0 60px -20px hsl(${p.hsl} / 0.45)` }}
              >
                <div
                  className="size-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `hsl(${p.hsl} / 0.15)`, color: `hsl(${p.hsl})` }}
                >
                  <p.icon className="size-5" />
                </div>
                <div className="font-display text-lg">{p.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{p.line}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <footer className="max-w-5xl mx-auto py-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
          <span>© {new Date().getFullYear()} VibeVault</span>
          <span className="flex items-center gap-3">
            <Github className="size-4" /> <Linkedin className="size-4" />
          </span>
        </footer>
      </main>
    </div>
  );
};

export default Index;
