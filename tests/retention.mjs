import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const origin = process.env.TEST_URL || "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route("**/api/config", (r) =>
    r.fulfill({
      json: { cloudConfigured: false, url: null, publishableKey: null },
    }),
  );
  await page.goto(origin + "/dashboard/account");
  await page.locator("#retention-auto").waitFor();
  assert.equal(await page.locator("#retention-auto").isChecked(), false);
  await page.locator("#retention-days").fill("1");
  await page.locator("#retention-auto").check();
  await page.locator("[data-extra=retention]").click();
  await page
    .getByText(
      "Retention setting saved. Automatic deletion runs when this workspace opens.",
      { exact: true },
    )
    .waitFor();
  await page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("labelproof-workspace-v2", 2);
      r.onsuccess = () => resolve(r.result);
    });
    const original = await new Promise((resolve) => {
      const r = db.transaction("scans").objectStore("scans").get("demo-oats");
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise((resolve, reject) => {
      const t = db.transaction(
        ["scans", "images", "assessments", "events"],
        "readwrite",
      );
      t.objectStore("scans").put({
        ...original,
        id: "expired-owned-test",
        name: "Expired test product",
        demo: false,
        updatedAt: "2020-01-01T00:00:00Z",
      });
      t.objectStore("images").put({
        id: "expired-photo",
        scanId: "expired-owned-test",
      });
      t.objectStore("assessments").put({
        id: "expired-report",
        scanId: "expired-owned-test",
      });
      t.objectStore("events").put({
        id: "expired-event",
        scanId: "expired-owned-test",
      });
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
    db.close();
  });
  await page.reload();
  await page.locator("main h1").waitFor();
  const remaining = await page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("labelproof-workspace-v2", 2);
      r.onsuccess = () => resolve(r.result);
    });
    const result = [];
    for (const store of ["scans", "images", "assessments", "events"])
      result.push(
        await new Promise((resolve) => {
          const r = db.transaction(store).objectStore(store).getAll();
          r.onsuccess = () => resolve(r.result);
        }),
      );
    db.close();
    return result;
  });
  assert(
    remaining.every(
      (rows) =>
        !rows.some(
          (r) =>
            r.id === "expired-owned-test" || r.scanId === "expired-owned-test",
        ),
    ),
  );
  assert.equal(remaining[0].length, 3);
  assert(remaining[3].some((e) => e.type === "retention"));
  console.log(
    "PASS opt-in retention removes expired product, photo, report and events while preserving samples and recording the deletion",
  );
} finally {
  await browser.close();
}
