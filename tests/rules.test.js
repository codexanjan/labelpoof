import test from "node:test";
import assert from "node:assert/strict";
import { assess, summary, validateReview, validateBox } from "../src/rules.js";
test("uncaptured surfaces never become missing declarations", () => {
  const result = assess([]);
  assert.ok(result.every((f) => f.status === "not_captured"));
  assert.equal(summary(result).missing, 0);
});
test("OCR non-detection on readable surface requires review", () => {
  const result = assess([
    { id: "b", surface: "Back", text: "ordinary text", quality: "Readable" },
  ]);
  assert.equal(result.find((f) => f.key === "price").status, "review");
});
test("unreadable surface remains unresolved", () => {
  const result = assess([
    { id: "b", surface: "Back", text: "", quality: "Unreadable" },
  ]);
  assert.equal(result.find((f) => f.key === "price").status, "unreadable");
  assert.equal(summary(result).missing, 0);
});
test("observed declarations retain source image", () => {
  const result = assess([
    { id: "b", surface: "Back", text: "MRP: Rs. 180.00", quality: "Readable" },
  ]);
  const price = result.find((f) => f.key === "price");
  assert.equal(price.status, "observed");
  assert.equal(price.imageId, "b");
  assert.equal(price.value, "MRP: Rs. 180.00");
});
test("serving size is not extracted as net quantity", () => {
  const result = assess([
    {
      id: "b",
      surface: "Back",
      text: "Serving size 30 g",
      quality: "Readable",
    },
  ]);
  assert.notEqual(result.find((f) => f.key === "quantity").status, "observed");
});
test("different values across images preserve conflicting observations", () => {
  const result = assess([
    { id: "a", surface: "Back", text: "MRP: Rs. 180.00", quality: "Readable" },
    { id: "b", surface: "Back", text: "MRP: Rs. 200.00", quality: "Readable" },
  ]);
  const f = result.find((f) => f.key === "price");
  assert.equal(f.status, "conflicting");
  assert.equal(f.observations.length, 2);
  assert.equal(summary(result).missing, 0);
});
test("unreadable evidence does not become a trusted observation", () => {
  const result = assess([
    {
      id: "a",
      surface: "Back",
      text: "MRP: Rs. 180.00",
      quality: "Unreadable",
    },
  ]);
  assert.equal(result.find((f) => f.key === "price").status, "unreadable");
});
test("absence requires applicability, coverage, images and rationale", () => {
  const base = {
    status: "missing",
    value: "",
    note: "Reviewed all areas",
    coverageConfirmed: true,
    applicability: "applies",
    imageId: "a",
    imageIds: ["a"],
  };
  assert.equal(validateReview(base), null);
  for (const [key, value] of [
    ["applicability", "unknown"],
    ["coverageConfirmed", false],
    ["note", ""],
    ["imageIds", []],
  ])
    assert.ok(validateReview({ ...base, [key]: value }));
});
test("observed corrections require linked evidence", () => {
  assert.ok(
    validateReview({
      status: "observed",
      value: "180",
      note: "Confirmed",
      imageId: null,
      imageIds: ["a"],
    }),
  );
});
test("not applicable needs explicit applicability and reason", () => {
  assert.ok(
    validateReview({
      status: "not_applicable",
      value: "",
      note: "",
      applicability: "unknown",
      imageIds: [],
    }),
  );
  assert.equal(
    validateReview({
      status: "not_applicable",
      value: "",
      note: "Reviewed category exception",
      applicability: "does_not_apply",
      imageIds: [],
    }),
    null,
  );
});
test("highlights stay within image dimensions", () => {
  assert.equal(validateBox({ x0: 0, y0: 0, x1: 100, y1: 100 }, 100, 100), true);
  assert.equal(
    validateBox({ x0: 10, y0: 10, x1: 5, y1: 100 }, 100, 100),
    false,
  );
  assert.equal(
    validateBox({ x0: 0, y0: 0, x1: 101, y1: 100 }, 100, 100),
    false,
  );
});
