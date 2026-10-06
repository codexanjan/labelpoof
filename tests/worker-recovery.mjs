import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { setTimeout as delay } from "node:timers/promises";
import { gateway } from "../server/processor.js";
for (const line of readFileSync(".env.cloud-test", "utf8").split(/\r?\n/)) {
  const at = line.indexOf("=");
  if (at > 0) process.env[line.slice(0, at)] ||= line.slice(at + 1);
}
process.env.LABELPROOF_WORKER_SECRET = readFileSync(
  ".env.worker",
  "utf8",
).trim();
const simulated = JSON.parse(
  readFileSync("work/simulated-worker-crash.json", "utf8"),
);
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const login = await client.auth.signInWithPassword({
  email: "lp-cloud-test-1@example.test",
  password: process.env.LP_TEST_PASSWORD,
});
if (login.error) throw login.error;
let completed;
for (let attempt = 0; attempt < 100; attempt++) {
  const { data, error } = await client
    .from("lp_jobs")
    .select("status,attempts,result_scan,error")
    .eq("id", simulated.id)
    .single();
  if (error) throw error;
  if (data.status === "completed") {
    completed = data;
    break;
  }
  if (data.status === "failed") throw new Error(data.error);
  await delay(2000);
}
assert(completed, "Scheduled retry must recover an expired worker lease");
assert.equal(completed.attempts, 2);
const snapshot = await client
  .from("lp_snapshots")
  .select("payload")
  .eq("org_id", simulated.org)
  .single();
assert.equal(
  snapshot.data.payload.scans.filter((s) => s.processingJobId === simulated.id)
    .length,
  1,
);
assert.equal(
  snapshot.data.payload.assessments.filter(
    (a) => a.scanId === completed.result_scan,
  ).length,
  1,
);
const stale = await gateway({
  action: "finish",
  job: simulated.id,
  token: simulated.token,
  failure: "A stopped worker must not overwrite a recovered job",
});
assert.equal(stale.accepted, false);
assert.equal(
  (
    await client
      .from("lp_jobs")
      .select("status")
      .eq("id", simulated.id)
      .single()
  ).data.status,
  "completed",
);
writeFileSync(
  "work/worker-recovery-verification.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      job: simulated.id,
      attempts: completed.attempts,
      singleReport: true,
      staleWorkerDenied: true,
    },
    null,
    2,
  ),
);
await client.auth.signOut();
console.log(
  "PASS minute scheduler recovers an expired lease on attempt two, creates exactly one report and rejects a stale worker result",
);
