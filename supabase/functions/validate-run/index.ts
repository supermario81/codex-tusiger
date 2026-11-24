import { createClient } from "npm:@supabase/supabase-js@2";
import { verdict } from "./verdict.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await db.auth.getUser(token);
    if (!auth.user) return reply({ error: "not_authenticated" }, 401);
    const { runId, needsReview } = await req.json();
    const { data: run, error } = await db.from("runs").select("*").eq("id", runId).eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (!run) return reply({ error: "not_found" }, 404);
    // Ein bereits gewerteter Lauf bleibt, wie er ist.
    if (run.status !== "draft") return reply(run);

    const points: Record<string, unknown>[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const page = await db.from("run_points").select("*").eq("run_id", run.id).order("recorded_at").order("id").range(from, from + 999);
      if (page.error) throw page.error;
      points.push(...page.data);
      if (page.data.length < 1000) break;
    }
    const config = await db.from("challenge_config").select("*").eq("active", true).limit(1).single();
    if (config.error) throw config.error;
    const result = verdict(run, points, config.data);
    if (needsReview && result.status === "valid") result.status = "needs_review";
    const saved = await db.from("runs").update(result).eq("id", run.id).eq("status", "draft").select().single();
    if (saved.error) throw saved.error;
    return reply(saved.data);
  } catch (cause) {
    console.error(cause);
    return reply({ error: "validation_failed" }, 500);
  }
});
