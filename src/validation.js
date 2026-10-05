export function validateDeclarations(findings) {
  return findings.map((f) => {
    let result = "not_evaluated",
      note =
        "Readable observed text and reviewed legal applicability are required.";
    if (f.status === "observed") {
      result = "needs_legal_review";
      note = "Text observed. Format checks do not establish legal compliance.";
      if (f.key === "licence") {
        const n = (f.value || "").replace(/\D/g, "");
        result = n.length === 14 ? "format_plausible" : "format_issue";
        note =
          n.length === 14
            ? "14 digits detected. Authenticity and applicability not verified."
            : "Expected 14 digits for a candidate FSSAI licence number; inspect the original image.";
      }
      if (f.key === "price") {
        result = /\d/.test(f.value) ? "format_plausible" : "format_issue";
        note =
          "Check the full price declaration, currency, tax wording and operative requirement.";
      }
    }
    return { key: f.key, result, note, legalValidated: false };
  });
}
