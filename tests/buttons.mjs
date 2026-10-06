import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
await mkdir("work", { recursive: true });
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ acceptDownloads: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const visit = async (path) => {
  await page.goto(origin + path);
  await page.locator("main h1").waitFor();
};
await visit("/dashboard/scans/demo-oats");
await page.locator('[data-action="zoom-in"]').click();
assert.match(await page.locator(".evidence-tools").innerText(), /125%/);
await page.locator('[data-action="zoom-out"]').click();
assert.match(await page.locator(".evidence-tools").innerText(), /100%/);
for (const filter of await page
  .locator("[data-finding-filter]")
  .evaluateAll((es) => es.map((e) => e.dataset.findingFilter)))
  await page.locator(`[data-finding-filter="${filter}"]`).click();
await page.locator('[data-finding-filter="all"]').click();
const download = page.waitForEvent("download");
await page.locator('[data-action="print"]').click();
const pdf = await download;
await pdf.saveAs("work/button-report.pdf");
const bytes = await readFile(await pdf.path());
assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
assert.ok(bytes.length > 100000);
await page.locator('[data-action="delete-scan"]').click();
await page.getByRole("button", { name: "Keep product" }).click();
assert.equal(await page.locator("dialog[open]").count(), 0);
await page.locator('[data-action="notifications"]').click();
await page.getByRole("link", { name: "View complete timeline" }).click();
assert.ok(page.url().endsWith("/activity"));
await visit("/dashboard/review");
for (const key of await page
  .locator("[data-review-filter]")
  .evaluateAll((es) => es.map((e) => e.dataset.reviewFilter)))
  await page.locator(`[data-review-filter="${key}"]`).click();
await page.locator('[data-review-filter="all"]').click();
const cards = await page
  .locator("[data-rescan]")
  .evaluateAll((es) =>
    es.map((e) => ({ id: e.dataset.rescan, key: e.dataset.rescanField })),
  );
for (const c of cards) {
  await visit("/dashboard/review");
  await page
    .locator(`[data-rescan="${c.id}"][data-rescan-field="${c.key}"]`)
    .click();
  const { fields } = await import("../src/rules.js");
  assert.equal(
    await page.locator("#surface").inputValue(),
    fields.find((f) => f.key === c.key).surface,
  );
  await page.locator('[data-action="cancel-capture"]').click();
}
await visit("/dashboard/evidence");
for (const value of await page
  .locator("#gallery-filter option")
  .evaluateAll((es) => es.map((e) => e.value)))
  await page.locator("#gallery-filter").selectOption(value);
await page.locator("#gallery-filter").selectOption("all");
await page.locator("[data-image]").first().click();
await page.locator("dialog details summary").click();
await page.getByRole("link", { name: /Open related report/ }).click();
await visit("/dashboard/rules");
await page.locator('[data-action="draft-rule"]').click();
await page.locator('[data-action="save-draft"]').click();
assert.equal(await page.locator("dialog[open]").count(), 1);
await page.locator("#draft-title").fill("Delete test");
await page.locator("#draft-note").fill("Reviewed question");
await page.locator('[data-action="save-draft"]').click();
await page.locator("[data-delete-draft]").last().click();
await page.waitForFunction(
  () => document.querySelectorAll("[data-delete-draft]").length === 0,
);
await visit("/dashboard/settings");
await page.locator("#backup-file").setInputFiles({
  name: "bad.json",
  mimeType: "application/json",
  buffer: Buffer.from("{}"),
});
await page.waitForFunction(() =>
  document.querySelector("#toast").textContent.includes("Import rejected"),
);
assert.equal(await page.locator("#backup-file").inputValue(), "");
await page.locator('[data-action="clear"]').click();
await page.getByRole("button", { name: "Keep workspace" }).click();
await page.locator('[data-action="clear"]').click();
await page.locator('[data-action="confirm-clear"]').click();
await page.locator('[data-action="load-demos"]').click();
await page.waitForFunction(
  () => document.querySelectorAll(".recent tbody tr").length === 3,
);
await visit("/dashboard/scans");
for (const value of await page
  .locator("#scan-filter option")
  .evaluateAll((es) => es.map((e) => e.value)))
  await page.locator("#scan-filter").selectOption(value);
await page.locator("#scan-filter").selectOption("all");
await page.locator("#global-search input").fill("Mountain");
await page.locator("#global-search button").click();
assert.equal(await page.locator(".scan-results tbody tr").count(), 1);
await visit("/dashboard/new");
await page.locator("#dropzone").focus();
const chooser = page.waitForEvent("filechooser");
await page.locator("#dropzone").press("Enter");
await (await chooser).setFiles([]);
const camera = page.waitForEvent("filechooser");
await page.locator(".camera-button").click();
await (await camera).setFiles([]);
assert.equal(await page.locator('[data-action="analyze"]').isDisabled(), true);
await page.locator("#product-name").fill("Retained draft");
await page.getByRole("link", { name: "Overview", exact: true }).click();
await page.goBack();
assert.equal(
  await page.locator("#product-name").inputValue(),
  "Retained draft",
);
await page.locator("#file").setInputFiles({
  name: "bad.png",
  mimeType: "image/png",
  buffer: Buffer.from("invalid"),
});
await page.waitForFunction(
  () => document.querySelector("#toast").textContent.length > 0,
);
assert.equal(await page.locator(".upload-card").count(), 0);
await page.locator("#product-name").fill("Cancellation test");
await page.locator("#file").setInputFiles("tests/fixtures/label-180.png");
await page.locator(".upload-card").waitFor();
await page.locator("[data-image-surface]").selectOption("Back");
await page.locator("[data-image-quality]").selectOption("Unreadable");
assert.equal(
  await page.locator("[data-image-quality]").inputValue(),
  "Unreadable",
);
await page.locator('[data-action="analyze"]').click();
await page.locator('[data-action="cancel-ocr"]').click();
await page.waitForFunction(() => !document.querySelector("dialog[open]"));
assert.equal(await page.locator(".upload-card").count(), 1);
await page.locator("[data-remove]").click();
assert.equal(await page.locator(".upload-card").count(), 0);
await page.locator('[data-action="cancel-capture"]').click();
await visit("/dashboard/scans/demo-oats?version=999");
await page.getByRole("link", { name: "Latest report" }).click();
await page.locator(".finding").first().waitFor();
await visit("/dashboard");
await page.locator('[data-action="new"]').click();
await page.locator("#product-name").waitFor();
assert.equal(await page.locator("#product-name").inputValue(), "");
await page.locator('[data-action="cancel-capture"]').click();
await page.setViewportSize({ width: 390, height: 844 });
await visit("/dashboard");
for (const method of ["close", "escape", "backdrop"]) {
  await page.locator(".menu-toggle").click();
  if (method === "close") await page.locator(".menu-close").click();
  if (method === "escape") await page.keyboard.press("Escape");
  if (method === "backdrop")
    await page
      .locator(".menu-backdrop")
      .click({ position: { x: 380, y: 500 } });
  assert.equal(
    await page
      .locator(".workspace-sidebar")
      .evaluate((e) => e.classList.contains("menu-open")),
    false,
  );
}
assert.deepEqual(errors, []);
console.log(
  "PASS: complete PDF download, zoom/filter controls, queue-specific rescans, evidence modal, notifications, drafts, import rejection, clear/cancel/reload samples, invalid uploads, OCR cancellation, removal, history recovery and all mobile dismiss controls.",
);
await browser.close();
