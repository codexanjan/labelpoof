export default function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    application: "LabelProof",
    version: "3.4.0",
    status: "ok",
    storage: "browser-indexeddb",
    ocr: process.env.LABELPROOF_WORKER_SECRET
      ? "server-and-browser-tesseract"
      : "browser-tesseract",
    cloudConfigured: !!(
      process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
    ),
    processing: process.env.LABELPROOF_WORKER_SECRET
      ? "durable-cloud-queue-and-browser-jobs"
      : "resumable-browser-jobs",
    accountCacheIsolation: true,
    cloudRestorePoints: true,
    reviewVersionChecks: true,
    automaticExternalAlerts: false,
    legalRulePack: "not-published",
    registryVerification: "not-connected",
  });
}
