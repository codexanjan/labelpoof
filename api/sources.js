import { sources, fields, RULE_PACK } from "../src/rules.js";
export default function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "public, max-age=300");
  return res
    .status(200)
    .json({
      rulePack: RULE_PACK,
      legalValidation: "not-validated",
      sources,
      declarations: fields.map(({ pattern, ...field }) => field),
    });
}
