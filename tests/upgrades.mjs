import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const origin = process.env.TEST_URL || "http://localhost:5173";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
for (const route of [
  "account",
  "team",
  "processing",
  "approvals",
  "compare",
  "operations",
]) {
  await p.goto(origin + "/dashboard/" + route);
  await p.locator("main h1").waitFor();
}
await p.locator('[data-extra="export-evaluation"]').click();
await p.goto(origin + "/dashboard/compare");
await p.locator('[data-extra="compare"]').click();
await p.locator("#comparison-result tbody tr").first().waitFor();
assert.equal(await p.locator("#comparison-result tbody tr").count(), 12);
await p.goto(origin + "/dashboard/approvals");
await p
  .locator("#workflow-note")
  .fill("Checked the image evidence; legal review pending.");
await p.locator('[data-extra="approve"]').click();
await p.waitForFunction(() =>
  document
    .querySelector("main")
    .textContent.includes("Checked the image evidence"),
);
await p.reload();
await p.locator("#workflow-note").waitFor();
assert.ok(
  (await p.locator("main").innerText()).includes("Checked the image evidence"),
);
await p.goto(origin + "/dashboard/new");
await p.locator("#product-name").fill("Saved capture draft");
await p.locator("#file").setInputFiles("../../work/ocr-180.png");
await p.locator(".upload-card").waitFor();
await p.reload();
await p.locator("#product-name").waitFor();
assert.equal(
  await p.locator("#product-name").inputValue(),
  "Saved capture draft",
);
assert.equal(await p.locator(".upload-card").count(), 1);
await p.locator('[data-action="cancel-capture"]').click();
await p.goto(origin + "/dashboard/processing");
await p.locator("#batch-files").setInputFiles("../../work/ocr-180.png");
await p.waitForFunction(() =>
  document.querySelector("main").textContent.includes("queued"),
);
await p.reload();
await p.locator("main h1").waitFor();
assert.ok((await p.locator("main").innerText()).includes("queued"));
await p.locator('[data-extra="run-batch"]').click();
await p.waitForFunction(
  () => document.querySelector("main").textContent.includes("completed"),
  {},
  { timeout: 120000 },
);
await p.locator('a[href^="/dashboard/scans/"]').last().click();
await p.locator(".finding-list").waitFor();
assert.ok((await p.locator(".finding-icon.observed").count()) >= 9);
await p.goto(origin + "/dashboard/processing");
await p.locator("#batch-files").setInputFiles("../../work/ocr-180.png");
await p.waitForFunction(() =>
  document.querySelector("main").textContent.includes("queued"),
);
await p.locator('[data-extra="remove-job"]').click();
await p.waitForFunction(
  () => !document.querySelector("[data-extra=remove-job]"),
);
assert.deepEqual(errors, []);
console.log(
  "PASS new routes, comparison, preliminary approvals, persistent capture and queued batches.",
);
await b.close();
