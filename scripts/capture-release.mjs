import { readFileSync, copyFileSync } from "node:fs";
import { chromium } from "@playwright/test";
for (const line of readFileSync(".env.cloud-test", "utf8").split(/\r?\n/)) {
  const at = line.indexOf("=");
  if (at > 0) process.env[line.slice(0, at)] ||= line.slice(at + 1);
}
const report = JSON.parse(
  readFileSync("work/production-cloud-verification.json", "utf8"),
);
const origin = "https://labelproof-prototype.vercel.app";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  await page.goto(origin + "/dashboard/account");
  await page.waitForFunction(() => {
    const b = document.querySelector("[data-extra=login]");
    return b && !b.disabled;
  });
  await page.locator("#account-email").fill("lp-cloud-test-1@example.test");
  await page.locator("#account-password").fill(process.env.LP_TEST_PASSWORD);
  await page.locator("[data-extra=login]").click();
  await page.getByRole("heading", { name: "Signed in", exact: true }).waitFor();
  await page.goto(origin + "/dashboard/processing");
  await page.locator("#cloud-job-org").fill(report.org);
  await page.locator("[data-extra=load-cloud-jobs]").click();
  await page
    .locator("#cloud-jobs-list")
    .getByText(/completed/)
    .first()
    .waitFor();
  await page.screenshot({
    path: "docs/images/cloud-processing.png",
    fullPage: false,
  });
  copyFileSync(
    "docs/images/cloud-processing.png",
    "../LabelProof-cloud-processing.png",
  );
  await page.goto(origin + "/dashboard/team");
  await page.locator("#org-id").fill(report.org);
  await page.locator("[data-extra=list-restore-points]").click();
  await page
    .locator("#restore-points")
    .getByText(/Version/)
    .first()
    .waitFor();
  await page.locator("[data-extra=cloud-audit]").click();
  await page
    .locator("#cloud-audit")
    .getByText("ocr_completed", { exact: true })
    .first()
    .waitFor();
  await page.screenshot({
    path: "docs/images/cloud-restore.png",
    fullPage: true,
  });
  console.log("Verified cloud processing and restore screenshots saved");
} finally {
  await browser.close();
}
