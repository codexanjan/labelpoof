export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  return res
    .status(200)
    .json({
      url: process.env.SUPABASE_URL || null,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
      cloudConfigured: !!(
        process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
      ),
    });
}
