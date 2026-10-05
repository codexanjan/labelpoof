export default function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    application: "LabelProof",
    version: "3.0.0",
    status: "ok",
    storage: "browser-indexeddb",
    ocr: "browser-tesseract",
    cloudConfigured: !!(
      process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
    ),
    processing: "resumable-browser-jobs",
    automaticExternalAlerts: false,
    legalRulePack: "not-published",
    registryVerification: "not-connected",
  });
}
