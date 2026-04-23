import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { ACCENTS, FONT_PAIRS, PERSONAS, THEMES, type Persona, type Theme } from "@/lib/personas";
import { applyTheme } from "@/lib/applyTheme";
import { PersonaSwitcher } from "@/components/vibe/PersonaSwitcher";
import { PortfolioView, type PortfolioData } from "@/components/vibe/PortfolioView";
import { LogOut, Settings2, Sparkles, Globe2, Copy, Loader2, RefreshCw } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("architect");
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<keyof typeof ACCENTS>("violet");
  const [fontPair, setFontPair] = useState<keyof typeof FONT_PAIRS>("inter-jetbrains");
  const [isPublished, setIsPublished] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    applyTheme({ theme, accent, fontPair });
  }, [theme, accent, fontPair]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { navigate("/auth", { replace: true }); return; }
    const uid = sess.session.user.id;

    const [{ data: profile }, { data: pnarr }, { data: projects }, { data: narratives }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("profile_narratives").select("*").eq("user_id", uid),
      supabase.from("projects").select("*").eq("user_id", uid).order("position"),
      supabase.from("vibe_narratives").select("*").eq("user_id", uid),
    ]);

    if (!profile) { navigate("/onboarding", { replace: true }); return; }

    setProfileId(profile.id);
    setIsPublished(!!profile.is_published);
    setPersona((profile.active_persona as Persona) ?? "architect");
    setTheme((profile.theme as Theme) ?? "dark");
    setAccent((profile.accent as keyof typeof ACCENTS) ?? "violet");
    setFontPair((profile.font_pair as keyof typeof FONT_PAIRS) ?? "inter-jetbrains");

    const pmap: PortfolioData["pnarr"] = { architect: undefined, impact: undefined, visionary: undefined };
    (pnarr ?? []).forEach((r) => { pmap[r.persona as Persona] = { headline: r.headline, summary: r.summary, skills: r.skills ?? [] }; });

    const projWithNarr = (projects ?? []).map((p) => {
      const ns: Record<Persona, string | undefined> = { architect: undefined, impact: undefined, visionary: undefined };
      (narratives ?? []).filter((n) => n.project_id === p.id).forEach((n) => { ns[n.persona as Persona] = n.content_text; });
      return {
        id: p.id, title: p.title, description: p.description,
        tech_stack: p.tech_stack ?? [], github_link: p.github_link, live_demo_url: p.live_demo_url,
        narratives: ns,
      };
    });

    setData({
      profile: {
        full_name: profile.full_name, bio: profile.bio,
        github_url: profile.github_url, linkedin_url: profile.linkedin_url,
        twitter_url: profile.twitter_url, leetcode_url: profile.leetcode_url,
      },
      pnarr: pmap,
      projects: projWithNarr,
    });
    setLoading(false);
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  // Persist customization
  useEffect(() => {
    if (!profileId) return;
    const t = setTimeout(() => {
      void supabase.from("profiles").update({
        active_persona: persona, theme, accent, font_pair: fontPair,
      }).eq("id", profileId);
    }, 400);
    return () => clearTimeout(t);
  }, [persona, theme, accent, fontPair, profileId]);

  const publicUrl = useMemo(() => profileId ? `${window.location.origin}/p/${profileId}` : "", [profileId]);

  const togglePublish = async () => {
    if (!profileId) return;
    const next = !isPublished;
    setIsPublished(next);
    const { error } = await supabase.from("profiles").update({ is_published: next }).eq("id", profileId);
    if (error) { setIsPublished(!next); toast({ title: "Couldn't update", description: error.message, variant: "destructive" }); return; }
    toast({ title: next ? "🌍 Published" : "Unpublished", description: next ? "Your portfolio is live." : "Now hidden from the public." });
  };

  const copy = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Link copied" });
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate("/", { replace: true }); };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", session!.user.id).single();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-vibes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({
          full_name: profile?.full_name, github_url: profile?.github_url, linkedin_url: profile?.linkedin_url,
          leetcode_url: profile?.leetcode_url, twitter_url: profile?.twitter_url, resume_text: "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast({ title: "Regenerated", description: "Fresh vibes incoming." });
      await load();
    } catch (e) {
      toast({ title: "Couldn't regenerate", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally { setRegenerating(false); }
  };

  if (loading || !data) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-gradient-primary shadow-glow" />
            <span className="font-display font-semibold">VibeVault</span>
            <span className="hidden md:inline text-xs text-muted-foreground ml-2">/ Live preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
              {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              <span className="hidden sm:inline ml-1.5">Regenerate</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm"><Settings2 className="size-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Customize</span></Button>
              </SheetTrigger>
              <SheetContent className="w-[320px] sm:w-[360px]">
                <SheetHeader><SheetTitle className="font-display">Customize</SheetTitle></SheetHeader>

                <div className="mt-6 space-y-6">
                  <Section title="Theme">
                    <div className="grid grid-cols-3 gap-2">
                      {THEMES.map((t) => (
                        <button key={t} onClick={() => setTheme(t)}
                          className={`rounded-lg border p-3 text-xs capitalize transition-colors ${theme === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Accent">
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((k) => (
                        <button key={k} onClick={() => setAccent(k)}
                          className={`size-8 rounded-full border-2 transition-transform ${accent === k ? "scale-110 border-foreground" : "border-transparent"}`}
                          style={{ background: `hsl(${ACCENTS[k].hsl})` }}
                          aria-label={ACCENTS[k].name}
                        />
                      ))}
                    </div>
                  </Section>

                  <Section title="Font pairing">
                    <div className="space-y-2">
                      {(Object.keys(FONT_PAIRS) as (keyof typeof FONT_PAIRS)[]).map((k) => (
                        <button key={k} onClick={() => setFontPair(k)}
                          className={`w-full text-left rounded-lg border p-3 transition-colors ${fontPair === k ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                        >
                          <div className="text-sm">{FONT_PAIRS[k].name}</div>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                    <LogOut className="size-4 mr-2" /> Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button size="sm" onClick={togglePublish} className={isPublished ? "" : "shadow-glow"}>
              <Globe2 className="size-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{isPublished ? "Published" : "Deploy"}</span>
            </Button>
          </div>
        </div>

        {isPublished && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="border-t border-border bg-secondary/40"
          >
            <div className="px-4 md:px-6 py-2 flex items-center gap-2 text-xs">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-muted-foreground">Live at</span>
              <code className="font-mono text-foreground truncate">{publicUrl}</code>
              <Button size="sm" variant="ghost" className="ml-auto h-7 px-2" onClick={copy}>
                <Copy className="size-3.5 mr-1" />Copy
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => window.open(publicUrl, "_blank")}>
                Open
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Live preview canvas */}
      <main className="max-w-5xl mx-auto pb-32">
        <PortfolioView data={data} persona={persona} />
      </main>

      {/* Floating persona switcher */}
      <PersonaSwitcher value={persona} onChange={setPersona} floating />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">{title}</div>
    {children}
  </div>
);

export default Dashboard;
