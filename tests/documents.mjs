import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin + "/dashboard/documents");
  await page.getByRole("heading", { name: "Everything needed to build and review." }).waitFor();
  const files = await page.locator("main a[download]").evaluateAll(links => links.map(a => a.getAttribute("href")));
  assert.equal(files.length, 13);
  for (const path of files) {
    const response = await page.request.get(origin + path);
    assert.equal(response.status(), 200, path);
    const body = await response.body();
    if (path.endsWith(".pdf")) {
      assert.match(response.headers()["content-type"], /pdf/);
      assert.equal(body.subarray(0, 5).toString(), "%PDF-");
      assert(body.length > 10000);
    } else if (path.endsWith(".zip")) {
      assert.equal(body.subarray(0, 2).toString(), "PK");
    } else {
      assert(body.length > 1000, path);
      assert(!body.toString().includes("<div id=\"app\""), path);
    }
  }
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download all documents ZIP", exact: true }).click();
  assert.equal((await download).suggestedFilename(), "LabelProof-documentation.zip");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator("main h1").waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator(".menu-toggle").click();
  await page.getByRole("link", { name: "Project documents", exact: true }).click();
  assert.equal(await page.locator(".workspace-sidebar").evaluate(e => e.classList.contains("menu-open")), false);
  assert.deepEqual(errors, []);
  console.log("PASS five PDF and Markdown documents, complete package, master prompt, verification, real download and mobile navigation");
} finally { await browser.close(); }
