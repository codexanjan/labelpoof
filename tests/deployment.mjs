import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const origin = process.env.TEST_URL || 'https://labelproof-prototype.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/dashboard', '/dashboard/scans', '/dashboard/new', '/dashboard/review', '/dashboard/evidence', '/dashboard/reports', '/dashboard/analytics', '/dashboard/rules', '/dashboard/activity', '/dashboard/settings', '/dashboard/scans/demo-oats']) {
    const response = await page.goto(origin + path);
    assert.equal(response.status(), 200, path);
    await page.locator('main h1').waitFor();
    console.log('PASS ' + path);
  }
  await page.waitForFunction(() => document.querySelector('#evidence-img')?.naturalWidth > 0);
  const health = await page.request.get(origin + '/api/health');
  assert.equal(health.status(), 200);
  assert.equal((await health.json()).version, '2.0.0');
  const sourceResponse = await page.request.get(origin + '/api/sources');
  assert.equal(sourceResponse.status(), 200);
  const manifest = await sourceResponse.json();
  assert.equal(manifest.declarations.length, 12);
  assert.equal(manifest.legalValidation, 'not-validated');
  assert.deepEqual(errors, []);
  console.log('PASS live routes, loaded evidence images and metadata APIs; no runtime errors.');
} finally {
  await browser.close();
}
