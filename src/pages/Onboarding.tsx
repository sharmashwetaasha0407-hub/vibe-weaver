import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Github, Linkedin, Code2, Twitter, FileText, Loader2, Sparkles } from "lucide-react";
import { extractPdfText } from "@/lib/parseResume";
import { applyTheme } from "@/lib/applyTheme";

const urlOrEmpty = z.string().trim().max(300).url().optional().or(z.literal(""));
const stepSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  github_url: urlOrEmpty,
  linkedin_url: urlOrEmpty,
  leetcode_url: urlOrEmpty,
  twitter_url: urlOrEmpty,
});

type FormState = z.infer<typeof stepSchema>;

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    full_name: "", github_url: "", linkedin_url: "", leetcode_url: "", twitter_url: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    applyTheme({ theme: "dark", accent: "violet", fontPair: "inter-jetbrains" });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth", { replace: true });
      else {
        supabase.from("profiles").select("full_name").eq("user_id", data.session.user.id).maybeSingle()
          .then(({ data: p }) => p?.full_name && setForm((f) => ({ ...f, full_name: p.full_name as string })));
      }
    });
  }, [navigate]);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const parsed = stepSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check your links", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      // 1) Save profile fields
      setProgress("Saving your profile…");
      await supabase.from("profiles").update({
        full_name: parsed.data.full_name,
        github_url: parsed.data.github_url || null,
        linkedin_url: parsed.data.linkedin_url || null,
        leetcode_url: parsed.data.leetcode_url || null,
        twitter_url: parsed.data.twitter_url || null,
      }).eq("user_id", u.user.id);

      // 2) Resume → upload + parse
      let resumeText = "";
      if (resumeFile) {
        setProgress("Uploading resume…");
        const path = `${u.user.id}/resume-${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage.from("resumes")
          .upload(path, resumeFile, { contentType: "application/pdf", upsert: true });
        if (upErr) throw upErr;
        setProgress("Reading resume…");
        try { resumeText = await extractPdfText(resumeFile); }
        catch { resumeText = ""; }
      }

      // 3) Call AI
      setProgress("Generating your three vibes…");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-vibes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          full_name: parsed.data.full_name,
          github_url: parsed.data.github_url,
          linkedin_url: parsed.data.linkedin_url,
          leetcode_url: parsed.data.leetcode_url,
          twitter_url: parsed.data.twitter_url,
          resume_text: resumeText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI failed");

      toast({ title: "Your VibeVault is ready", description: `Generated ${json.projectCount} projects across 3 personas.` });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-60" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-gradient-primary shadow-glow" />
            <span className="font-display font-semibold">VibeVault</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Step {step + 1} of 3</div>
        </div>

        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-10">
          <motion.div
            className="h-full bg-gradient-primary"
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            className="glass rounded-2xl p-6 md:p-8 shadow-elegant"
          >
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl">Who are you?</h2>
                  <p className="text-sm text-muted-foreground mt-1">We'll use this on every persona.</p>
                </div>
                <div>
                  <Label>Full name</Label>
                  <Input value={form.full_name} onChange={update("full_name")} placeholder="Ada Lovelace" maxLength={80} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl">Drop your links</h2>
                  <p className="text-sm text-muted-foreground mt-1">All optional, but the more the merrier.</p>
                </div>
                {[
                  { k: "github_url",   label: "GitHub",   icon: Github,   ph: "https://github.com/yourname" },
                  { k: "linkedin_url", label: "LinkedIn", icon: Linkedin, ph: "https://linkedin.com/in/yourname" },
                  { k: "leetcode_url", label: "LeetCode", icon: Code2,    ph: "https://leetcode.com/yourname" },
                  { k: "twitter_url",  label: "Twitter / X", icon: Twitter, ph: "https://x.com/yourname" },
                ].map(({ k, label, icon: Icon, ph }) => (
                  <div key={k}>
                    <Label className="flex items-center gap-2"><Icon className="size-3.5" />{label}</Label>
                    <Input value={form[k as keyof FormState] ?? ""} onChange={update(k as keyof FormState)} placeholder={ph} maxLength={300} />
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl">Upload your resume</h2>
                  <p className="text-sm text-muted-foreground mt-1">PDF, ≤10MB. We extract the text and never share the file.</p>
                </div>
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                    <FileText className="size-7 mx-auto text-muted-foreground" />
                    <div className="mt-3 font-medium">{resumeFile ? resumeFile.name : "Click to choose a PDF"}</div>
                    <div className="text-xs text-muted-foreground mt-1">Optional — we still generate without one.</div>
                  </div>
                  <input
                    type="file" accept="application/pdf" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 10 * 1024 * 1024) { toast({ title: "File too big", description: "Max 10MB", variant: "destructive" }); return; }
                      setResumeFile(f);
                    }}
                  />
                </label>
                {busy && (
                  <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {progress || "Working…"}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <Button variant="ghost" onClick={back} disabled={step === 0 || busy}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              {step < 2 ? (
                <Button onClick={next} disabled={step === 0 && !form.full_name.trim()}>
                  Continue <ArrowRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={busy} className="shadow-glow">
                  {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                  Generate my vibes
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
