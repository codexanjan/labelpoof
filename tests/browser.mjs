import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir("docs/images", { recursive: true });
await mkdir("../../work", { recursive: true });
const shot = async (name) => {
  await page.screenshot({ path: `docs/images/${name}.png`, fullPage: true });
};
await page.goto(origin);
await page.getByRole("heading", { name: /Every label/ }).waitFor();
await shot("landing");
await page
  .getByRole("link", { name: "Open dashboard", exact: false })
  .first()
  .click();
await page
  .getByRole("heading", { name: "Your labels, brought into focus." })
  .waitFor();
assert.equal(await page.locator(".workspace-sidebar nav a").count(), 9);
assert.equal(await page.locator(".recent tbody tr").count(), 3);
await shot("dashboard");
await page.goto(origin + "/dashboard/scans/demo-oats?field=date");
await page
  .getByRole("heading", { name: "Honestly Good Oats", exact: true })
  .waitFor();
assert.ok(
  (await page.locator(".finding-detail").textContent()).includes(
    "insufficient",
  ),
);
await page.locator('[data-finding="batch"]').click();
assert.ok(
  (await page.locator(".finding.selected").textContent()).includes(
    "Not photographed",
  ),
);
await page.locator('[data-finding="price"]').click();
assert.equal(await page.locator(".evidence-box").count(), 1);
await shot("evidence-report");
await page.getByRole("button", { name: "Review / correct" }).click();
await page.locator("#review-status").selectOption("missing");
await page.getByRole("button", { name: "Save review", exact: true }).click();
assert.equal(await page.locator("dialog[open]").count(), 1);
await page.locator("#review-status").selectOption("observed");
await page.locator("#correction").fill("MRP: Rs. 180.00");
await page
  .locator("#review-note")
  .fill("Confirmed the printed price in the synthetic image.");
await page.getByRole("button", { name: "Save review", exact: true }).click();
await page.waitForFunction(() =>
  document.querySelector(".page-heading")?.textContent.includes("v2"),
);
await page.reload();
await page
  .getByRole("heading", { name: "Honestly Good Oats", exact: true })
  .waitFor();
assert.ok(
  (await page.locator(".finding-detail").textContent()).includes(
    "Confirmed the printed price",
  ),
);
assert.equal(await page.locator("#evidence-img").count(), 1);
await page.locator("#assessment-version").selectOption("1");
await page.waitForFunction(() =>
  document.querySelector(".page-heading")?.textContent.includes("v1"),
);
assert.equal(
  await page.getByRole("button", { name: "Review / correct" }).isDisabled(),
  true,
);
await page.locator("#assessment-version").selectOption("2");
await page.waitForFunction(() =>
  document.querySelector(".page-heading")?.textContent.includes("v2"),
);
const reportDownload = page.waitForEvent("download");
await page.getByRole("button", { name: "JSON", exact: true }).click();
assert.equal(
  (await reportDownload).suggestedFilename(),
  "labelproof-report.json",
);
const csvDownload = page.waitForEvent("download");
await page.getByRole("button", { name: "CSV", exact: true }).click();
assert.equal(
  (await csvDownload).suggestedFilename(),
  "labelproof-findings.csv",
);
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: "docs/sample-report.pdf",
  format: "A4",
  printBackground: true,
});
await page.emulateMedia({ media: "screen" });
await page.locator('[data-rescan="demo-oats"]').click();
await page
  .getByRole("heading", { name: "Let’s see the whole picture." })
  .waitFor();
assert.equal(await page.locator(".upload-card").count(), 1);
await shot("guided-capture");
for (const [path, title, image] of [
  ["review", "Make uncertainty actionable.", "review-queue"],
  ["evidence", "The evidence behind every finding.", "evidence-library"],
  ["reports", "Reports that remember the evidence.", "reports"],
  ["analytics", "See the gaps. Find the next step.", "analytics"],
  ["rules", "Public rules. Traceable references.", "rule-library"],
  ["settings", "Make this workspace yours.", "settings"],
]) {
  await page.goto(origin + "/dashboard/" + path);
  await page.getByRole("heading", { name: title }).waitFor();
  await shot(image);
}
await page.locator('[name="workspaceName"]').fill("LabelProof Demo Lab");
await page.getByRole("button", { name: "Save preferences" }).click();
await page.waitForFunction(() =>
  document
    .querySelector(".workspace")
    ?.textContent.includes("LabelProof Demo Lab"),
);
const backupDownload = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Export full backup with images" })
  .click();
const backup = await backupDownload;
await backup.saveAs("../../work/workspace-backup.json");
await page
  .locator("#backup-file")
  .setInputFiles("../../work/workspace-backup.json");
await page.getByRole("heading", { name: "Every scan has a story." }).waitFor();
assert.equal(await page.locator(".scan-results tbody tr").count(), 6);
await page.locator("#scan-search").fill("mountain");
assert.equal(await page.locator(".scan-results tbody tr").count(), 2);
await page.goto(origin + "/dashboard/rules");
await page.getByRole("button", { name: "Add review note" }).click();
await page.locator("#draft-title").fill("Review food category exception");
await page
  .locator("#draft-note")
  .fill("Draft source review only; not executable.");
await page.getByRole("button", { name: "Save draft note" }).click();
await page.waitForFunction(() =>
  document
    .querySelector(".rule-drafts")
    ?.textContent.includes("Review food category exception"),
);
await page.reload();
await page
  .getByRole("heading", { name: "Public rules. Traceable references." })
  .waitFor();
assert.ok(
  (await page.locator(".rule-drafts").textContent()).includes(
    "Review food category exception",
  ),
);
await page.setViewportSize({ width: 390, height: 844 });
for (const path of [
  "",
  "/scans",
  "/review",
  "/evidence",
  "/reports",
  "/analytics",
  "/rules",
  "/settings",
]) {
  await page.goto(origin + "/dashboard" + path);
  await page.locator("main h1").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Mobile overflow " + path,
  );
}
await page.goto(origin + "/dashboard");
await page
  .getByRole("heading", { name: "Your labels, brought into focus." })
  .waitFor();
await shot("mobile-dashboard");
await page.getByRole("button", { name: "Toggle navigation" }).click();
assert.ok(
  (await page.locator(".workspace-sidebar").getAttribute("class")).includes(
    "menu-open",
  ),
);
await page.getByRole("link", { name: "Analytics", exact: true }).click();
await page
  .getByRole("heading", { name: "See the gaps. Find the next step." })
  .waitFor();
assert.deepEqual(errors, []);
console.log(
  "PASS: 9 dashboard routes, demo evidence, review guard, immutable versions, reload persistence, JSON/CSV/PDF, recapture, backup import, search, rule drafts, settings and mobile layout.",
);
await browser.close();
