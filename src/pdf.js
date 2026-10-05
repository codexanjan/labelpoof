import { sources, statusLabels } from "./rules.js";
// Native canvas text preserves browser shaping for Hindi and other scripts.
// PDF text pages are rasterized; JSON/CSV remain available for searchable data.
export async function saveReportPDF(scan, assessment, images, imageUrl) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const product = assessment.productSnapshot || scan;
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  let y,
    pages = 0;
  const start = () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1240, 1754);
    ctx.fillStyle = "#183b2a";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("LabelProof | Evidence report", 70, 75);
    y = 130;
  };
  const flush = () => {
    if (pages++) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
    start();
  };
  const line = (text, bold = false) => {
    ctx.font = `${bold ? "bold " : ""}24px sans-serif`;
    const paragraphs = String(text || "�").split("\n");
    for (const paragraph of paragraphs) {
      let row = "";
      for (const char of paragraph) {
        if (ctx.measureText(row + char).width > 1100) {
          if (y > 1640) flush();
          ctx.fillText(row, 70, y);
          y += 34;
          row = "";
        }
        row += char;
      }
      if (y > 1640) flush();
      ctx.fillText(row, 70, y);
      y += 34;
    }
    y += 10;
  };
  start();
  line(`${product.name} | Version ${assessment.version}`, true);
  line(
    `Brand: ${product.brand || "Unspecified"} | Category: ${product.category} | Origin: ${product.origin}`,
  );
  line(
    `Assessment: ${assessment.id} | Created: ${assessment.createdAt} | Reviewer: ${assessment.reviewer || "Unspecified"}`,
  );
  line(
    "PRELIMINARY LABEL REVIEW. Observed text does not establish legal compliance. Missing information is distinct from unreadable or unphotographed evidence. Registry checks are not connected.",
  );
  for (const f of assessment.findings) {
    line(`${f.name}: ${statusLabels[f.status]}`, true);
    line(
      `Value: ${f.value || "No reliable value"} | Applicability: ${f.applicability}`,
    );
    line(
      `Evidence image: ${f.imageId || "None"} | Human confirmed: ${!!f.humanConfirmed}`,
    );
    if (f.reviewNote) line(`Review rationale: ${f.reviewNote}`);
    for (const o of f.observations || [])
      line(`Comparison: ${o.value} | Image: ${o.imageId}`);
    line(
      `Source reference (operative clauses require review): ${sources.find((s) => s.id === f.source)?.url || "None"}`,
    );
  }
  line(
    "Evidence appendix follows. Text pages preserve script shaping as images; use JSON or CSV for searchable findings.",
  );
  flush();
  for (const image of images.filter((i) =>
    assessment.imageIds.includes(i.id),
  )) {
    const photo = new Image();
    photo.src = imageUrl(image);
    await photo.decode();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1240, 1754);
    ctx.fillStyle = "#183b2a";
    ctx.font = "22px sans-serif";
    ctx.fillText(`${image.surface} | ${image.quality} | ${image.id}`, 50, 50);
    ctx.fillText(`SHA-256: ${image.sha256 || "Synthetic fixture"}`, 50, 85);
    const ratio = Math.min(
      1140 / photo.naturalWidth,
      1500 / photo.naturalHeight,
    );
    const w = photo.naturalWidth * ratio,
      h = photo.naturalHeight * ratio,
      x = (1240 - w) / 2,
      top = 130;
    ctx.drawImage(photo, x, top, w, h);
    ctx.strokeStyle = "#e2a321";
    ctx.lineWidth = 5;
    for (const f of assessment.findings.filter(
      (f) => f.imageId === image.id && f.box,
    )) {
      const b = f.box;
      ctx.strokeRect(
        x + b.x0 * ratio,
        top + b.y0 * ratio,
        (b.x1 - b.x0) * ratio,
        (b.y1 - b.y0) * ratio,
      );
    }
    if (pages++) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
  }
  pdf.save(`labelproof-report-v${assessment.version}.pdf`);
}
