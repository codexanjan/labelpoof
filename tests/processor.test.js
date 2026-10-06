import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readEvidence, reportBundle } from "../server/processor.js";
test("remote OCR accepts only the private project signed-image endpoint", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  await assert.rejects(
    readEvidence({ downloadUrl: "https://example.test/secret" }, 0, "scan", {}),
    /Untrusted evidence source/,
  );
});
test("phone EXIF orientation produces evidence dimensions and highlights matching the displayed photo", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  const bytes = await sharp({
    create: { width: 200, height: 100, channels: 3, background: "white" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(bytes);
  try {
    const image = await readEvidence(
      {
        downloadUrl:
          "https://example.supabase.co/storage/v1/object/sign/labelproof-evidence/test?token=test",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        surface: "Back",
        language: "eng",
      },
      0,
      "scan",
      {
        recognize: async (input) => {
          const m = await sharp(input).metadata();
          assert.equal(m.width, 100);
          assert.equal(m.height, 200);
          return {
            data: {
              confidence: 90,
              text: "MRP: Rs. 180",
              blocks: [
                {
                  paragraphs: [
                    {
                      lines: [
                        {
                          text: "MRP: Rs. 180",
                          confidence: 90,
                          bbox: { x0: 5, y0: 10, x1: 95, y1: 30 },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          };
        },
      },
    );
    assert.equal(image.width, 100);
    assert.equal(image.height, 200);
    assert.equal(image.lines[0].bbox.x1, 95);
    const bundle = reportBundle(
      { id: "test", request: { name: "Phone photo" } },
      [image],
    );
    assert.equal(
      bundle.assessment.findings.find((f) => f.key === "price").status,
      "observed",
    );
    assert.equal(
      bundle.assessment.findings.find((f) => f.key === "date").status,
      "not_captured",
    );
    assert(bundle.assessment.findings.every((f) => f.status !== "missing"));
  } finally {
    global.fetch = originalFetch;
  }
});
test("remote OCR rejects changed evidence bytes and disguised uploads", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  const originalFetch = global.fetch;
  try {
    const input = {
      downloadUrl:
        "https://example.supabase.co/storage/v1/object/sign/labelproof-evidence/test",
    };
    global.fetch = async () => new Response("not an image");
    await assert.rejects(
      readEvidence({ ...input, sha256: "0".repeat(64) }, 0, "scan", {}),
      /hash does not match/,
    );
    await assert.rejects(
      readEvidence(
        {
          ...input,
          sha256: createHash("sha256").update("not an image").digest("hex"),
        },
        0,
        "scan",
        {},
      ),
      /unsupported image format/i,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
