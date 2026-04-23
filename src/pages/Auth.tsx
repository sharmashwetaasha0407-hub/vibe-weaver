import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { applyTheme } from "@/lib/applyTheme";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  full_name: z.string().trim().min(1).max(80).optional(),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applyTheme({ theme: "dark", accent: "violet", fontPair: "inter-jetbrains" });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const handle = async (mode: "signin" | "signup", e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      full_name: mode === "signup" ? fd.get("full_name") || undefined : undefined,
    });
    if (!parsed.success) {
      toast({ title: "Check your inputs", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: parsed.data.full_name },
          },
        });
        if (error) throw error;
        // If email confirmation is off, a session is returned immediately.
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: parsed.data.email, password: parsed.data.password,
          });
          if (signInErr) throw signInErr;
        }
        toast({ title: "Welcome to VibeVault", description: "Account created — let's build your portfolio." });
        navigate("/onboarding", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) throw error;
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toast({ title: "Auth failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body relative flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-70" />
      <Link to="/" className="absolute top-5 left-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass relative z-10 w-full max-w-md rounded-2xl p-7 shadow-elegant"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="size-7 rounded-md bg-gradient-primary shadow-glow" />
          <span className="font-display font-semibold">VibeVault</span>
        </div>
        <h1 className="font-display text-2xl mb-1">Sign in to continue</h1>
        <p className="text-sm text-muted-foreground mb-6">Build your multi-persona portfolio in minutes.</p>

        <Tabs defaultValue="signup">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signup">Create account</TabsTrigger>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-5">
            <form onSubmit={(e) => handle("signup", e)} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" placeholder="Ada Lovelace" required maxLength={80} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@domain.com" required maxLength={255} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} maxLength={72} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />} Create account
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signin" className="mt-5">
            <form onSubmit={(e) => handle("signin", e)} className="space-y-4">
              <div>
                <Label htmlFor="si_email">Email</Label>
                <Input id="si_email" name="email" type="email" required maxLength={255} />
              </div>
              <div>
                <Label htmlFor="si_password">Password</Label>
                <Input id="si_password" name="password" type="password" required minLength={6} maxLength={72} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />} Sign in
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AuthPage;
