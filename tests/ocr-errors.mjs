import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173/dashboard");
await page.locator("main h1").waitFor();
const result = await page.evaluate(async () => {
  const { readImages } = await import("/src/ocr.js");
  try {
    await readImages(
      [{ url: "data:image/png;base64,AAAA", surface: "Back" }],
      { language: "eng", confidenceThreshold: 35 },
      () => {},
    );
    return "unexpected success";
  } catch (e) {
    return String(e.message || e);
  }
});
assert.notEqual(result, "unexpected success");
const cancelled = await page.evaluate(async () => {
  const { readImages } = await import("/src/ocr.js");
  const c = new AbortController();
  c.abort();
  try {
    await readImages(
      [{ url: "invalid", surface: "Back" }],
      {},
      () => {},
      c.signal,
    );
    return false;
  } catch (e) {
    return e.name === "AbortError";
  }
});
assert.equal(cancelled, true);
assert.deepEqual(errors, []);
console.log(
  "PASS: OCR recognition failures reject safely; pre-cancelled jobs stop without runtime errors.",
);
await browser.close();
