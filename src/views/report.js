import { icon, esc, heading, date } from "../ui.js";
import {
  fields,
  sources,
  statusLabels,
  summary,
  validateBox,
} from "../rules.js";

export function reportView(scan, assessment, data, state, imageUrl) {
  if (!assessment)
    return heading(
      "ASSESSMENT",
      "Report not found.",
      "Return to the product library and select an available assessment.",
      `<a class="secondary" href="/dashboard/scans">Open product library</a><a class="primary" href="/dashboard/scans/${scan.id}">Latest report</a>`,
    );
  const count = summary(assessment.findings);
  const finding =
    assessment.findings.find((f) => f.key === state.field) ||
    assessment.findings[0];
  const field = fields.find((f) => f.key === finding.key);
  const images = data.images.filter((i) => assessment.imageIds.includes(i.id));
  const image =
    images.find((i) => i.id === state.evidenceImage) ||
    images.find((i) => i.id === finding.imageId) ||
    images[0];
  const box =
    image?.id === finding.imageId &&
    validateBox(finding.box, image.width, image.height)
      ? finding.box
      : null;
  const source = sources.find((s) => s.id === finding.source);
  const versions = data.assessments
    .filter((a) => a.scanId === scan.id)
    .sort((a, b) => b.version - a.version);
  const historic = assessment.id !== scan.latestAssessmentId;
  const resolved = ["observed", "not_applicable"].includes(finding.status);
  const message =
    finding.status === "observed"
      ? "This declaration was observed. Review the image, complete text and applicable requirement before drawing a compliance conclusion."
      : finding.status === "missing"
        ? "A reviewer recorded that this declaration was not found in the reviewed images. This remains a potential issue, not a final legal decision."
        : finding.status === "not_applicable"
          ? "A reviewer recorded that this check does not apply. Review the rationale and official source before relying on the exception."
          : finding.status === "conflicting"
            ? "Different images contain conflicting text. Compare each observation and record the value supported by the packaging."
            : "The available evidence is insufficient. Add a clearer image or record a manual review; non-detection is not proof of absence.";
  return `${heading(scan.demo ? "SYNTHETIC SAMPLE ASSESSMENT" : "PRELIMINARY LABEL REVIEW", scan.name, `${scan.category} · ${scan.origin} context · Assessment v${assessment.version} · ${date(assessment.createdAt)}`, `<button class="secondary" data-action="export-report">${icon("download")} JSON</button><button class="secondary" data-action="export-csv">${icon("file-text")} CSV</button><button class="primary" data-action="print">${icon("printer")} Save PDF</button>`)}
    <div class="report-notice">${icon("info")}<span>${scan.demo ? "Synthetic packaging and illustrative findings. No real product or licence is assessed." : "OCR and manual label observations only."} Category applicability and operative legal clauses need verification. Licence authenticity has not been checked.</span></div>
    <div class="report-meta"><span>${icon("history")} ${historic ? "Earlier version · read only" : "Latest assessment"}</span><label>Assessment version<select id="assessment-version">${versions.map((a) => `<option value="${a.version}" ${a.id === assessment.id ? "selected" : ""}>v${a.version} — ${esc(a.reason)}</option>`).join("")}</select></label><span>${icon("images")} ${images.length} evidence image${images.length === 1 ? "" : "s"}</span><span class="muted">${assessment.rulePack}</span></div>
    <div class="report-stats"><div><span class="stat-icon observed">${icon("check")}</span><strong>${count.observed}</strong><span>Declarations observed</span></div><div><span class="stat-icon unreadable">${icon("focus")}</span><strong>${count.unresolved}</strong><span>Unresolved checks</span></div><div><span class="stat-icon missing">${icon("circle-alert")}</span><strong>${count.missing}</strong><span>Reviewed potential issues</span></div><div><span class="stat-icon not_captured">${icon("circle-check")}</span><strong>${count.notApplicable}</strong><span>Not applicable</span></div></div>
    <div class="report-layout"><section class="panel finding-panel"><div class="section-heading"><h2>Label findings</h2><span class="muted">${assessment.findings.length} declarations</span></div><div class="filters">${[
      ["all", "All findings"],
      ["observed", "Observed"],
      ["unresolved", "Unresolved"],
    ]
      .map(
        ([k, t]) =>
          `<button class="${state.findingFilter === k ? "active" : ""}" data-finding-filter="${k}">${t}</button>`,
      )
      .join("")}</div>
    <div class="finding-list">${assessment.findings
      .filter(
        (f) =>
          state.findingFilter === "all" ||
          (state.findingFilter === "observed" && f.status === "observed") ||
          (state.findingFilter === "unresolved" &&
            !["observed", "not_applicable"].includes(f.status)),
      )
      .map(
        (f) =>
          `<button class="finding ${f.key === finding.key ? "selected" : ""}" data-finding="${f.key}"><span class="finding-icon ${f.status}">${icon(f.status === "observed" ? "check" : f.status === "not_captured" ? "camera-off" : f.status === "missing" ? "circle-alert" : "focus")}</span><div><b>${f.name}</b><small>${esc(f.status === "observed" ? f.value : f.status === "not_captured" ? `${f.surface} photo suggested` : statusLabels[f.status])}</small></div><span class="badge ${f.status}">${statusLabels[f.status]}</span></button>`,
      )
      .join("")}</div>
    <div class="finding-detail"><span class="eyebrow">SELECTED OBSERVATION</span><h3>${finding.name}</h3><p>${message}</p><div class="observation-value">${esc(finding.value || "No reliable value established")}</div><p class="field-help">${field.help}</p><a href="${source.url}" target="_blank" rel="noopener">${icon("book-open")} ${source.name} · official source ${icon("external-link")}</a><div class="detail-meta"><span>Applicability: ${esc(finding.applicability.replaceAll("_", " "))}</span><span>Legal clause validation: pending</span>${finding.key === "licence" ? "<span>Registry verification: not attempted</span>" : ""}</div>${finding.reviewNote ? `<div class="review-note">${icon("pencil-line")}<div><b>Reviewer note</b><p>${esc(finding.reviewNote)}</p></div></div>` : ""}${finding.status === "conflicting" ? `<div class="conflict-list">${finding.observations.map((o) => `<button data-evidence="${o.imageId}">${esc(o.value)} ${icon("arrow-up-right")}</button>`).join("")}</div>` : ""}<button class="secondary compact" data-action="review" ${historic ? "disabled" : ""}>${icon("pencil-line")} Review / correct</button>${historic ? '<p class="fine-print">Open the latest version to record a new correction.</p>' : ""}</div></section>
    <section class="panel evidence-panel"><div class="section-heading"><h2>${icon("scan-search")} Image evidence</h2><div class="evidence-tools"><button class="icon-button" data-action="zoom-out" aria-label="Zoom out">${icon("zoom-out")}</button><span>${Math.round(state.zoom * 100)}%</span><button class="icon-button" data-action="zoom-in" aria-label="Zoom in">${icon("zoom-in")}</button></div></div><div class="evidence-image">${image ? `<div class="image-inner" style="transform:scale(${state.zoom})"><img id="evidence-img" src="${imageUrl(image)}" alt="${esc(scan.name)} ${esc(image.surface)} packaging evidence">${box ? `<div class="evidence-box" style="left:${(box.x0 / image.width) * 100}%;top:${(box.y0 / image.height) * 100}%;width:${((box.x1 - box.x0) / image.width) * 100}%;height:${((box.y1 - box.y0) / image.height) * 100}%"><span>${finding.name}</span></div>` : ""}</div>` : `<div class="evidence-empty">${icon("camera-off")}<p>No image available for this version.</p><small>Add photos to create a new assessment.</small></div>`}</div><div class="evidence-caption">${icon("image")} ${esc(image?.surface || "No photo")} <span>${box ? "Highlighted source region" : "No localized evidence established"}</span></div>
    <div class="evidence-thumbs">${images.map((im) => `<button data-evidence="${im.id}" class="${im.id === image?.id ? "selected" : ""}" aria-label="View ${esc(im.surface)} evidence"><img src="${imageUrl(im)}" alt="${esc(im.surface)} thumbnail"><span>${im.surface}</span></button>`).join("")}</div>
    <div class="next-action">${icon(resolved ? "shield-check" : "camera")}<div><h4>${resolved ? "Keep the observation traceable" : "Make the next photo count"}</h4><p>${resolved ? "Review source text, applicability and exceptions before drawing a legal conclusion." : `Photograph the ${field.surface.toLowerCase()} surface straight on, with ${field.name.toLowerCase()} in focus.`}</p></div></div><button class="secondary full" data-rescan="${scan.id}">${icon("camera")} Add a photo & reassess</button>
    ${image ? `<details class="ocr-details"><summary>${icon("file-text")} Extracted text & provenance</summary><pre>${esc(image.text || "No OCR text available")}</pre><dl><dt>Engine</dt><dd>${esc(image.ocrEngine || "Synthetic fixture")}</dd><dt>Dimensions</dt><dd>${image.width} × ${image.height}</dd><dt>SHA-256</dt><dd class="hash">${esc(image.sha256 || "Synthetic fixture — see source assets")}</dd><dt>Confidence</dt><dd>${image.confidence == null ? "Not measured" : Math.round(image.confidence) + " / 100 (heuristic)"}</dd></dl></details>` : ""}</section></div>
    <section class="panel assessment-history"><div class="section-heading"><h2>${icon("history")} Assessment history</h2><span class="muted">Earlier versions are preserved</span></div>${versions.map((a) => `<a class="version-row ${a.id === assessment.id ? "current" : ""}" href="/dashboard/scans/${scan.id}?version=${a.version}"><span>v${a.version}</span><div><b>${esc(a.reason)}</b><small>${esc(a.reviewer)} · ${date(a.createdAt, true)}</small></div>${a.id === scan.latestAssessmentId ? '<span class="badge observed">Latest</span>' : ""}${icon("chevron-right")}</a>`).join("")}<button class="danger-button" data-action="delete-scan">${icon("trash-2")} Delete this local product</button></section>
    <section class="print-only"><h2>Complete finding register</h2><table><thead><tr><th>Declaration</th><th>Observation</th><th>Value / reviewer note</th><th>Source</th></tr></thead><tbody>${assessment.findings.map((f) => `<tr><td>${f.name}</td><td>${statusLabels[f.status]}</td><td>${esc(f.value)}<br>${esc(f.reviewNote)}</td><td>${sources.find((s) => s.id === f.source).name}</td></tr>`).join("")}</tbody></table><p>Assessment ${assessment.id} · ${assessment.rulePack} · ${assessment.pipeline}. Preliminary observations, not a legal certification.</p></section>`;
}
