import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("../../work", { recursive: true });
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const fixture = async (price, path) => {
  await page.setContent(
    `<div style="padding:45px;font:26px Arial;background:white;color:black;width:800px;line-height:1.9">TEST FOOD LABEL<br>Net Wt. 400 g<br>MRP: Rs. ${price}.00<br>Manufactured by Demo Foods Pune 411001<br>FSSAI: 12345678901234<br>Ingredients: Wholegrain oats<br>Consumer care: care@example.test<br>Batch no: OG2601<br>Best before: 31 December 2027<br>Nutrition information: Energy 380 kcal<br>Contains: oats<br>Country of origin: India<br>Store in a cool dry place</div>`,
  );
  await page.locator("div").screenshot({ path });
};
await fixture(180, "../../work/ocr-180.png");
await fixture(200, "../../work/ocr-200.png");
await page.goto(origin + "/dashboard/new");
await page.locator("#product-name").fill("Real OCR workflow test");
await page.locator("#surface").selectOption("Back");
await page.locator("#file").setInputFiles("../../work/ocr-180.png");
await page.getByRole("button", { name: "Review label", exact: true }).click();
await page
  .getByRole("heading", { name: "Real OCR workflow test", exact: true })
  .waitFor({ timeout: 120000 });
const url = page.url();
const observed = await page.locator(".finding-icon.observed").count();
assert.ok(observed >= 9, `Expected 9+ OCR fields; got ${observed}`);
assert.ok(
  (await page.locator(".ocr-details").textContent()).includes("Tesseract.js 6"),
);
await page.reload();
await page
  .getByRole("heading", { name: "Real OCR workflow test", exact: true })
  .waitFor();
assert.equal(await page.locator("#evidence-img").count(), 1);
assert.ok(
  await page
    .locator("#evidence-img")
    .evaluate((img) => img.complete && img.naturalWidth > 0),
);
await page.locator("[data-rescan]").click();
await page.locator("#surface").selectOption("Back");
await page.locator("#file").setInputFiles("../../work/ocr-200.png");
await page.getByRole("button", { name: "Reassess label", exact: true }).click();
await page
  .getByRole("heading", { name: "Real OCR workflow test", exact: true })
  .waitFor({ timeout: 120000 });
await page.locator('[data-finding="price"]').click();
assert.ok(
  (await page.locator(".finding.selected").textContent()).includes(
    "Conflicting",
  ),
);
assert.equal(await page.locator(".conflict-list button").count(), 2);
await page.locator("#assessment-version").selectOption("1");
await page.waitForFunction(() =>
  document.querySelector(".page-heading")?.textContent.includes("v1"),
);
assert.ok(
  (await page.locator(".finding.selected").textContent()).includes("180.00"),
);
await page.goto(origin + "/dashboard/settings");
await page
  .getByRole("heading", { name: "Make this workspace yours." })
  .waitFor();
const downloaded = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Export full backup with images" })
  .click();
await (await downloaded).saveAs("../../work/ocr-workspace.json");
await page
  .locator("#backup-file")
  .setInputFiles("../../work/ocr-workspace.json");
await page.getByRole("heading", { name: "Every scan has a story." }).waitFor();
await page.locator("#scan-search").fill("Real OCR workflow test");
assert.equal(await page.locator(".scan-results tbody tr").count(), 2);
await page.locator(".product-link").last().click();
await page
  .getByRole("heading", { name: "Real OCR workflow test", exact: true })
  .waitFor();
assert.ok(
  await page
    .locator("#evidence-img")
    .evaluate((img) => img.complete && img.naturalWidth > 0),
);
await page.locator('[data-finding="price"]').click();
assert.equal(await page.locator(".conflict-list button").count(), 2);
await page.locator(".conflict-list button").last().click();
await page.getByRole("button", { name: "Delete this local product" }).click();
await page.getByRole("button", { name: "Delete product", exact: true }).click();
await page.getByRole("heading", { name: "Every scan has a story." }).waitFor();
console.log(
  `PASS: real OCR (${observed}/12 fields), original image persistence, SHA provenance, rescan conflicts, historic reports, full image backup/import and individual deletion.`,
);
await browser.close();
