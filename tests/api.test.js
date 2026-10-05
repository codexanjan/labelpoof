import test from "node:test";
import assert from "node:assert/strict";
import health from "../api/health.js";
import sources from "../api/sources.js";
function response() {
  return {
    code: 200,
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("health states prototype integration boundaries", () => {
  const res = response();
  health({ method: "GET" }, res);
  assert.equal(res.body.storage, "browser-indexeddb");
  assert.equal(res.body.legalRulePack, "not-published");
  assert.equal(res.body.registryVerification, "not-connected");
});
test("source manifest includes all detectors without regex code", () => {
  const res = response();
  sources({ method: "GET" }, res);
  assert.equal(res.body.declarations.length, 12);
  assert.equal(res.body.sources.length, 3);
  assert.equal(res.body.legalValidation, "not-validated");
  assert.ok(res.body.declarations.every((d) => !d.pattern));
});
test("metadata APIs reject write methods", () => {
  for (const handler of [health, sources]) {
    const res = response();
    handler({ method: "POST" }, res);
    assert.equal(res.code, 405);
  }
});
