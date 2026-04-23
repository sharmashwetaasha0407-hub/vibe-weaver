import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ACCENTS, FONT_PAIRS, type Persona, type Theme } from "@/lib/personas";
import { applyTheme } from "@/lib/applyTheme";
import { PortfolioView, type PortfolioData } from "@/components/vibe/PortfolioView";
import { PersonaSwitcher } from "@/components/vibe/PersonaSwitcher";

const PublicPortfolio = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [persona, setPersona] = useState<Persona>("architect");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!profile || !profile.is_published) { setNotFound(true); setLoading(false); return; }
      const uid = profile.user_id;

      applyTheme({
        theme: (profile.theme as Theme) ?? "dark",
        accent: (profile.accent as keyof typeof ACCENTS) ?? "violet",
        fontPair: (profile.font_pair as keyof typeof FONT_PAIRS) ?? "inter-jetbrains",
      });
      setPersona((profile.active_persona as Persona) ?? "architect");

      const [{ data: pnarr }, { data: projects }, { data: narratives }] = await Promise.all([
        supabase.from("profile_narratives").select("*").eq("user_id", uid),
        supabase.from("projects").select("*").eq("user_id", uid).order("position"),
        supabase.from("vibe_narratives").select("*").eq("user_id", uid),
      ]);

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
        pnarr: pmap, projects: projWithNarr,
      });
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  if (notFound || !data) return (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Portfolio not found</h1>
        <p className="text-muted-foreground mt-2">It may be unpublished or removed.</p>
        <Link to="/" className="inline-block mt-6 underline">Back to VibeVault</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <span className="size-4 rounded bg-gradient-primary inline-block" /> Made with VibeVault
        </Link>
      </header>
      <main className="max-w-5xl mx-auto pb-32">
        <PortfolioView data={data} persona={persona} />
      </main>
      <PersonaSwitcher value={persona} onChange={setPersona} floating />
    </div>
  );
};

export default PublicPortfolio;
