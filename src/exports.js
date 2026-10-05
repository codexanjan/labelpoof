import { fields, statusLabels, validateBox } from "./rules.js";
const allowedFixtures = new Set([
  "/images/oats-label.svg",
  "/images/tea-label.svg",
  "/images/snack-label.svg",
]);
const validDate = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const string = (value, max = 200) =>
  typeof value === "string" && value.length <= max;
export async function imageToJSON(image) {
  const { blob, url, ...record } = image;
  if (!blob) return record;
  record.data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return record;
}
export function validateBackup(input) {
  if (
    !input ||
    input.format !== "labelproof-workspace" ||
    input.schemaVersion !== 2
  )
    throw new Error("Use a LabelProof v2 workspace or report backup.");
  if (
    !Array.isArray(input.scans) ||
    input.scans.length > 100 ||
    !Array.isArray(input.images) ||
    input.images.length > 1200 ||
    !Array.isArray(input.assessments) ||
    input.assessments.length > 1000
  )
    throw new Error("Invalid or oversized backup.");
  const scans = new Map(input.scans.map((scan) => [scan.id, scan]));
  const images = new Map(input.images.map((image) => [image.id, image]));
  if (scans.size !== input.scans.length || images.size !== input.images.length)
    throw new Error("Duplicate identifiers in backup.");
  for (const scan of input.scans)
    if (
      !string(scan.id, 100) ||
      !string(scan.name, 120) ||
      !string(scan.brand || "", 100) ||
      !string(scan.category, 100) ||
      !validDate(scan.createdAt) ||
      !validDate(scan.updatedAt)
    )
      throw new Error("Invalid product record.");
  for (const image of input.images) {
    if (
      !string(image.id, 100) ||
      !scans.has(image.scanId) ||
      !Number.isFinite(image.width) ||
      !Number.isFinite(image.height) ||
      image.width < 1 ||
      image.height < 1 ||
      image.width * image.height > 40000000 ||
      !string(image.text || "", 100000)
    )
      throw new Error("Invalid image metadata.");
    if (image.fixture && !allowedFixtures.has(image.fixture))
      throw new Error("Unknown image fixture.");
    if (
      !image.fixture &&
      (!string(image.data, 18000000) ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          image.data,
        ))
    )
      throw new Error("Only embedded JPG, PNG or WebP images can be imported.");
  }
  const assessmentIds = new Set();
  for (const assessment of input.assessments) {
    if (
      !string(assessment.id, 100) ||
      assessmentIds.has(assessment.id) ||
      !scans.has(assessment.scanId) ||
      !Number.isInteger(assessment.version) ||
      assessment.version < 1 ||
      !validDate(assessment.createdAt) ||
      !Array.isArray(assessment.imageIds) ||
      !assessment.imageIds.every(
        (id) => images.has(id) && images.get(id).scanId === assessment.scanId,
      ) ||
      !Array.isArray(assessment.findings) ||
      assessment.findings.length !== fields.length
    )
      throw new Error("Invalid assessment or evidence references.");
    assessmentIds.add(assessment.id);
    const keys = new Set();
    for (const finding of assessment.findings) {
      if (
        !fields.some((f) => f.key === finding.key) ||
        keys.has(finding.key) ||
        !Object.hasOwn(statusLabels, finding.status) ||
        !string(finding.value || "", 3000) ||
        !string(finding.reviewNote || "", 5000)
      )
        throw new Error("Invalid finding.");
      keys.add(finding.key);
      if (finding.imageId && !assessment.imageIds.includes(finding.imageId))
        throw new Error("Finding references unavailable evidence.");
      if (
        finding.box &&
        (!finding.imageId ||
          !validateBox(
            finding.box,
            images.get(finding.imageId).width,
            images.get(finding.imageId).height,
          ))
      )
        throw new Error("Invalid evidence region.");
      if (
        finding.status === "missing" &&
        (!finding.coverageConfirmed ||
          !finding.reviewNote ||
          finding.applicability !== "applies" ||
          !assessment.imageIds.length)
      )
        throw new Error(
          "Absence findings need reviewed coverage and applicability.",
        );
    }
  }
  for (const scan of input.scans)
    if (
      !input.assessments.some(
        (a) => a.id === scan.latestAssessmentId && a.scanId === scan.id,
      )
    )
      throw new Error("Product latest assessment is missing.");
  return input;
}
export function findingsCSV(scan, assessment, sourceList) {
  const cell = (value) => {
    const text = String(value ?? "");
    return (
      '"' +
      (/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  const rows = [
    [
      "Product",
      "Version",
      "Declaration",
      "Status",
      "Observed value",
      "Applicability",
      "Reviewer note",
      "Source URL",
    ],
  ];
  assessment.findings.forEach((f) =>
    rows.push([
      scan.name,
      assessment.version,
      f.name,
      statusLabels[f.status],
      f.value,
      f.applicability,
      f.reviewNote,
      sourceList.find((s) => s.id === f.source)?.url,
    ]),
  );
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
