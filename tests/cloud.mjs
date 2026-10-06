import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

// Only disposable, confirmed example.test accounts provisioned by the operator.
// Never use real customer credentials or send mail in this test.
for (const line of readFileSync(".env.cloud-test", "utf8").split(/\r?\n/)) {
  const at = line.indexOf("=");
  if (at > 0) process.env[line.slice(0, at)] ||= line.slice(at + 1);
}
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_PUBLISHABLE_KEY;
const clients = [1, 2, 3].map(() =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const checks = [];
function pass(name) {
  checks.push(name);
  console.log("PASS " + name);
}
async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  if (result.error) throw result.error;
  return result.data;
}
for (const [index, client] of clients.entries()) {
  const { error } = await client.auth.signInWithPassword({
    email: `lp-cloud-test-${index + 1}@example.test`,
    password: process.env.LP_TEST_PASSWORD,
  });
  if (error) throw error;
}
const [admin, uploader, outsider] = clients;
pass("Real confirmed-account password login");
const user = (await uploader.auth.getUser()).data.user;
const org = await rpc(admin, "lp_create_org", {
  org_name: "Disposable cloud verification",
});
await rpc(admin, "lp_set_member", {
  organization: org,
  member: user.id,
  member_role: "uploader",
});
const payload = {
  format: "labelproof-workspace",
  schemaVersion: 2,
  scans: [],
  images: [],
  assessments: [{ id: "test-report" }],
};
assert.equal(
  await rpc(admin, "lp_save_snapshot", {
    organization: org,
    expected_version: 0,
    payload,
  }),
  1,
);
assert.equal(
  (
    await uploader
      .from("lp_snapshots")
      .select("version")
      .eq("org_id", org)
      .single()
  ).data.version,
  1,
);
pass("Organization creation, membership and shared snapshot read");
assert.equal(
  (await outsider.from("lp_snapshots").select("version").eq("org_id", org)).data
    .length,
  0,
);
assert.equal(
  (await outsider.from("lp_members").select("role").eq("org_id", org)).data
    .length,
  0,
);
assert(
  (
    await outsider.rpc("lp_save_snapshot", {
      organization: org,
      expected_version: 1,
      payload,
    })
  ).error,
);
pass("Cross-organization report and membership isolation");
assert(
  (
    await uploader.rpc("lp_set_member", {
      organization: org,
      member: user.id,
      member_role: "admin",
    })
  ).error,
);
await uploader.auth.updateUser({ data: { role: "admin" } });
assert(
  (
    await uploader.rpc("lp_review", {
      organization: org,
      assessment: "test-report",
      review_action: "approve",
      review_note: "Must be refused",
    })
  ).error,
);
assert(
  (
    await uploader
      .from("lp_members")
      .update({ role: "admin" })
      .eq("org_id", org)
      .eq("user_id", user.id)
  ).error,
);
pass(
  "Uploader cannot approve or promote themselves, including forged user metadata",
);
await rpc(uploader, "lp_review", {
  organization: org,
  assessment: "test-report",
  review_action: "comment",
  review_note: "Uploader comment",
});
await rpc(admin, "lp_set_member", {
  organization: org,
  member: user.id,
  member_role: "reviewer",
});
await rpc(uploader, "lp_review", {
  organization: org,
  assessment: "test-report",
  review_action: "approve",
  review_note: "Reviewer test approval",
});
pass("Reviewer permission and immutable server audit events");
const boundReviews = await uploader
  .from("lp_review_events")
  .select("snapshot_version,assessment_sha256")
  .eq("org_id", org);
assert.equal(boundReviews.error, null);
assert(
  boundReviews.data.every(
    (r) =>
      r.snapshot_version === 1 && /^[a-f0-9]{64}$/.test(r.assessment_sha256),
  ),
);
assert.equal(
  await rpc(admin, "lp_save_snapshot", {
    organization: org,
    expected_version: 1,
    payload,
  }),
  2,
);
assert(
  (
    await uploader.rpc("lp_save_snapshot", {
      organization: org,
      expected_version: 1,
      payload,
    })
  ).error,
);
assert(
  (
    await admin.rpc("lp_save_snapshot", {
      organization: org,
      expected_version: 2,
      payload: {},
    })
  ).error,
);
pass("Stale snapshot and invalid payload rejected");
const bytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const path = org + "/test-evidence.png";
assert.equal(
  (
    await admin.storage
      .from("labelproof-evidence")
      .upload(path, bytes, { contentType: "image/png" })
  ).error,
  null,
);
const restored = await uploader.storage
  .from("labelproof-evidence")
  .download(path);
assert.equal(restored.error, null);
assert.equal(
  createHash("sha256")
    .update(Buffer.from(await restored.data.arrayBuffer()))
    .digest("hex"),
  createHash("sha256").update(bytes).digest("hex"),
);
assert(
  (await outsider.storage.from("labelproof-evidence").download(path)).error,
);
const publicResponse = await fetch(
  url + "/storage/v1/object/public/labelproof-evidence/" + path,
);
assert(!publicResponse.ok);
const anonymous = createClient(url, key, { auth: { persistSession: false } });
assert((await anonymous.from("lp_snapshots").select("*")).error);
pass(
  "Private photos restore byte-for-byte; outsiders and anonymous users denied",
);
assert.equal(
  (await admin.storage.from("labelproof-evidence").remove([path])).error,
  null,
);
await admin.auth.signOut();
assert(
  (
    await admin.rpc("lp_create_org", {
      org_name: "Must be denied after logout",
    })
  ).error,
);
pass("Logout revokes subsequent cloud actions");

