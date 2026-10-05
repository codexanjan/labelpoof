import { icon, esc, heading, date, empty, newButton } from "../ui.js";
import { summary, fields, sources, statusLabels } from "../rules.js";

export function latest(data, scan) {
  return data.assessments.find((a) => a.id === scan.latestAssessmentId);
}
export function queueItems(data) {
  return data.scans.flatMap((scan) =>
    (latest(data, scan)?.findings || [])
      .filter((f) => f.status !== "observed" && f.status !== "not_applicable")
      .map((finding) => ({ scan, finding })),
  );
}
export function scanBadge(data, scan) {
  const count = summary(latest(data, scan)?.findings);
  return count.missing
    ? `<span class="badge missing">${icon("circle-alert")} Potential issue</span>`
    : count.unresolved
      ? `<span class="badge unreadable">${icon("focus")} Needs review</span>`
      : `<span class="badge observed">${icon("check")} Observations complete</span>`;
}
export function table(data, scans = data.scans) {
  return `<div class="table-wrap"><table><thead><tr><th>PRODUCT</th><th>ASSESSMENT</th><th>DECLARATIONS</th><th>UPDATED</th><th></th></tr></thead><tbody>${scans
    .map((scan) => {
      const assessment = latest(data, scan),
        count = summary(assessment?.findings);
      return `<tr><td><div class="table-product"><img class="product-thumb" src="${scan.productImage || "/images/generic-pack.svg"}" alt="${esc(scan.demo ? "Synthetic" : "Illustrative")} product thumbnail"><div><a class="product-link" href="/dashboard/scans/${scan.id}">${esc(scan.name)}</a><small>${esc(scan.category)} ${scan.demo ? "· Sample" : "· Uploaded"}</small></div></div></td><td>${scanBadge(data, scan)}</td><td><div class="tiny-meter"><span style="width:${count.total ? (count.observed / count.total) * 100 : 0}%"></span></div><small class="muted">${count.observed}/${count.total} observed · v${assessment?.version || 0}</small></td><td class="muted">${date(scan.updatedAt)}</td><td><a class="icon-button" href="/dashboard/scans/${scan.id}" aria-label="Open ${esc(scan.name)}">${icon("arrow-up-right")}</a></td></tr>`;
    })
    .join("")}</tbody></table></div>`;
}
function stats(data) {
  const findings = data.scans.flatMap((s) => latest(data, s)?.findings || []),
    count = summary(findings);
  return `<div class="stats dashboard-stats"><article>${icon("scan")}<span>Products reviewed</span><strong>${String(data.scans.length).padStart(2, "0")}</strong><small>${data.scans.filter((s) => !s.demo).length} uploaded · ${data.scans.filter((s) => s.demo).length} synthetic samples</small></article><article>${icon("badge-check")}<span>Observed declarations</span><strong>${count.observed}</strong><small>Text found, ready for evidence review</small></article><article>${icon("focus")}<span>Unresolved checks</span><strong>${count.unresolved}</strong><small>Rescan or review to close the gaps</small></article><article>${icon("circle-alert")}<span>Potential issues</span><strong>${String(count.missing).padStart(2, "0")}</strong><small>Human-reviewed absence observations</small></article></div>`;
}
export function dashboard(data) {
  const queue = queueItems(data);
  return `${heading("WORKSPACE OVERVIEW", "Your labels, brought into focus.", "Review the evidence. Close the gaps. Keep every assessment together.", newButton)}
    <div class="workspace-banner"><div><span class="hero-tag">${icon("shield-check")} EVIDENCE BEFORE CONCLUSIONS</span><h2>Clear labels.<br><em>Confident next steps.</em></h2><p>Your workspace separates unreadable text, uncaptured surfaces, and reviewed absence.</p><a class="secondary" href="/dashboard/review">Open review queue ${icon("arrow-right")}</a></div><div class="banner-products"><img src="/images/tea-pack.svg" alt="Synthetic tea packaging"><img src="/images/oats-pack.svg" alt="Synthetic oat packaging"><img src="/images/snack-pack.svg" alt="Synthetic snack packaging"></div><span class="banner-note">ILLUSTRATIVE PRODUCTS</span></div>
    ${stats(data)}
    <div class="dashboard-columns"><section class="panel recent"><div class="section-heading"><div><h2>Recent scans</h2><p>Your latest product reviews.</p></div><a class="text-button" href="/dashboard/scans">View all ${icon("arrow-right")}</a></div>${data.scans.length ? table(data, data.scans.slice(0, 5)) : empty("Start your first scan.", "Upload packaging photos or load the demonstration workspace.", `<button class="secondary" data-action="load-demos">Load samples</button>`)}</section>
    <section class="panel priorities"><div class="section-heading"><h2>Needs a closer look</h2><span class="counter">${queue.length}</span></div>${
      queue
        .slice(0, 3)
        .map(
          ({ scan, finding }) =>
            `<a class="priority-card" href="/dashboard/scans/${scan.id}?field=${finding.key}"><span class="finding-icon ${finding.status}">${icon(finding.status === "not_captured" ? "camera-off" : finding.status === "missing" ? "circle-alert" : "focus")}</span><div><b>${esc(finding.name)}</b><small>${esc(scan.name)}</small><span class="badge ${finding.status}">${statusLabels[finding.status]}</span></div>${icon("chevron-right")}</a>`,
        )
        .join("") || '<p class="muted">No outstanding reviews.</p>'
    }<a class="text-button" href="/dashboard/review">View review queue ${icon("arrow-right")}</a></section></div>
    <div class="dashboard-columns lower"><section class="panel"><div class="section-heading"><div><h2>Workspace activity</h2><p>Traceable changes to your assessments.</p></div><a class="text-button" href="/dashboard/activity">View timeline ${icon("arrow-right")}</a></div>${activityList(data.events.slice(0, 4))}</section><section class="panel source-note"><span class="eyebrow">TRANSPARENT SOURCES</span><h2>Public rules.<br>Visible evidence.</h2><p>Official source links are included. This prototype has no published clause-validated legal rule pack or licence verification connection.</p><div class="source-chips"><span>Legal Metrology</span><span>FSSAI</span><span>BIS resources</span></div><a class="text-button" href="/dashboard/rules">Explore rule library ${icon("arrow-up-right")}</a></section></div>`;
}
export function scansView(data, state) {
  const filtered = data.scans.filter(
    (scan) =>
      `${scan.name} ${scan.brand} ${scan.category}`
        .toLowerCase()
        .includes(state.search.toLowerCase()) &&
      (state.scanFilter === "all" ||
        (state.scanFilter === "samples" && scan.demo) ||
        (state.scanFilter === "uploaded" && !scan.demo) ||
        (state.scanFilter === "review" &&
          summary(latest(data, scan)?.findings).unresolved > 0)),
  );
  return `${heading("PRODUCT LIBRARY", "Every scan has a story.", "Search products, review image coverage, and open complete assessment histories.", newButton)}
    <div class="toolbar panel"><div class="search-field">${icon("search")}<input id="scan-search" aria-label="Search scans" placeholder="Search by product, brand or category" value="${esc(state.search)}"></div><select id="scan-filter" aria-label="Filter scans">${[
      ["all", "All products"],
      ["review", "Needs review"],
      ["uploaded", "Uploaded products"],
      ["samples", "Synthetic samples"],
    ]
      .map(
        ([key, text]) =>
          `<option value="${key}" ${state.scanFilter === key ? "selected" : ""}>${text}</option>`,
      )
      .join(
        "",
      )}</select><button class="secondary" data-action="load-demos">${icon("package")} Load samples</button></div><section class="panel scan-results"><div class="section-heading"><h2>${filtered.length} product${filtered.length === 1 ? "" : "s"}</h2><span class="muted">Saved on this device</span></div>${filtered.length ? table(data, filtered) : empty("No matching products.", "Try a different search or create a new scan.")}</section>`;
}
export function reviewView(data, state) {
  const items = queueItems(data).filter(
    ({ finding }) =>
      state.reviewFilter === "all" || finding.status === state.reviewFilter,
  );
  return `${heading("REVIEW & RESCAN", "Make uncertainty actionable.", "A missing photo or unreadable region is a next step, not a failed legal check.")}
    <div class="queue-tabs">${[
      ["all", "All open checks"],
      ["not_captured", "Not photographed"],
      ["unreadable", "Unreadable"],
      ["review", "Needs review"],
      ["conflicting", "Conflicts"],
      ["missing", "Potential issues"],
    ]
      .map(
        ([key, text]) =>
          `<button class="${state.reviewFilter === key ? "active" : ""}" data-review-filter="${key}">${text}</button>`,
      )
      .join("")}</div>
    <div class="queue-grid">${items.map(({ scan, finding }) => `<article class="panel queue-card"><div class="section-heading"><span class="badge ${finding.status}">${statusLabels[finding.status]}</span><small class="muted">${scan.demo ? "Synthetic sample" : "Uploaded product"}</small></div><div class="queue-product"><img src="${scan.productImage || "/images/generic-pack.svg"}" alt="Product illustration"><div><h3>${esc(finding.name)}</h3><p>${esc(scan.name)}</p></div></div><p>${finding.status === "missing" ? "Review the recorded absence rationale and check applicability." : finding.status === "conflicting" ? "Different images contain conflicting values. Compare the evidence." : `Capture the ${finding.surface.toLowerCase()} surface with ${finding.name.toLowerCase()} in focus.`}</p><div class="queue-actions"><a class="secondary" href="/dashboard/scans/${scan.id}?field=${finding.key}">${icon("scan-search")} Inspect evidence</a><button class="primary" data-rescan="${scan.id}">${icon("camera")} Rescan</button></div></article>`).join("") || empty("The review queue is clear.", "There are no checks matching this filter.")}</div>`;
}
export function evidenceView(data, state, imageUrl) {
  const images = data.images.filter(
    (image) =>
      state.galleryFilter === "all" || image.surface === state.galleryFilter,
  );
  return `${heading("IMAGE LIBRARY", "The evidence behind every finding.", "Original packaging photos, surface coverage, and extraction metadata.")}
    <div class="toolbar panel"><span class="muted">${data.images.length} saved images</span><select id="gallery-filter" aria-label="Filter images by surface">${["all", "Front", "Back", "Left", "Right", "Top", "Bottom", "Wraparound"].map((s) => `<option value="${s}" ${state.galleryFilter === s ? "selected" : ""}>${s === "all" ? "All surfaces" : s}</option>`).join("")}</select></div>
    <div class="gallery-grid">${
      images
        .map((image) => {
          const scan = data.scans.find((s) => s.id === image.scanId);
          return `<article class="panel gallery-card"><button class="gallery-photo" data-image="${image.id}" aria-label="View ${esc(scan?.name)} ${esc(image.surface)} image"><img src="${imageUrl(image)}" alt="${esc(scan?.name)} ${esc(image.surface)} packaging"><span class="badge ${image.quality === "Unreadable" ? "unreadable" : "observed"}">${esc(image.quality)}</span></button><h3>${esc(scan?.name)}</h3><div class="section-heading"><span class="muted">${esc(image.surface)} · ${image.width} × ${image.height}</span><small class="muted">${image.demo ? "Synthetic" : "Original upload"}</small></div><a class="text-button" href="/dashboard/scans/${image.scanId}">Open assessment ${icon("arrow-right")}</a></article>`;
        })
        .join("") ||
      empty(
        "No images in this view.",
        "Upload photos to build an evidence library.",
      )
    }</div>`;
}
export function reportsView(data) {
  const assessments = [...data.assessments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return `${heading("ASSESSMENT ARCHIVE", "Reports that remember the evidence.", "Every review and rescan creates a new version. Earlier assessments remain available.")}
    <section class="panel"><div class="section-heading"><h2>${assessments.length} assessment versions</h2><button class="secondary" data-action="export-workspace">${icon("download")} Export workspace backup</button></div><div class="table-wrap"><table><thead><tr><th>PRODUCT / VERSION</th><th>OBSERVED</th><th>UNRESOLVED</th><th>CREATED</th><th>REPORT</th></tr></thead><tbody>${assessments
      .map((a) => {
        const scan = data.scans.find((s) => s.id === a.scanId),
          count = summary(a.findings);
        return `<tr><td><b>${esc(scan?.name)}</b><small class="muted">v${a.version} · ${esc(a.reason)} ${a.demo ? "· Sample" : ""}</small></td><td>${count.observed}</td><td>${count.unresolved}</td><td class="muted">${date(a.createdAt, true)}</td><td><a class="text-button" href="/dashboard/scans/${a.scanId}?version=${a.version}">Open ${icon("arrow-up-right")}</a></td></tr>`;
      })
      .join(
        "",
      )}</tbody></table></div>${!assessments.length ? empty("No reports yet.", "Complete a scan to create your first versioned assessment.") : ""}</section>`;
}
export function analyticsView(data) {
  const count = summary(
    data.scans.flatMap((s) => latest(data, s)?.findings || []),
  );
  const denominator = count.total || 1;
  const statusCounts = Object.entries(statusLabels).map(([key, text]) => ({
    key,
    text,
    count: data.scans
      .flatMap((s) => latest(data, s)?.findings || [])
      .filter((f) => f.status === key).length,
  }));
  return `${heading("WORKSPACE ANALYTICS", "See the gaps. Find the next step.", "Counts are derived from your saved assessments, including labelled synthetic samples.")}${stats(data)}
    <div class="analytics-grid"><section class="panel"><div class="section-heading"><h2>Observation breakdown</h2><span class="muted">Latest versions only</span></div><div class="donut-layout"><div class="donut" style="background:conic-gradient(#649376 0 ${(count.observed / denominator) * 100}%,#dcbd70 ${(count.observed / denominator) * 100}% ${((count.observed + count.unresolved) / denominator) * 100}%,#c38370 ${((count.observed + count.unresolved) / denominator) * 100}% ${((count.observed + count.unresolved + count.missing) / denominator) * 100}%,#8c9cb0 0)"><div><strong>${count.total}</strong><span>observations</span></div></div><div class="legend">${statusCounts
      .filter((s) => s.count)
      .map(
        (s) =>
          `<div><span class="legend-dot ${s.key}"></span><span>${s.text}</span><b>${s.count}</b></div>`,
      )
      .join(
        "",
      )}</div></div><p class="fine-print">This is an observation distribution, not a legal compliance score.</p></section>
    <section class="panel"><div class="section-heading"><h2>Capture coverage</h2><span class="muted">Photographed surfaces</span></div><div class="bar-chart">${[
      "Front",
      "Back",
      "Left",
      "Right",
      "Top",
      "Bottom",
      "Wraparound",
    ]
      .map((surface) => {
        const amount = data.images.filter((i) => i.surface === surface).length;
        return `<div><span>${surface}</span><div class="bar-track"><span style="width:${(amount / Math.max(data.images.length, 1)) * 100}%"></span></div><b>${amount}</b></div>`;
      })
      .join("")}</div></section>
    <section class="panel"><div class="section-heading"><h2>Checks needing review</h2></div><div class="bar-chart">${fields
      .map((field) => {
        const amount = queueItems(data).filter(
          (i) => i.finding.key === field.key,
        ).length;
        return `<div><span>${field.name}</span><div class="bar-track amber"><span style="width:${(amount / Math.max(data.scans.length, 1)) * 100}%"></span></div><b>${amount}</b></div>`;
      })
      .join(
        "",
      )}</div></section><section class="panel"><span class="eyebrow">DATA TRANSPARENCY</span><h2>Know what’s being counted.</h2><div class="metric-list"><div><span>Original uploaded products</span><b>${data.scans.filter((s) => !s.demo).length}</b></div><div><span>Synthetic demo products</span><b>${data.scans.filter((s) => s.demo).length}</b></div><div><span>Assessment versions</span><b>${data.assessments.length}</b></div><div><span>Human review events</span><b>${data.events.filter((e) => e.type === "correction").length}</b></div><div><span>Official registry verifications</span><b>0</b></div></div><p class="fine-print">No accuracy, calibration, or legal compliance benchmark is claimed. Confidence values come from OCR heuristics.</p></section></div>`;
}
export function activityList(events) {
  return `<div class="activity-list">${events.map((event) => `<div class="activity-item"><span>${icon(event.type === "correction" ? "pencil-line" : event.type === "assessment" ? "scan" : "package")}</span><div><b>${esc(event.message)}</b><small>${esc(event.actor)} · ${date(event.at, true)}</small></div>${event.scanId ? `<a class="icon-button" href="/dashboard/scans/${event.scanId}" aria-label="Open related scan">${icon("arrow-up-right")}</a>` : ""}</div>`).join("") || '<p class="muted">No activity yet.</p>'}</div>`;
}
export function activityView(data) {
  return `${heading("AUDIT TIMELINE", "A record of every meaningful change.", "Local activity logs document scans, corrections, settings changes and exports.")}<section class="panel">${activityList(data.events)}</section>`;
}
export function rulesView(data) {
  return `${heading("REGULATORY SOURCE LIBRARY", "Public rules. Traceable references.", "Review applicability and operative clauses before making a legal conclusion.", `<button class="secondary" data-action="draft-rule">${icon("plus")} Add review note</button>`)}<div class="report-notice">${icon("info")}<span>These are declaration detectors and source references. Legal rule publishing is not enabled. Draft notes cannot change assessment outcomes.</span></div>
    <div class="source-grid">${sources.map((source) => `<article class="panel rule-card">${icon(source.id === "lm" ? "scale" : source.id === "fssai" ? "leaf" : "shield-check")}<span class="badge unreadable">Source reference</span><h2>${source.name}</h2><small class="muted">${source.authority}</small><p>${source.description}</p><a class="secondary" href="${source.url}" target="_blank" rel="noopener">Official source ${icon("external-link")}</a></article>`).join("")}</div>
    <section class="panel"><div class="section-heading"><h2>Declaration observation pack</h2><span class="badge not_captured">v2.0 · 12 detectors</span></div><div class="table-wrap"><table><thead><tr><th>DECLARATION</th><th>REFERENCE</th><th>CAPTURE HINT</th><th>LEGAL VALIDATION</th></tr></thead><tbody>${fields.map((f) => `<tr><td><b>${f.name}</b><small class="rule-help">${f.help}</small></td><td>${sources.find((s) => s.id === f.source).name}</td><td>${f.surface}</td><td><span class="badge unreadable">Not validated</span></td></tr>`).join("")}</tbody></table></div></section>
    <section class="panel rule-drafts"><div class="section-heading"><h2>Review notes & rule drafts</h2><span class="muted">Workspace notes only</span></div>${data.drafts.map((d) => `<article class="draft-row"><div><b>${esc(d.title)}</b><p>${esc(d.note)}</p><small>${esc(d.clause || "Clause not specified")} · Effective date ${esc(d.effectiveDate || "unknown")} · ${date(d.createdAt)}</small></div><button class="icon-button" data-delete-draft="${d.id}" aria-label="Delete draft">${icon("trash-2")}</button></article>`).join("") || '<p class="muted">Add a sourced note for later regulatory review. Notes are never executed as legal rules.</p>'}</section>`;
}
export function settingsView(data) {
  const s = data.settings;
  return `${heading("WORKSPACE SETTINGS", "Make this workspace yours.", "Preferences and data controls for this browser. No shared account or cloud database is connected.")}
    <div class="settings-grid"><form id="settings-form" class="panel"><div class="section-heading"><h2>${icon("settings")} Workspace preferences</h2><span class="badge not_captured">Local device</span></div><label>Workspace name<input name="workspaceName" maxlength="80" required value="${esc(s.workspaceName)}"></label><label>Reviewer display name<input name="reviewerName" maxlength="80" required value="${esc(s.reviewerName)}"></label><label>OCR language<select name="language"><option value="eng" ${s.language === "eng" ? "selected" : ""}>English</option><option value="eng+hin" ${s.language === "eng+hin" ? "selected" : ""}>English + Hindi</option></select></label><label>OCR uncertainty threshold (heuristic)<input name="confidenceThreshold" type="number" min="1" max="95" value="${s.confidenceThreshold}" required></label><p class="fine-print">Below this OCR confidence signal, text is marked unreadable. This threshold is not a calibrated probability and only affects new OCR runs.</p><button type="submit" class="primary">${icon("save")} Save preferences</button></form>
    <div><section class="panel"><div class="section-heading"><h2>${icon("database")} Your data, on your device</h2></div><p class="settings-copy">Images, reports, drafts and review history are saved in this browser’s IndexedDB. Export a backup before clearing browser data or moving to another device.</p><div class="metric-list"><div><span>Saved products</span><b>${data.scans.length}</b></div><div><span>Saved photos</span><b>${data.images.length}</b></div><div><span>Assessment versions</span><b>${data.assessments.length}</b></div></div><button class="secondary full" data-action="export-workspace">${icon("download")} Export full backup with images</button><label class="secondary full import-label">${icon("upload")} Import a LabelProof backup<input type="file" id="backup-file" accept="application/json,.json"></label><p class="fine-print">Backups contain your packaging images and extracted text. Imported products are added as new records.</p></section><section class="panel danger-panel"><h3>Data management</h3><p>Delete locally saved scans and images. This does not modify GitHub or the published website.</p><button class="danger-button" data-action="clear">${icon("trash-2")} Clear local workspace</button></section></div></div>`;
}
