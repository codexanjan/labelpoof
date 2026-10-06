import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import { processQueue } from "../server/processor.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST required" });
  if (!process.env.LABELPROOF_WORKER_SECRET)
    return res.status(503).json({ error: "Cloud worker setup pending" });
  const token = String(req.headers.authorization || "").match(
    /^Bearer (.+)$/,
  )?.[1];
  if (!token) return res.status(401).json({ error: "Sign in required" });
  const organization = req.body?.organization;
  if (!/^[0-9a-f-]{36}$/i.test(organization || ""))
    return res.status(400).json({ error: "Choose a team" });
  try {
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
        global: { headers: { Authorization: "Bearer " + token } },
        auth: { persistSession: false },
      },
    );
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Session expired" });
    const { data, error } = await client
      .from("lp_members")
      .select("role")
      .eq("org_id", organization)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data)
      return res.status(403).json({ error: "Team access required" });
    // Only persisted queued jobs can be claimed; concurrent requests cannot rerun a lease.
    waitUntil(
      processQueue(organization).catch(() =>
        console.error("labelproof_worker_dispatch_failed"),
      ),
    );
    return res
      .status(202)
      .json({
        accepted: true,
        message: "Saved jobs are processing independently of this browser",
      });
  } catch {
    return res
      .status(503)
      .json({
        error: "Processing dispatch unavailable. Saved jobs will retry.",
      });
  }
}
