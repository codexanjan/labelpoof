export const sources = [
  {
    id: "lm",
    name: "Legal Metrology",
    authority: "Department of Consumer Affairs",
    url: "https://consumeraffairs.gov.in/pages/legal-metrology-act",
    description:
      "Packaged commodity rules and amendments. Check operative text, category scope and exceptions before a legal conclusion.",
  },
  {
    id: "fssai",
    name: "FSSAI labelling",
    authority: "Food Safety and Standards Authority of India",
    url: "https://fssai.gov.in/food-law/regulations/amendments/labelling-display",
    description:
      "Food labelling and display regulations and amendments. Category applicability and effective dates need review.",
  },
  {
    id: "bis",
    name: "BIS certification",
    authority: "Bureau of Indian Standards",
    url: "https://www.bis.gov.in/bis-apps/?lang=en",
    description:
      "Official licence verification resources. A photographed mark or number is not proof of certification. No registry verification runs in this prototype.",
  },
];
export const RULE_PACK = "declaration-observations-2.0";
export const PIPELINE = "browser-ocr-2.0";
export const surfaces = [
  "Front",
  "Back",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Wraparound",
];
export const statusLabels = {
  observed: "Observed",
  unreadable: "Unreadable",
  not_captured: "Not photographed",
  review: "Needs review",
  conflicting: "Conflicting",
  missing: "Potential issue",
  not_applicable: "Not applicable",
};
export const fields = [
  {
    key: "quantity",
    name: "Net quantity",
    pattern:
      /\b(?:net\s*(?:wt\.?|weight|quantity)\s*[:.]?\s*)\d+(?:\.\d+)?\s*(?:kg|g|ml|litres?|l)\b/i,
    source: "lm",
    surface: "Front",
    help: "Look for the declared net quantity and unit, not a serving size.",
  },
  {
    key: "price",
    name: "Retail price (MRP)",
    pattern: /\bM\.?R\.?P\.?\s*[:.]?\s*(?:Rs\.?|₹|INR)?\s*\d+(?:\.\d+)?/i,
    source: "lm",
    surface: "Back",
    help: "Read the complete printed price declaration. OCR does not establish compliance of its presentation.",
  },
  {
    key: "manufacturer",
    name: "Manufacturer details",
    pattern: /(?:manufactured|packed)\s+by[^\n]{3,160}/i,
    source: "lm",
    surface: "Back",
    help: "Review the relevant manufacturer, packer or importer name and address, subject to category applicability.",
  },
  {
    key: "licence",
    name: "FSSAI declaration",
    pattern: /FSSAI[^\n]{3,80}/i,
    source: "fssai",
    surface: "Back",
    help: "Observe the declaration. Format recognition does not verify the licence or its validity.",
  },
  {
    key: "batch",
    name: "Batch / lot number",
    pattern: /\b(?:batch|lot)\s*(?:no\.?|number)?\s*[:.]?\s*[A-Z0-9-]{2,30}/i,
    source: "fssai",
    surface: "Bottom",
    help: "Look for inkjet or embossed coding on seams, necks, lids and bases.",
  },
  {
    key: "date",
    name: "Date marking",
    pattern: /(?:best\s*before|use\s*by|expiry|exp\.?|packed\s*on)[^\n]{3,80}/i,
    source: "fssai",
    surface: "Bottom",
    help: "Read the complete applicable date statement. A blurry date remains unresolved.",
  },
  {
    key: "ingredients",
    name: "Ingredients",
    pattern: /ingredients\s*[:.]?[^\n]{4,200}/i,
    source: "fssai",
    surface: "Back",
    help: "Check the ingredients panel. Exemptions and order requirements are not automatically assessed.",
  },
  {
    key: "care",
    name: "Consumer care",
    pattern: /(?:consumer\s*care|customer\s*care|contact\s*us)[^\n]{3,160}/i,
    source: "lm",
    surface: "Right",
    help: "Look for contact details, subject to applicable requirements.",
  },
  {
    key: "nutrition",
    name: "Nutrition declaration",
    pattern:
      /(?:nutrition(?:al)?\s*(?:information|facts)|energy\s*[:.]?\s*\d+)[^\n]{0,180}/i,
    source: "fssai",
    surface: "Back",
    help: "OCR finds declaration text. It does not validate nutrition values or every required nutrient.",
  },
  {
    key: "allergen",
    name: "Allergen declaration",
    pattern: /(?:contains\s*:|allergens?\s*[:.]?|may\s*contain)[^\n]{3,140}/i,
    source: "fssai",
    surface: "Back",
    help: "Applicability depends on ingredients and category. Non-detection is not automatically an issue.",
  },
  {
    key: "origin",
    name: "Origin declaration",
    pattern:
      /(?:country\s*of\s*origin|product\s*of|made\s*in)\s*[:.]?[^\n]{3,100}/i,
    source: "lm",
    surface: "Back",
    help: "Confirm imported status and applicable requirements. This is not universally mandatory for every product.",
  },
  {
    key: "storage",
    name: "Storage instructions",
    pattern: /(?:store\s+in|storage\s*[:.]?|keep\s+refrigerated)[^\n]{3,160}/i,
    source: "fssai",
    surface: "Back",
    help: "Category and product conditions determine applicability. Text detection alone is not a legal check.",
  },
];
export function assess(images) {
  return fields.map((field) => {
    const observations = [];
    for (const image of images) {
      const match = image.text?.match(field.pattern);
      if (!match) continue;
      const line = image.lines?.find((l) =>
        l.text.toLowerCase().includes(match[0].slice(0, 12).toLowerCase()),
      );
      observations.push({
        value: match[0].trim(),
        imageId: image.id,
        box: line?.bbox || null,
        confidence: line?.confidence ?? image.confidence ?? null,
      });
    }
    const relevant = images.filter(
      (i) => i.surface === field.surface || i.surface === "Wraparound",
    );
    const distinct = new Set(
      observations.map((o) => o.value.replace(/\s+/g, " ").toLowerCase()),
    );
    const observation = observations[0];
    let status = observation
      ? distinct.size > 1
        ? "conflicting"
        : "observed"
      : !relevant.length
        ? "not_captured"
        : relevant.every((i) => i.quality === "Unreadable")
          ? "unreadable"
          : "review";
    if (
      observation &&
      observations.every(
        (o) => images.find((i) => i.id === o.imageId)?.quality === "Unreadable",
      )
    )
      status = "unreadable";
    return {
      key: field.key,
      name: field.name,
      source: field.source,
      surface: field.surface,
      status,
      applicability: "unknown",
      value: observation?.value || "",
      imageId: observation?.imageId || relevant[0]?.id || null,
      box: observation?.box || null,
      observations,
      humanConfirmed: false,
      reviewNote: "",
      registryVerification:
        field.key === "licence" ? "NOT_ATTEMPTED" : undefined,
    };
  });
}
export function summary(findings = []) {
  return {
    observed: findings.filter((f) => f.status === "observed").length,
    unresolved: findings.filter(
      (f) => !["observed", "missing", "not_applicable"].includes(f.status),
    ).length,
    missing: findings.filter((f) => f.status === "missing").length,
    notApplicable: findings.filter((f) => f.status === "not_applicable").length,
    total: findings.length,
  };
}
export function validateReview({
  status,
  value,
  note,
  coverageConfirmed,
  applicability,
  imageId,
  imageIds,
}) {
  if (!Object.hasOwn(statusLabels, status))
    return "Choose a valid observation status.";
  if (
    status === "observed" &&
    (!value.trim() || !imageId || !imageIds.includes(imageId))
  )
    return "Enter the observed text and link an available source image.";
  if (
    status === "missing" &&
    (!coverageConfirmed ||
      !note.trim() ||
      applicability !== "applies" ||
      !imageIds.length)
  )
    return "A potential absence issue needs confirmed applicability, readable coverage, images and a review rationale.";
  if (
    status === "not_applicable" &&
    (!note.trim() || applicability !== "does_not_apply")
  )
    return "Explain why the requirement does not apply and choose “Does not apply”.";
  if (!note.trim()) return "Add a review note so the change is traceable.";
  return null;
}
export function validateBox(box, width, height) {
  return (
    box &&
    [box.x0, box.y0, box.x1, box.y1].every(Number.isFinite) &&
    box.x0 >= 0 &&
    box.y0 >= 0 &&
    box.x1 > box.x0 &&
    box.y1 > box.y0 &&
    box.x1 <= width &&
    box.y1 <= height
  );
}