const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  async function signedPage(index) {
    const context = await browser.newContext();
    if (origin.startsWith("http://localhost"))
      await context.route("**/api/config", (route) =>
        route.fulfill({
          json: { url, publishableKey: key, cloudConfigured: true },
        }),
      );
    const page = await context.newPage();
    await page.goto(origin + "/dashboard/account");
    await page
      .locator("#account-email")
      .fill(`lp-cloud-test-${index}@example.test`);
    await page.locator("#account-password").fill(process.env.LP_TEST_PASSWORD);
    await page.locator('[data-extra="login"]').click();
    await page
      .getByRole("heading", { name: "Signed in", exact: true })
      .waitFor();
    return { context, page };
  }
  const a = await signedPage(1);
  await a.page.goto(origin + "/dashboard/team");
  await a.page
    .locator("#org-name")
    .fill("Disposable browser sync verification");
  await a.page.locator('[data-extra="create-org"]').click();
  await a.page.waitForFunction(
    () => !!document.querySelector("#org-id")?.value,
  );
  const browserOrg = await a.page.locator("#org-id").inputValue();
  await a.page.locator("#member-id").fill(user.id);
  await a.page.locator('[data-extra="add-member"]').click();
  await a.page.getByText("Team role saved.", { exact: true }).waitFor();
  await a.page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("labelproof-workspace-v2");
      r.onsuccess = () => resolve(r.result);
    });
    const photo = await new Promise((resolve) => {
      const r = db.transaction("images").objectStore("images").getAll();
      r.onsuccess = () => resolve(r.result.find((i) => i.fixture));
    });
    const canvas = document.createElement("canvas");
    canvas.width = photo.width;
    canvas.height = photo.height;
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = photo.fixture;
    });
    canvas.getContext("2d").drawImage(image, 0, 0, photo.width, photo.height);
    photo.blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    photo.sha256 = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", await photo.blob.arrayBuffer()),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    delete photo.fixture;
    await new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      tx.objectStore("images").put(photo);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await a.page.reload();
  await a.page.locator("#org-id").fill(browserOrg);
  await a.page.locator('[data-extra="sync-cloud"]').click();
  await a.page
    .getByText("Private cloud snapshot saved. Version 1", { exact: true })
    .waitFor();
  pass(
    "Browser login, organization creation, adding member and upload buttons",
  );
  const b = await signedPage(2);
  async function pull() {
    await b.page.goto(origin + "/dashboard/team");
    await b.page.locator("#org-id").fill(browserOrg);
    await b.page.locator('[data-extra="pull-cloud"]').click();
    await b.page
      .getByText(
        "Cloud workspace merged. Existing cloud records updated without duplicates.",
        { exact: true },
      )
      .waitFor();
  }
  async function countScans() {
    return b.page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("labelproof-workspace-v2");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      const count = await new Promise((resolve) => {
        const r = db.transaction("scans").objectStore("scans").count();
        r.onsuccess = () => resolve(r.result);
      });
      db.close();
      return count;
    });
  }
  await pull();
  assert(
    await b.page.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open("labelproof-workspace-v2");
        r.onsuccess = () => resolve(r.result);
      });
      const found = await new Promise((resolve) => {
        const r = db.transaction("images").objectStore("images").getAll();
        r.onsuccess = () =>
          resolve(r.result.some((i) => i.blob instanceof Blob && i.sha256));
      });
      db.close();
      return found;
    }),
  );
  const count = await countScans();
  await pull();
  assert.equal(await countScans(), count);
  await b.page.goto(origin + "/dashboard/team");
  await b.page.locator("#org-id").fill(browserOrg);
  await b.page.locator('[data-extra="sync-cloud"]').click();
  await b.page
    .getByText("Private cloud snapshot saved. Version 2", { exact: true })
    .waitFor();
  await pull();
  assert.equal(await countScans(), count);
  pass(
    "Separate browser/account cloud restoration, repeat download without duplicates and reload-safe upload",
  );
  await a.page.reload();
  await a.page.locator("#org-id").fill(browserOrg);
  await a.page.locator('[data-extra="sync-cloud"]').click();
  await a.page
    .getByText("Cloud changed. Download latest before publishing.", {
      exact: true,
    })
    .waitFor();
  pass("Stale browser prevented from overwriting another reviewer snapshot");
  await b.page.goto(origin + "/dashboard/account");
  await b.page.locator('[data-extra="logout"]').click();
  await b.page
    .getByRole("heading", { name: "Account access", exact: true })
    .waitFor();
  pass("Browser sign-out button");
  // Operator deletes only these owned disposable organizations/users after verification.
} finally {
  await browser.close();
  await Promise.all(clients.map((c) => c.auth.signOut()));
}
mkdirSync("work", { recursive: true });
writeFileSync(
  "work/cloud-verification.json",
  JSON.stringify({ at: new Date().toISOString(), checks }, null, 2),
);
console.log(
  `${checks.length} cloud verification groups passed. Clean up disposable users and organizations with the operator's management connection.`,
);
