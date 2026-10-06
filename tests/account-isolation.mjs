import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { DEMO_ACCESS } from "../src/demo-access.js";
const origin =
  process.env.TEST_URL || "https://labelproof-prototype.vercel.app";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (origin.startsWith("http://localhost"))
    await page.route("**/api/config", (r) =>
      r.fulfill({
        json: {
          url: process.env.SUPABASE_URL,
          publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
          cloudConfigured: true,
        },
      }),
    );
  await page.goto(origin + "/dashboard/settings");
  await page
    .locator("[name=workspaceName]")
    .fill("Anonymous workspace sentinel");
  await page.locator("#settings-form button[type=submit]").click();
  await page.goto(origin + "/dashboard/new");
  await page.locator("#product-name").fill("Anonymous draft with photo");
  await page.locator("#file").setInputFiles("tests/fixtures/label-180.png");
  await page.locator(".upload-card").waitFor();
  await page.goto(origin + "/dashboard/account");
  await page.locator("[data-extra=demo]").click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  await page.goto(origin + "/dashboard/new");
  await page.locator("#product-name").waitFor();
  assert.equal(await page.locator("#product-name").inputValue(), "");
  assert.equal(await page.locator(".upload-card").count(), 0);
  await page.goto(origin + "/dashboard/settings");
  assert.equal(
    await page.locator("[name=workspaceName]").inputValue(),
    "My label workspace",
  );
  await page
    .locator("[name=workspaceName]")
    .fill("Demo account workspace sentinel");
  await page.locator("#settings-form button[type=submit]").click();
  await page.goto(origin + "/dashboard/account");
  await page.locator("[data-extra=logout]").click();
  await page
    .getByRole("heading", { name: "Account access", exact: true })
    .waitFor();
  await page.goto(origin + "/dashboard/settings");
  assert.equal(
    await page.locator("[name=workspaceName]").inputValue(),
    "Anonymous workspace sentinel",
  );
  await page.goto(origin + "/dashboard/new");
  assert.equal(
    await page.locator("#product-name").inputValue(),
    "Anonymous draft with photo",
  );
  assert.equal(await page.locator(".upload-card").count(), 1);
  await page.goto(origin + "/dashboard/account");
  await page.locator("[data-extra=demo]").click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  await page.goto(origin + "/dashboard/settings");
  assert.equal(
    await page.locator("[name=workspaceName]").inputValue(),
    "Demo account workspace sentinel",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS real login/logout separates account settings and photo drafts, restores the correct workspace and never merges another account cache",
  );
} finally {
  await browser.close();
}
