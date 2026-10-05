import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { DEMO_ACCESS } from "../src/demo-access.js";
const origin = process.env.TEST_URL || "http://localhost:5173";
const config = origin.startsWith("http://localhost")
  ? {
      url: process.env.SUPABASE_URL,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    }
  : await (await fetch(origin + "/api/config")).json();
const client = createClient(config.url, config.publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function login() {
  const r = await client.auth.signInWithPassword(DEMO_ACCESS);
  if (r.error) throw r.error;
  return r.data.user;
}
const demo = await login();
const { data: orgs, error } = await client.from("lp_orgs").select("id,name");
assert.equal(error, null);
assert.equal(orgs.length, 1);
assert.equal(orgs[0].name, "LabelProof Demo");
const org = orgs[0].id;
const snapshot = await client
  .from("lp_snapshots")
  .select("payload,version")
  .eq("org_id", org)
  .single();
assert.equal(snapshot.error, null);
assert.equal(snapshot.data.payload.scans.length, 3);
assert(snapshot.data.payload.scans.every((s) => s.demo));
console.log(
  "PASS public demo credentials, restricted organization and three synthetic products",
);
const denials = [
  ["lp_create_org", { org_name: "Must not be created" }],
  [
    "lp_set_member",
    { organization: org, member: demo.id, member_role: "admin" },
  ],
  [
    "lp_save_snapshot",
    { organization: org, expected_version: 1, payload: snapshot.data.payload },
  ],
  [
    "lp_review",
    {
      organization: org,
      assessment: "demo-oats-v1",
      review_action: "comment",
      review_note: "Must not be written",
    },
  ],
];
await client.auth.updateUser({ data: { role: "admin" } });
for (const [rpc, args] of denials)
  assert((await client.rpc(rpc, args)).error, rpc + " must deny shared demo");
assert(
  (
    await client.storage
      .from("labelproof-evidence")
      .upload(org + "/must-not-upload.png", new Uint8Array([1, 2, 3]), {
        contentType: "image/png",
      })
  ).error,
);
assert(
  (await client.auth.updateUser({ password: "MustNotReplaceDemo!2026" })).error,
);
assert(
  (await client.auth.updateUser({ email: "must-not-change@example.test" }))
    .error,
);
assert(
  (
    await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Must not enroll",
    })
  ).error,
);
await client.auth.signOut({ scope: "local" });
await login();
assert.equal(
  (
    await client
      .from("lp_snapshots")
      .select("version")
      .eq("org_id", org)
      .single()
  ).data.version,
  1,
);
console.log(
  "PASS server denial of cloud edits, uploads, credential changes, MFA and forged roles; original password still works",
);
await client.auth.signOut({ scope: "local" });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext();
  if (origin.startsWith("http://localhost"))
    await context.route("**/api/config", (r) =>
      r.fulfill({ json: { ...config, cloudConfigured: true } }),
    );
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (e) => runtimeErrors.push(e.message));
  await page.goto(origin + "/dashboard/account");
  await page
    .getByRole("button", { name: "Sign in to demo", exact: true })
    .click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  await page
    .getByText("Shared demo · read-only cloud access", { exact: true })
    .waitFor();
  assert.equal(await page.locator('[data-extra="password"]').count(), 0);
  await page.getByRole("link", { name: "Team & cloud", exact: true }).click();
  await page
    .getByRole("button", { name: "Load my organizations", exact: true })
    .click();
  await page.getByText("LabelProof Demo", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page
    .getByRole("button", { name: "Download cloud workspace", exact: true })
    .click();
  await page
    .getByText(
      "Cloud workspace merged. Existing cloud records updated without duplicates.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("link", { name: "Account & privacy", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Account access", exact: true })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Sign in to demo", exact: true })
    .click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(runtimeErrors, []);
  console.log(
    "PASS one-click demo sign-in, sample download, sign-out and mobile controls; no runtime errors",
  );
} finally {
  await browser.close();
}
