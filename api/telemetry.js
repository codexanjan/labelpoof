export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const origin = req.headers?.origin;
  if (origin && origin !== "https://labelproof-prototype.vercel.app")
    return res.status(403).json({ error: "Origin rejected" });
  const body = req.body;
  if (
    !body ||
    typeof body.code !== "string" ||
    !/^LP_[A-Z_]{1,50}$/.test(body.code)
  )
    return res.status(400).json({ error: "Invalid diagnostic" });
  console.warn(
    JSON.stringify({
      application: "LabelProof",
      code: body.code,
      at: new Date().toISOString(),
    }),
  );
  return res.status(202).json({ accepted: true });
}
