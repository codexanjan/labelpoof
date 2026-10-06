import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// Machine-only gateway. JWT verification is disabled because this endpoint uses
// a dedicated 256-bit worker credential, checked inside private database code.
// Service credentials never leave this runtime.
Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  const reply = (status: number, value: unknown) =>
    new Response(JSON.stringify(value), { status, headers });
  if (req.method !== "POST") return reply(405, { error: "POST required" });
  const secret = req.headers
    .get("authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!secret) return reply(401, { error: "Worker authentication required" });
  if (Number(req.headers.get("content-length") || 0) > 2000000)
    return reply(413, { error: "Request too large" });
  try {
    const raw = await req.text();
    if (raw.length > 2000000) return reply(413, { error: "Request too large" });
    const body = JSON.parse(raw);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    if (body.action === "claim") {
      const { data: job, error } = await admin.rpc("lp_worker_claim", {
        worker_secret: secret,
        organization: body.organization || null,
      });
      if (error) return reply(403, { error: "Worker request denied" });
      if (!job) return reply(200, { job: null });
      for (const image of job.request.images) {
        if (!image.storagePath.startsWith(job.org_id + "/jobs/" + job.id + "/"))
          throw new Error("Invalid job evidence path");
        const { data, error } = await admin.storage
          .from("labelproof-evidence")
          .createSignedUrl(image.storagePath, 600);
        if (error) throw new Error("Private evidence unavailable");
        image.downloadUrl = data.signedUrl;
      }
      return reply(200, { job });
    }
    if (body.action === "finish") {
      const { data, error } = await admin.rpc("lp_worker_finish", {
        worker_secret: secret,
        job_id: body.job,
        claim_token: body.token,
        bundle: body.bundle || null,
        failure: body.failure || null,
      });
      if (error)
        return reply(400, {
          error: "Worker result rejected: " + error.message,
        });
      return reply(200, { accepted: data });
    }
    return reply(400, { error: "Unknown worker action" });
  } catch (error) {
    console.error(
      "LabelProof worker gateway failed",
      error instanceof Error ? error.message : "Unexpected error",
    );
    return reply(400, { error: "Worker request failed" });
  }
});
