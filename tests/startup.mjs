import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const path of ["/dashboard", "/dashboard/documents", "/dashboard/account"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    let release, signalRequest;
    const held = new Promise(resolve => { release = resolve; });
    const requested = new Promise(resolve => { signalRequest = resolve; });
    await page.route("**/api/config", async route => {
      signalRequest();
      await held;
      await route.fulfill({ json: { cloudConfigured: false, url: null, publishableKey: null } });
    });
    try {
      await page.goto(origin + path, { waitUntil: "domcontentloaded" });
      await page.locator("main h1").waitFor({ timeout: 3000 });
      await requested;
      assert.equal(await page.getByRole("heading", { name: "Opening your evidence workspace…" }).count(), 0);
      assert.equal(await page.locator("main h1").count(), 1);
      if (path.endsWith("/account"))
        assert.equal(await page.getByRole("button", { name: "Sign in to demo", exact: true }).isEnabled(), false);
    } finally { release(); await context.close(); }
  }
  console.log("PASS local workspace and documents render while cloud configuration is unavailable or delayed");
} finally { await browser.close(); }
