import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome" });
try {
  const ctx = await browser.newContext();
  const old = await ctx.newPage();
  await old.route("**/dashboard/legacy", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Older LabelProof tab</h1>",
    }),
  );
  await old.goto(origin + "/dashboard/legacy");
  await old.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("labelproof-workspace-v2", 1);
        r.onupgradeneeded = () => {
          for (const name of [
            "scans",
            "images",
            "assessments",
            "events",
            "settings",
            "drafts",
          ])
            r.result.createObjectStore(name, { keyPath: "id" });
        };
        r.onsuccess = () => {
          window.legacyDB = r.result;
          const tx = r.result.transaction("settings", "readwrite");
          tx.objectStore("settings").put({
            id: "preferences",
            initialized: true,
            workspaceName: "Preserved from older app",
            reviewerName: "Original reviewer",
            language: "eng",
            confidenceThreshold: 35,
          });
          tx.oncomplete = resolve;
        };
        r.onerror = () => reject(r.error);
      }),
  );
  const page = await ctx.newPage();
  await page.goto(origin + "/dashboard");
  await page
    .getByRole("heading", { name: "Finishing your workspace update." })
    .waitFor();
  assert.equal(
    await page.getByText("Browser storage is unavailable.").count(),
    0,
  );
  await page
    .getByRole("button", { name: "Refresh other LabelProof tabs" })
    .click();
  await page
    .getByRole("heading", { name: "Your labels, brought into focus." })
    .waitFor({ timeout: 30000 });
  assert.ok(
    (await page.locator(".workspace").textContent()).includes(
      "Preserved from older app",
    ),
  );
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("labelproof-workspace-v2", 3);
        r.onsuccess = () => {
          r.result.close();
          resolve();
        };
        r.onerror = () => reject(r.error);
      }),
  );
  await page
    .getByRole("heading", { name: "A workspace update is ready." })
    .waitFor();
  await ctx.close();
  const denied = await browser.newContext();
  await denied.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", {
      value: {
        open() {
          throw new DOMException("Test denied storage", "SecurityError");
        },
      },
    }),
  );
  const blocked = await denied.newPage();
  await blocked.goto(origin + "/dashboard");
  await blocked
    .getByRole("heading", { name: "Browser storage is unavailable." })
    .waitFor();
  const reload = blocked.waitForEvent("framenavigated", {
    predicate: (frame) => frame === blocked.mainFrame(),
  });
  await blocked.getByRole("button", { name: "Retry", exact: true }).click();
  await reload;
  await denied.close();
  console.log(
    "PASS: older-tab upgrade recovery, retained preferences, version-change release, and functional retry for denied storage.",
  );
} finally {
  await browser.close();
}
