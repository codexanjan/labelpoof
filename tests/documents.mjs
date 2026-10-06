import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.goto(origin + "/dashboard/documents");
  await page.getByRole("heading", { name: "Work that can recover." }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/dashboard/processing");
  assert.equal(
    await page
      .getByRole("link", { name: "Project documents", exact: true })
      .count(),
    0,
  );
  for (const file of readdirSync("public/documents")) {
    const response = await page.request.get(origin + "/documents/" + file);
    assert.equal(response.status(), 200, file);
    const body = await response.body();
    if (file.endsWith(".pdf"))
      assert.equal(body.subarray(0, 5).toString(), "%PDF-");
    else if (file.endsWith(".zip"))
      assert.equal(body.subarray(0, 2).toString(), "PK");
    else assert(body.length > 1000, file);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  console.log(
    "PASS old document route opens working processing tools; reference artifacts remain downloadable separately",
  );
} finally {
  await browser.close();
}
