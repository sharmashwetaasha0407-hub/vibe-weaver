// Generates 3 persona narratives from user inputs using Lovable AI Gateway
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  github_url?: string;
  linkedin_url?: string;
  leetcode_url?: string;
  twitter_url?: string;
  full_name?: string;
  resume_text?: string;
}

const PERSONA_TOOL = {
  type: "function",
  function: {
    name: "emit_portfolio",
    description: "Emit a structured multi-persona portfolio.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        bio: { type: "string", description: "neutral one-liner bio" },
        skills: { type: "array", items: { type: "string" } },
        personas: {
          type: "object",
          properties: {
            architect: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string", description: "2-3 paragraphs, technical voice" },
              },
              required: ["headline", "summary"],
            },
            impact: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string", description: "STAR-method, results-driven" },
              },
              required: ["headline", "summary"],
            },
            visionary: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string", description: "Founder voice, vision and craft" },
              },
              required: ["headline", "summary"],
            },
          },
          required: ["architect", "impact", "visionary"],
        },
        projects: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              tech_stack: { type: "array", items: { type: "string" } },
              github_link: { type: "string" },
              live_demo_url: { type: "string" },
              narratives: {
                type: "object",
                properties: {
                  architect: { type: "string", description: "Technical narrative, ~80 words" },
                  impact:    { type: "string", description: "Recruiter narrative, ~80 words" },
                  visionary: { type: "string", description: "Founder narrative, ~80 words" },
                },
                required: ["architect", "impact", "visionary"],
              },
            },
            required: ["title", "description", "tech_stack", "narratives"],
          },
        },
      },
      required: ["full_name", "bio", "skills", "personas", "projects"],
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = (await req.json()) as Body;
    const sys = `You are VibeVault, an AI portfolio orchestrator.
Given a candidate's links and resume text, infer realistic projects and write three voice variants.
- "architect": precise, technical, mentions architecture, scaling, trade-offs.
- "impact": STAR-format, business outcomes, % numbers when sensible, soft skills.
- "visionary": founder energy, speed, taste, market insight.
If signals are sparse, invent reasonable, plausible portfolio projects matching the apparent stack — never fabricate employer names. Always fill all fields.`;

    const userMsg = `Inputs:
Full name: ${body.full_name ?? "(unknown)"}
GitHub: ${body.github_url ?? "(none)"}
LinkedIn: ${body.linkedin_url ?? "(none)"}
LeetCode: ${body.leetcode_url ?? "(none)"}
Twitter: ${body.twitter_url ?? "(none)"}
Resume text (truncated):
${(body.resume_text ?? "").slice(0, 8000)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        tools: [PERSONA_TOOL],
        tool_choice: { type: "function", function: { name: "emit_portfolio" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) {
      console.error("no tool call", JSON.stringify(aiJson).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned no structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(tc.function.arguments);

    // Persist using a service-role-bypass via the user-scoped client (RLS still applies — ok).
    // Update profile bio/avatar fields
    await supabase.from("profiles").update({
      full_name: args.full_name,
      bio: args.bio,
    }).eq("user_id", user.id);

    // Wipe & insert profile_narratives
    await supabase.from("profile_narratives").delete().eq("user_id", user.id);
    const pnRows = (["architect","impact","visionary"] as const).map((p) => ({
      user_id: user.id,
      persona: p,
      headline: args.personas[p].headline,
      summary: args.personas[p].summary,
      skills: args.skills ?? [],
    }));
    await supabase.from("profile_narratives").insert(pnRows);

    // Wipe & insert projects + narratives
    await supabase.from("projects").delete().eq("user_id", user.id);
    let pos = 0;
    for (const proj of args.projects ?? []) {
      const { data: inserted, error: pErr } = await supabase.from("projects").insert({
        user_id: user.id,
        title: proj.title,
        description: proj.description,
        tech_stack: proj.tech_stack ?? [],
        github_link: proj.github_link ?? null,
        live_demo_url: proj.live_demo_url ?? null,
        position: pos++,
      }).select("id").single();
      if (pErr || !inserted) { console.error(pErr); continue; }
      const narrRows = (["architect","impact","visionary"] as const).map((p) => ({
        project_id: inserted.id,
        user_id: user.id,
        persona: p,
        content_text: proj.narratives?.[p] ?? "",
      }));
      await supabase.from("vibe_narratives").insert(narrRows);
    }

    return new Response(JSON.stringify({ ok: true, projectCount: args.projects?.length ?? 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-vibes error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
