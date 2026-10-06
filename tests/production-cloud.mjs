import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
for (const line of readFileSync(".env.cloud-test", "utf8").split(/\r?\n/)) {
  const at = line.indexOf("=");
  if (at > 0) process.env[line.slice(0, at)] ||= line.slice(at + 1);
}
const origin =
  process.env.TEST_URL || "https://labelproof-prototype.vercel.app";
const clients = [1, 2, 3].map(() =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const checks = [];
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
async function rpc(client, name, args) {
  const r = await client.rpc(name, args);
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
const users = [];
for (const [index, c] of clients.entries()) {
  const r = await c.auth.signInWithPassword({
    email: `lp-cloud-test-${index + 1}@example.test`,
    password: process.env.LP_TEST_PASSWORD,
  });
  if (r.error) throw r.error;
  users.push(r.data.user);
}
const [admin, uploader, outsider] = clients;
const org = await rpc(admin, "lp_create_org", {
  org_name: "Production controls verification",
});
await rpc(admin, "lp_set_member", {
  organization: org,
  member: users[1].id,
  member_role: "uploader",
});
const original = JSON.parse(
  readFileSync("supabase/demo-snapshot.json", "utf8"),
);
assert.equal(
  await rpc(admin, "lp_save_snapshot", {
    organization: org,
    expected_version: 0,
    payload: original,
  }),
  1,
);
const invalids = [
  ["duplicate identifiers", (p) => p.images.push(structuredClone(p.images[0]))],
  [
    "unavailable finding evidence",
    (p) => (p.assessments[0].findings[0].imageId = "other-team-photo"),
  ],
  [
    "unsupported evidence URL",
    (p) => (p.images[0].url = "https://example.test/private.png"),
  ],
  [
    "unreviewed absence",
    (p) => {
      p.assessments
        .find((a) => a.id === "demo-snack-v1")
        .findings.find((f) => f.key === "price").coverageConfirmed = false;
    },
  ],
  [
    "unreadable absence coverage",
    (p) => {
      p.images.find((i) => i.id === "demo-snack-back").quality = "Unreadable";
    },
  ],
  [
    "invalid evidence rectangle",
    (p) => {
      p.assessments[0].findings[0].box = { x0: 0, y0: 0, x1: 9000, y1: 9000 };
    },
  ],
  [
    "rewriting immutable assessment",
    (p) => {
      p.assessments[0].reason = "Rewritten existing report";
    },
  ],
];
for (const [name, mutate] of invalids) {
  const p = structuredClone(original);
  mutate(p);
  const r = await admin.rpc("lp_save_snapshot", {
    organization: org,
    expected_version: 1,
    payload: p,
  });
  assert(r.error, name);
}
assert.equal(
  (
    await admin
      .from("lp_snapshots")
      .select("version")
      .eq("org_id", org)
      .single()
  ).data.version,
  1,
);
pass(
  "Server rejects duplicate IDs, foreign references, URLs, unreadable absence, invalid regions and immutable report edits atomically",
);
const review = {
  organization: org,
  assessment: "demo-oats-v1",
  review_action: "approve",
  review_note: "Test approval of a synthetic report; legal validation pending",
  expected_version: 1,
  assigned_to: null,
};
assert((await uploader.rpc("lp_review_checked", review)).error);
await rpc(admin, "lp_set_member", {
  organization: org,
  member: users[1].id,
  member_role: "reviewer",
});
assert(
  (await uploader.rpc("lp_review_checked", { ...review, expected_version: 0 }))
    .error,
);
assert(
  (
    await admin.rpc("lp_review_checked", {
      ...review,
      review_action: "assign",
      assigned_to: users[2].id,
    })
  ).error,
);
await rpc(admin, "lp_review_checked", {
  ...review,
  review_action: "assign",
  assigned_to: users[1].id,
});
await rpc(uploader, "lp_review_checked", review);
await rpc(admin, "lp_save_snapshot", {
  organization: org,
  expected_version: 1,
  payload: original,
});
assert((await uploader.rpc("lp_review_checked", review)).error);
pass(
  "Approvals enforce reviewer role, current snapshot and valid team assignment",
);
assert(
  (
    await uploader.rpc("lp_restore_snapshot", {
      organization: org,
      restore_version: 1,
      expected_version: 2,
    })
  ).error,
);
assert.equal(
  await rpc(admin, "lp_restore_snapshot", {
    organization: org,
    restore_version: 1,
    expected_version: 2,
  }),
  3,
);
assert.deepEqual(
  (
    await admin
      .from("lp_snapshots")
      .select("payload")
      .eq("org_id", org)
      .single()
  ).data.payload,
  original,
);
assert(
  (
    await admin.rpc("lp_restore_snapshot", {
      organization: org,
      restore_version: 1,
      expected_version: 2,
    })
  ).error,
);
assert.equal(
  (
    await outsider
      .from("lp_snapshot_history")
      .select("version")
      .eq("org_id", org)
  ).data.length,
  0,
);
assert.equal(
  (await outsider.from("lp_jobs").select("id").eq("org_id", org)).data.length,
  0,
);
assert(
  (await uploader.rpc("lp_worker_claim", { worker_secret: "0".repeat(64) }))
    .error,
);
pass(
  "Cloud restore works, rejects stale versions and keeps history/jobs/worker functions private",
);
assert.equal(
  (
    await fetch(origin + "/api/worker", {
      method: "POST",
      headers: { Authorization: "Bearer " + "0".repeat(64) },
    })
  ).status,
  401,
);
const outsiderSession = (await outsider.auth.getSession()).data.session;
assert.equal(
  (
    await fetch(origin + "/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + outsiderSession.access_token,
      },
      body: JSON.stringify({ organization: org }),
    })
  ).status,
  403,
);
pass("Live worker rejects forged credentials and outsider dispatch");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/dashboard/account");
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-extra="login"]');
    return button && !button.disabled;
  });
  await page.locator("#account-email").fill(users[0].email);
  await page.locator("#account-password").fill(process.env.LP_TEST_PASSWORD);
  await page.locator("[data-extra=login]").click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  await page.goto(origin + "/dashboard/processing");
  await page.locator("#cloud-job-org").fill(org);
  await page
    .locator("#cloud-job-name")
    .fill("Server OCR closed-page verification");
  await page
    .locator("#cloud-job-files")
    .setInputFiles("tests/fixtures/label-180.png");
  await page.locator("[data-extra=queue-cloud-job]").click();
  await page.getByText(/Cloud job (saved|safely queued)/).waitFor();
  const jobRow = await admin
    .from("lp_jobs")
    .select("id,request,status")
    .eq("org_id", org)
    .single();
  assert.equal(jobRow.error, null);
  const jobId = jobRow.data.id;
  // Identical enqueue cannot create another report; a different payload cannot reuse the key.
  assert.equal(
    await rpc(admin, "lp_enqueue_job", {
      organization: org,
      job_id: jobId,
      job_request: jobRow.data.request,
    }),
    jobId,
  );
  assert(
    (
      await admin.rpc("lp_enqueue_job", {
        organization: org,
        job_id: jobId,
        job_request: { ...jobRow.data.request, name: "Changed request" },
      })
    ).error,
  );
  await context.close();
  let completed;
  for (let attempt = 0; attempt < 150; attempt++) {
    const row = await admin
      .from("lp_jobs")
      .select("status,attempts,error,result_scan")
      .eq("id", jobId)
      .single();
    if (row.data.status === "completed") {
      completed = row.data;
      break;
    }
    if (row.data.status === "failed")
      throw new Error("Server OCR failed: " + row.data.error);
    await delay(2000);
  }
  assert(completed, "Server OCR should complete with the browser closed");
  const remote = (
    await admin
      .from("lp_snapshots")
      .select("payload,version")
      .eq("org_id", org)
      .single()
  ).data;
  const report = remote.payload.assessments.find(
    (a) => a.scanId === completed.result_scan,
  );
  assert.equal(report.pipeline, "server-ocr-1.0");
  assert.equal(
    report.findings.filter((f) => f.status === "observed").length,
    12,
  );
  const image = remote.payload.images.find(
    (i) => i.scanId === completed.result_scan,
  );
  assert.equal(
    image.sha256,
    createHash("sha256")
      .update(readFileSync("tests/fixtures/label-180.png"))
      .digest("hex"),
  );
  assert(report.findings.every((f) => f.status !== "missing"));
  assert.equal(
    remote.payload.scans.filter((s) => s.processingJobId === jobId).length,
    1,
  );
  pass(
    "Live server OCR completes after closing the browser, extracts 12 synthetic declarations and saves one hash-linked report",
  );
  // Reopen and use the real download button to load photos and report in account cache.
  const resumed = await browser.newPage();
  await resumed.goto(origin + "/dashboard/account");
  await resumed.waitForFunction(() => {
    const button = document.querySelector('[data-extra="login"]');
    return button && !button.disabled;
  });
  await resumed.locator("#account-email").fill(users[0].email);
  await resumed.locator("#account-password").fill(process.env.LP_TEST_PASSWORD);
  await resumed.locator("[data-extra=login]").click();
  await resumed
    .getByRole("heading", { name: "Signed in", exact: true })
    .waitFor();
  await resumed.goto(origin + "/dashboard/processing");
  await resumed.locator("#cloud-job-org").fill(org);
  await resumed.locator("[data-extra=download-job-reports]").click();
  await resumed
    .getByText(
      "Cloud workspace merged. Existing cloud records updated without duplicates.",
      { exact: true },
    )
    .waitFor();
  await resumed
    .getByText("Server OCR closed-page verification", { exact: true })
    .first()
    .click();
  await resumed.locator("#evidence-img").waitFor();
  await resumed.waitForFunction(
    () => document.querySelector("#evidence-img")?.naturalWidth > 0,
  );
  assert(
    (await resumed.locator("main").innerText()).includes(
      "Server OCR closed-page verification",
    ),
  );
  pass(
    "Completed cloud report downloads with original private image and working evidence viewer",
  );
  assert.deepEqual(errors, []);
  const bytes = readFileSync("tests/fixtures/label-180.png");
  // A separately queued job tests the scheduler, without calling the dispatch endpoint.
  const scheduledId = randomUUID(),
    path = `${org}/jobs/${scheduledId}/0`;
  const upload = await admin.storage
    .from("labelproof-evidence")
    .upload(path, bytes, { contentType: "image/png" });
  assert.equal(upload.error, null);
  await rpc(admin, "lp_enqueue_job", {
    organization: org,
    job_id: scheduledId,
    job_request: {
      name: "Scheduled OCR recovery verification",
      language: "eng",
      images: [
        {
          storagePath: path,
          surface: "Back",
          sha256: createHash("sha256").update(bytes).digest("hex"),
        },
      ],
    },
  });
  writeFileSync(
    "work/scheduled-test-job.json",
    JSON.stringify({ org, jobId: scheduledId }),
  );
  pass("Scheduler-only OCR job queued for independent recovery verification");
} finally {
  await browser.close();
  await Promise.all(clients.map((c) => c.auth.signOut()));
}
writeFileSync(
  "work/production-cloud-verification.json",
  JSON.stringify({ at: new Date().toISOString(), org, checks }, null, 2),
);
console.log(`${checks.length} production-control verification groups passed`);
