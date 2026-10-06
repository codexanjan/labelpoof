import { timingSafeEqual } from "node:crypto";
import { processQueue } from "../server/processor.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST required" });
  const provided = Buffer.from(String(req.headers.authorization || ""));
  const expected = Buffer.from(
    "Bearer " + (process.env.LABELPROOF_WORKER_SECRET || ""),
  );
  if (
    !process.env.LABELPROOF_WORKER_SECRET ||
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  )
    return res.status(401).json({ error: "Worker authentication required" });
  try {
    return res.status(200).json(await processQueue());
  } catch {
    return res
      .status(503)
      .json({
        error: "Worker temporarily unavailable. Saved jobs will retry.",
      });
  }
}
