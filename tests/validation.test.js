import test from "node:test";
import assert from "node:assert/strict";
import { validateDeclarations } from "../src/validation.js";
test("format validation never establishes legal compliance", () => {
  const result = validateDeclarations([
    { key: "licence", status: "observed", value: "FSSAI 12345678901234" },
  ])[0];
  assert.equal(result.result, "format_plausible");
  assert.equal(result.legalValidated, false);
});
test("uncaptured declarations remain unevaluated", () =>
  assert.equal(
    validateDeclarations([
      { key: "price", status: "not_captured", value: "" },
    ])[0].result,
    "not_evaluated",
  ));
