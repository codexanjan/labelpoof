import test from "node:test";
import assert from "node:assert/strict";
import { validateBackup, findingsCSV } from "../src/exports.js";
import { assess, sources } from "../src/rules.js";
const fixture = () => ({
  format: "labelproof-workspace",
  schemaVersion: 2,
  scans: [
    {
      id: "scan",
      name: "Test food",
      brand: "Test",
      category: "Other packaged food",
      createdAt: "2026-10-05T00:00:00Z",
      updatedAt: "2026-10-05T00:00:00Z",
      latestAssessmentId: "a",
    },
  ],
  images: [
    {
      id: "i",
      scanId: "scan",
      width: 600,
      height: 900,
      fixture: "/images/oats-label.svg",
    },
  ],
  assessments: [
    {
      id: "a",
      scanId: "scan",
      version: 1,
      createdAt: "2026-10-05T00:00:00Z",
      imageIds: ["i"],
      findings: assess([
        {
          id: "i",
          surface: "Back",
          text: "MRP: Rs. 180.00",
          quality: "Readable",
        },
      ]),
    },
  ],
});
test("valid backup is accepted", () =>
  assert.equal(validateBackup(fixture()).schemaVersion, 2));
test("remote image URLs cannot be imported", () => {
  const f = fixture();
  f.images[0].fixture = "https://attacker.test/track.svg";
  assert.throws(() => validateBackup(f), /fixture/);
});
test("missing evidence references are rejected", () => {
  const f = fixture();
  f.assessments[0].imageIds = ["missing"];
  assert.throws(() => validateBackup(f), /references/);
});
test("unreviewed absence cannot enter through backup", () => {
  const f = fixture();
  f.assessments[0].findings[0].status = "missing";
  assert.throws(() => validateBackup(f), /coverage/);
});
test("CSV escapes formulas and commas", () => {
  const csv = findingsCSV(
    { name: '=HYPERLINK("evil")' },
    {
      version: 1,
      findings: [
        {
          name: "Quantity",
          status: "observed",
          value: "400 g, packed",
          source: "lm",
        },
      ],
    },
    sources,
  );
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('"400 g, packed"'));
});
