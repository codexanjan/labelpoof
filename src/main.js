import { icon, esc, hydrateIcons, toast, download, date } from "./ui.js";
import {
  fields,
  sources,
  assess,
  summary,
  surfaces,
  statusLabels,
  RULE_PACK,
  PIPELINE,
  validateReview,
  validateBox,
} from "./rules.js";
import * as storage from "./storage.js";
import { seedDemos } from "./demo.js";
import { readImages } from "./ocr.js";
import { imageToJSON, validateBackup, findingsCSV } from "./exports.js";
import { landing } from "./views/landing.js";
import {
  dashboard,
  scansView,
  reviewView,
  evidenceView,
  reportsView,
  analyticsView,
  rulesView,
  settingsView,
  activityView,
  latest,
  queueItems,
  activityList,
} from "./views/workspace.js";
import { captureView } from "./views/capture.js";
import { reportView } from "./views/report.js";

const $ = (selector) => document.querySelector(selector);
let data;
const urls = new Map();
const state = {
  search: "",
  scanFilter: "all",
  reviewFilter: "all",
  galleryFilter: "all",
  findingFilter: "all",
  field: "quantity",
  evidenceImage: null,
  zoom: 1,
  captureSurface: "Front",
  draft: null,
  busy: false,
};
const nav = [
  ["overview", "Overview", "layout-dashboard", ""],
  ["scans", "My scans", "scan", "/scans"],
  ["review", "Review queue", "list-checks", "/review"],
  ["evidence", "Evidence library", "images", "/evidence"],
  ["reports", "Reports", "files", "/reports"],
  ["analytics", "Analytics", "chart-no-axes-combined", "/analytics"],
  ["rules", "Rule library", "book-open", "/rules"],
  ["activity", "Activity log", "history", "/activity"],
  ["settings", "Settings", "settings", "/settings"],
];
const id = () => crypto.randomUUID();
const imageUrl = (image) => {
  if (image.fixture) return image.fixture;
  if (image.url) return image.url;
  if (!image.blob) return "";
  if (!urls.has(image.id)) urls.set(image.id, URL.createObjectURL(image.blob));
  return urls.get(image.id);
};
const cleanImage = (image) => {
  const { url, ...record } = image;
  return record;
};
const currentScan = () => data.scans.find((scan) => scan.id === route().scanId);
function currentAssessment() {
  const scan = currentScan();
  if (!scan) return null;
  return route().version
    ? data.assessments.find(
        (a) => a.scanId === scan.id && a.version === route().version,
      )
    : latest(data, scan);
}
function route() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const query = new URLSearchParams(location.search);
  if (path === "/") return { view: "landing" };
  if (path === "/dashboard" || path === "/dashboard/overview")
    return { view: "overview" };
  if (path === "/dashboard/new") return { view: "capture" };
  const match = path.match(/^\/dashboard\/scans\/([^/]+)$/);
  if (match)
    return {
      view: "report",
      scanId: (() => {
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return "";
        }
      })(),
      version: Number(query.get("version")) || null,
      field: query.get("field"),
    };
  return {
    view:
      nav.find((item) => path === "/dashboard" + item[3])?.[0] || "notfound",
  };
}
function go(path) {
  history.pushState({}, "", path);
  state.evidenceImage = null;
  state.zoom = 1;
  render();
  window.scrollTo(0, 0);
}
function newDraft() {
  return {
    scan: {
      name: "",
      brand: "",
      category: "Cereals & grains",
      origin: "Unknown",
      demo: false,
    },
    images: [],
  };
}
function render() {
  document.body.classList.remove("navigation-open");
  const r = route();
  if (r.field) state.field = r.field;
  if (r.view === "capture" && !state.draft) state.draft = newDraft();
  if (r.view === "landing") $("#app").innerHTML = landing();
  else {
    const viewName =
      r.view === "report"
        ? "Evidence report"
        : r.view === "capture"
          ? "New scan"
          : nav.find((n) => n[0] === r.view)?.[1] || "Page not found";
    $("#app").innerHTML =
      `<a class="skip-link" href="#content">Skip to content</a><button class="menu-backdrop" data-action="menu" aria-label="Close navigation"></button><aside class="sidebar workspace-sidebar"><button class="icon-button menu-close" data-action="menu" aria-label="Close navigation">${icon("x")}</button><a class="brand" href="/">${icon("scan-line")}<span>Label<span class="brand-light">Proof</span><small>EVIDENCE, NOT ASSUMPTIONS</small></span></a><div class="workspace"><span class="avatar">LP</span><div>${esc(data.settings.workspaceName)}<small>Local browser workspace</small></div></div><div class="nav-label">WORKSPACE</div><nav>${nav.map(([key, title, i, path]) => `<a href="/dashboard${path}" class="${r.view === key || (r.view === "report" && key === "scans") ? "active" : ""}">${icon(i)}<span>${title}</span>${key === "review" ? `<span class="nav-count">${queueItems(data).length}</span>` : ""}</a>`).join("")}</nav><div class="sidebar-storage">${icon("hard-drive")}<div><b>Evidence stays with you.</b><small>Photos and reports saved on this device.</small></div></div><a class="side-bottom" href="/dashboard/settings"><span class="avatar small">${esc(data.settings.reviewerName.slice(0, 1).toUpperCase())}</span><div>${esc(data.settings.reviewerName)}<small>SIH26034 · Prototype</small></div><span class="live-dot"></span></a></aside><div class="main"><header><div class="header-leading"><button class="icon-button menu-toggle" data-action="menu" aria-label="Toggle navigation">${icon("menu")}</button><div class="breadcrumb">Workspace <span>/</span> ${viewName}</div></div><form id="global-search" class="global-search">${icon("search")}<input aria-label="Search products" placeholder="Search products…" value="${esc(state.search)}"><button type="submit" aria-label="Search">${icon("arrow-right")}</button></form><div class="header-right"><span class="prototype">${icon("flask-conical")} Prototype</span><button class="icon-button notification-button" data-action="notifications" aria-label="View recent activity">${icon("bell")}<span></span></button><a class="avatar small" href="/dashboard/settings" aria-label="Workspace settings">${esc(data.settings.reviewerName.slice(0, 1).toUpperCase())}</a></div></header><main id="content" tabindex="-1">${content(r)}</main><footer><span>LabelProof · Evidence, not assumptions.</span><span>${icon("lock-keyhole")} Browser storage · Preliminary label review</span></footer></div>`;
  }
  if (!$("#dialog-host"))
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="dialog-host"></div><div id="toast" role="status" aria-live="polite"></div>',
    );
  hydrateIcons();
  bindForms();
}
function content(r) {
  if (r.view === "overview") return dashboard(data);
  if (r.view === "scans") return scansView(data, state);
  if (r.view === "review") return reviewView(data, state);
  if (r.view === "evidence") return evidenceView(data, state, imageUrl);
  if (r.view === "reports") return reportsView(data);
  if (r.view === "analytics") return analyticsView(data);
  if (r.view === "rules") return rulesView(data);
  if (r.view === "activity") return activityView(data);
  if (r.view === "settings") return settingsView(data);
  if (r.view === "capture") return captureView(state, imageUrl);
  if (r.view === "report")
    return currentScan()
      ? reportView(
          { ...currentScan(), ...currentAssessment()?.productSnapshot },
          currentAssessment(),
          data,
          state,
          imageUrl,
        )
      : '<section class="panel"><h1>Product not found.</h1><p>This scan may have been deleted or belongs to another browser.</p><a class="primary" href="/dashboard/scans">Return to scans</a></section>';
  return '<section class="panel"><h1>Page not found.</h1><a class="primary" href="/dashboard">Open dashboard</a></section>';
}
function showModal(title, body, actions = "") {
  $("#dialog-host").innerHTML =
    `<dialog id="dialog" class="modal panel"><div class="section-heading"><h2>${esc(title)}</h2><button class="icon-button" data-action="close" aria-label="Close dialog">${icon("x")}</button></div>${body}${actions ? `<div class="capture-actions">${actions}</div>` : ""}</dialog>`;
  $("#dialog").showModal();
  hydrateIcons();
}
function closeModal() {
  $("#dialog")?.close();
  $("#dialog-host").innerHTML = "";
}
function draftMetadata() {
  if (!state.draft || !$("#product-name")) return;
  state.draft.scan = {
    ...state.draft.scan,
    name: $("#product-name").value.trim(),
    brand: $("#product-brand").value.trim(),
    category: $("#category").value,
    origin: $("#origin").value,
  };
  state.captureSurface = $("#surface").value;
}
async function refresh() {
  data = await storage.loadWorkspace();
}
async function event(type, message, scanId = null) {
  await storage.put("events", {
    id: id(),
    type,
    message,
    scanId,
    actor: data.settings.reviewerName,
    at: new Date().toISOString(),
  });
}

async function upload(files) {
  if (state.busy || state.uploading) return;
  draftMetadata();
  state.uploading = true;
  const uploadDraft = state.draft,
    uploadSurface = state.captureSurface;
  const errors = [];
  for (const file of files) {
    if (uploadDraft.images.length >= 12) {
      errors.push("Maximum 12 photos per scan.");
      break;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    ) {
      errors.push("Use JPG, PNG or WebP images under 12 MB.");
      continue;
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 40000000)
        throw new Error("Image exceeds the 40-megapixel limit.");
      const bytes = await file.arrayBuffer();
      const signature = new Uint8Array(bytes.slice(0, 12));
      const valid =
        file.type === "image/jpeg"
          ? signature[0] === 255 && signature[1] === 216
          : file.type === "image/png"
            ? signature[0] === 137 &&
              signature[1] === 80 &&
              signature[2] === 78 &&
              signature[3] === 71
            : String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
              String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
      if (!valid)
        throw new Error("File contents do not match the selected image type.");
      const sha256 = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      uploadDraft.images.push({
        id: id(),
        blob: file,
        surface: uploadSurface,
        width: bitmap.width,
        height: bitmap.height,
        quality:
          bitmap.width < 400 || bitmap.height < 300 ? "Unreadable" : "Unknown",
        sha256,
        createdAt: new Date().toISOString(),
        demo: false,
      });
    } catch (error) {
      errors.push(error.message || "This image could not be decoded.");
    } finally {
      bitmap?.close();
    }
  }
  state.uploading = false;
  render();
  if (errors.length) toast([...new Set(errors)].join(" "));
}
async function rescan(scanId, fieldKey = state.field) {
  const scan = data.scans.find((s) => s.id === scanId);
  if (!scan) return;
  const assessment = latest(data, scan);
  state.draft = {
    scan: structuredClone(scan),
    images: structuredClone(
      data.images.filter((i) => assessment.imageIds.includes(i.id)),
    ),
  };
  state.captureSurface =
    fields.find((f) => f.key === fieldKey)?.surface || "Front";
  go("/dashboard/new");
}
async function commitAssessment(
  scan,
  images,
  findings,
  reason,
  type = "assessment",
) {
  const now = new Date().toISOString();
  const scanId = scan.id || id();
  const version =
    Math.max(
      0,
      ...data.assessments
        .filter((a) => a.scanId === scanId)
        .map((a) => a.version),
    ) + 1;
  const assessment = {
    id: id(),
    scanId,
    version,
    createdAt: now,
    reason,
    rulePack: RULE_PACK,
    pipeline: PIPELINE,
    imageIds: images.map((i) => i.id),
    imageSnapshots: images.map((i) => ({
      id: i.id,
      sha256: i.sha256 || null,
      fixture: i.fixture || null,
      surface: i.surface,
      quality: i.quality,
      width: i.width,
      height: i.height,
    })),
    productSnapshot: {
      name: scan.name,
      brand: scan.brand,
      category: scan.category,
      origin: scan.origin,
      demo: !!scan.demo,
    },
    findings: structuredClone(findings),
    reviewer: data.settings.reviewerName,
    demo: !!scan.demo,
  };
  const product = {
    ...scan,
    id: scanId,
    name: scan.name || "Untitled product",
    createdAt: scan.createdAt || now,
    updatedAt: now,
    latestAssessmentId: assessment.id,
  };
  const storedImages = images.map((image) => ({
    ...cleanImage(image),
    scanId,
  }));
  await storage.saveAssessment(product, storedImages, assessment, {
    id: id(),
    scanId,
    type,
    message: `${product.name}: ${reason} (v${version})`,
    actor: data.settings.reviewerName,
    at: now,
  });
  await refresh();
  return { product, assessment };
}
async function analyze() {
  if (state.uploading)
    return toast("Please wait for your photos to finish loading.");
  if (state.busy) return;
  draftMetadata();
  if (!state.draft.scan.name) {
    toast("Add a product name before reviewing the label.");
    $("#product-name").focus();
    return;
  }
  if (!state.draft.images.length) return toast("Add a photo first.");
  state.busy = true;
  state.ocrController = new AbortController();
  showModal(
    "Following the evidence.",
    `<div class="processing"><div class="spinner"></div><span class="eyebrow">READING YOUR LABEL</span><p id="progress">Preparing image evidence…</p><progress id="ocr-progress" max="1" value="0"></progress><small>The OCR engine downloads on first use. Your photos stay in this browser.</small></div>`,
  );
  $('#dialog [data-action="close"]').hidden = true;
  $("#dialog").insertAdjacentHTML(
    "beforeend",
    '<button class="secondary" data-action="cancel-ocr">Cancel processing</button>',
  );
  $("#dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    state.ocrController.abort();
  });
  try {
    await readImages(
      state.draft.images,
      data.settings,
      (progress) => {
        if ($("#progress")) {
          $("#progress").textContent = progress.stage;
          $("#ocr-progress").value = progress.progress;
        }
      },
      state.ocrController.signal,
    );
    const findings = assess(state.draft.images);
    const result = await commitAssessment(
      state.draft.scan,
      state.draft.images,
      findings,
      state.draft.scan.id ? "Photos reassessed" : "Label assessed",
    );
    state.draft = null;
    closeModal();
    go(`/dashboard/scans/${result.product.id}`);
    toast("Assessment saved with image evidence. Review uncertain findings.");
  } catch (error) {
    closeModal();
    toast(
      error.name === "AbortError"
        ? "Processing cancelled. Photos are retained for retry."
        : "OCR or saving failed. Photos are retained for retry. " +
            error.message,
    );
  } finally {
    state.busy = false;
  }
}
function openReview() {
  const assessment = currentAssessment(),
    scan = currentScan();
  if (assessment.id !== scan.latestAssessmentId)
    return toast("Open the latest assessment to record a correction.");
  const finding =
    assessment.findings.find((f) => f.key === state.field) ||
    assessment.findings[0];
  state.field = finding.key;
  const images = data.images.filter((i) => assessment.imageIds.includes(i.id));
  showModal(
    `Review ${finding.name}`,
    `<p class="settings-copy">Record what the packaging proves. Corrections create a new version and preserve this assessment.</p><label>Observed value<input id="correction" maxlength="3000" value="${esc(finding.value)}" placeholder="Enter the exact printed text"></label><div class="form-row"><label>Observation status<select id="review-status">${Object.entries(
      statusLabels,
    )
      .map(
        ([key, title]) =>
          `<option value="${key}" ${finding.status === key ? "selected" : ""}>${title}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Requirement applicability<select id="applicability">${[
      ["unknown", "Unknown / needs legal review"],
      ["applies", "Applies (reviewer confirmed)"],
      ["does_not_apply", "Does not apply"],
    ]
      .map(
        ([key, title]) =>
          `<option value="${key}" ${finding.applicability === key ? "selected" : ""}>${title}</option>`,
      )
      .join(
        "",
      )}</select></label></div><label>Source image<select id="review-image"><option value="">No reliable source image</option>${images.map((image) => `<option value="${image.id}" ${image.id === finding.imageId ? "selected" : ""}>${image.surface} · ${image.id.slice(0, 12)}</option>`).join("")}</select></label><label>Review rationale<textarea id="review-note" maxlength="5000" placeholder="What did you observe, and which evidence supports the change?">${esc(finding.reviewNote)}</textarea></label><label class="checkbox"><input type="checkbox" id="coverage-confirm"> I reviewed all relevant packaging areas with readable coverage. Required for a potential missing-declaration issue.</label><details class="annotation-form"><summary>Optional image highlight (pixel coordinates)</summary><p class="fine-print">Draw attention to the exact region. Leave blank if no reliable region is established.</p><div class="coordinates">${["x0", "y0", "x1", "y1"].map((key) => `<label>${key}<input id="box-${key}" type="number" min="0" placeholder="${key}"></label>`).join("")}</div></details>`,
    `<button class="secondary" data-action="close">Cancel</button><button class="primary" data-action="save-review">${icon("save")} Save review</button>`,
  );
}
async function saveReview() {
  const assessment = currentAssessment(),
    scan = currentScan();
  const status = $("#review-status").value,
    value = $("#correction").value.trim(),
    note = $("#review-note").value.trim(),
    applicability = $("#applicability").value,
    imageId = $("#review-image").value || null,
    coverageConfirmed = $("#coverage-confirm").checked;
  const imageIds = assessment.imageIds;
  const error = validateReview({
    status,
    value,
    note,
    coverageConfirmed,
    applicability,
    imageId,
    imageIds,
  });
  if (error) return toast(error);
  const coordinates = ["x0", "y0", "x1", "y1"].map(
    (key) => $("#box-" + key).value,
  );
  let box = null;
  if (coordinates.some((v) => v !== "")) {
    const image = data.images.find((i) => i.id === imageId);
    box = Object.fromEntries(
      ["x0", "y0", "x1", "y1"].map((key, i) => [key, Number(coordinates[i])]),
    );
    if (
      !image ||
      coordinates.some((v) => v === "") ||
      !validateBox(box, image.width, image.height)
    )
      return toast("Enter four valid coordinates inside the selected image.");
  }
  const findings = structuredClone(assessment.findings);
  const finding = findings.find((f) => f.key === state.field);
  const keepBox =
    finding.value === value &&
    finding.imageId === imageId &&
    status === "observed";
  Object.assign(finding, {
    status,
    value,
    applicability,
    imageId,
    humanConfirmed: true,
    reviewNote: note,
    coverageConfirmed,
    coverageImageIds: coverageConfirmed ? [...imageIds] : [],
    box: status === "observed" ? box || (keepBox ? finding.box : null) : null,
  });
  await commitAssessment(
    scan,
    data.images.filter((i) => imageIds.includes(i.id)),
    findings,
    `${finding.name} reviewed`,
    "correction",
  );
  closeModal();
  go(`/dashboard/scans/${scan.id}?field=${finding.key}`);
  toast("Review saved. Earlier assessment versions are preserved.");
}
async function exportBundle(scanId = null) {
  const scan = scanId ? data.scans.find((s) => s.id === scanId) : null;
  const assessment = scanId ? currentAssessment() : null;
  const selectedScans = scan
    ? [
        {
          ...scan,
          ...assessment.productSnapshot,
          latestAssessmentId: assessment.id,
        },
      ]
    : data.scans;
  const selectedAssessments = assessment ? [assessment] : data.assessments;
  const imageIds = new Set(selectedAssessments.flatMap((a) => a.imageIds));
  const images = await Promise.all(
    data.images.filter((image) => imageIds.has(image.id)).map(imageToJSON),
  );
  const payload = {
    format: "labelproof-workspace",
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    applicationVersion: "2.0.0",
    limitations:
      "Preliminary observations. Legal clauses, applicability and licences are not automatically verified. Local audit history is not tamper-proof.",
    scans: selectedScans,
    images,
    assessments: selectedAssessments,
    events: data.events.filter((e) => !scanId || e.scanId === scanId),
    settings: scanId ? undefined : data.settings,
    drafts: scanId ? undefined : data.drafts,
  };
  download(
    JSON.stringify(payload, null, 2),
    scanId ? "labelproof-report.json" : "labelproof-workspace-backup.json",
  );
  await event(
    "export",
    scanId ? "Evidence report exported" : "Workspace backup exported",
    scanId,
  );
  await refresh();
}
async function importBackup(file) {
  if (!file) return;
  if (file.size > 80 * 1024 * 1024)
    return toast("Backup is too large. Use a file under 80 MB.");
  const input = validateBackup(JSON.parse(await file.text()));
  const scanIds = new Map(input.scans.map((scan) => [scan.id, id()])),
    imageIds = new Map(input.images.map((image) => [image.id, id()])),
    assessmentIds = new Map(
      input.assessments.map((assessment) => [assessment.id, id()]),
    );
  const images = [];
  for (const original of input.images) {
    let blob;
    if (original.data) {
      blob = await (await fetch(original.data)).blob();
      const bitmap = await createImageBitmap(blob);
      if (
        bitmap.width !== original.width ||
        bitmap.height !== original.height
      ) {
        bitmap.close();
        throw new Error("Image dimensions do not match backup metadata.");
      }
      bitmap.close();
    }
    const record = {
      id: imageIds.get(original.id),
      scanId: scanIds.get(original.scanId),
      surface: surfaces.includes(original.surface) ? original.surface : "Back",
      width: original.width,
      height: original.height,
      quality: ["Unknown", "Readable", "Unreadable"].includes(original.quality)
        ? original.quality
        : "Unknown",
      blob,
      fixture: original.fixture,
      text: original.text || "",
      confidence: Number.isFinite(original.confidence)
        ? original.confidence
        : null,
      sha256: blob
        ? Array.from(
            new Uint8Array(
              await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
            ),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("")
        : undefined,
      createdAt: original.createdAt || new Date().toISOString(),
      demo: !!original.demo,
      ocrEngine: String(original.ocrEngine || "Imported extraction").slice(
        0,
        80,
      ),
      language: ["eng", "eng+hin"].includes(original.language)
        ? original.language
        : undefined,
      lines: (Array.isArray(original.lines) ? original.lines : [])
        .slice(0, 20000)
        .filter(
          (l) =>
            typeof l.text === "string" &&
            l.text.length <= 1000 &&
            validateBox(l.bbox, original.width, original.height),
        )
        .map((l) => ({
          text: l.text,
          bbox: l.bbox,
          confidence: Number.isFinite(l.confidence) ? l.confidence : null,
        })),
    };
    images.push(record);
  }
  const assessments = input.assessments.map((original) => ({
    id: assessmentIds.get(original.id),
    scanId: scanIds.get(original.scanId),
    version: original.version,
    createdAt: original.createdAt,
    reason:
      "Imported: " + String(original.reason || "assessment").slice(0, 120),
    reviewer: String(original.reviewer || "Imported reviewer").slice(0, 80),
    rulePack: String(original.rulePack || RULE_PACK).slice(0, 100),
    pipeline: String(original.pipeline || PIPELINE).slice(0, 100),
    demo: !!original.demo,
    imageIds: original.imageIds.map((i) => imageIds.get(i)),
    findings: original.findings.map((f) => {
      const field = fields.find((x) => x.key === f.key);
      return {
        key: field.key,
        name: field.name,
        source: field.source,
        surface: field.surface,
        status: f.status,
        value: f.value || "",
        applicability: ["unknown", "applies", "does_not_apply"].includes(
          f.applicability,
        )
          ? f.applicability
          : "unknown",
        imageId: imageIds.get(f.imageId) || null,
        box: f.box || null,
        humanConfirmed: !!f.humanConfirmed,
        reviewNote: f.reviewNote || "",
        coverageConfirmed: !!f.coverageConfirmed,
        coverageImageIds: (f.coverageImageIds || [])
          .map((i) => imageIds.get(i))
          .filter(Boolean),
        observations: (f.observations || []).map((o) => ({
          value: String(o.value || "").slice(0, 3000),
          imageId: imageIds.get(o.imageId),
          box: o.box || null,
          confidence: Number.isFinite(o.confidence) ? o.confidence : 0,
        })),
        registryVerification:
          field.key === "licence" ? "NOT_ATTEMPTED" : undefined,
      };
    }),
  }));
  for (const [index, assessment] of assessments.entries()) {
    const snapshot =
      input.assessments[index].productSnapshot ||
      input.scans.find((s) => s.id === input.assessments[index].scanId);
    assessment.productSnapshot = {
      name: String(snapshot.name || "Imported product").slice(0, 120),
      brand: String(snapshot.brand || "").slice(0, 100),
      category: String(snapshot.category || "Other packaged food").slice(
        0,
        100,
      ),
      origin: ["Domestic", "Imported", "Unknown"].includes(snapshot.origin)
        ? snapshot.origin
        : "Unknown",
      demo: !!snapshot.demo,
    };
    assessment.imageSnapshots = images
      .filter((i) => assessment.imageIds.includes(i.id))
      .map((i) => ({
        id: i.id,
        sha256: i.sha256 || null,
        fixture: i.fixture || null,
        surface: i.surface,
        quality: i.quality,
        width: i.width,
        height: i.height,
      }));
  }
  const scans = input.scans.map((original) => ({
    id: scanIds.get(original.id),
    name: original.name,
    brand: original.brand || "",
    category: original.category,
    origin: ["Domestic", "Imported", "Unknown"].includes(original.origin)
      ? original.origin
      : "Unknown",
    demo: !!original.demo,
    createdAt: original.createdAt,
    updatedAt: new Date().toISOString(),
    latestAssessmentId: assessmentIds.get(original.latestAssessmentId),
    productImage: [
      "/images/oats-pack.svg",
      "/images/tea-pack.svg",
      "/images/snack-pack.svg",
    ].includes(original.productImage)
      ? original.productImage
      : undefined,
  }));
  const importedEvents = (Array.isArray(input.events) ? input.events : [])
    .slice(0, 10000)
    .filter(
      (e) => typeof e.message === "string" && Number.isFinite(Date.parse(e.at)),
    )
    .map((e) => ({
      id: id(),
      scanId: scanIds.get(e.scanId) || null,
      type: "imported_" + String(e.type || "event").slice(0, 40),
      message: String(e.message).slice(0, 3000),
      actor: "Imported: " + String(e.actor || "reviewer").slice(0, 80),
      at: e.at,
    }));
  const importedDrafts = (Array.isArray(input.drafts) ? input.drafts : [])
    .slice(0, 500)
    .filter((d) => typeof d.title === "string" && typeof d.note === "string")
    .map((d) => ({
      id: id(),
      title: d.title.slice(0, 120),
      note: d.note.slice(0, 5000),
      source: sources.some((s) => s.id === d.source) ? d.source : "lm",
      clause: String(d.clause || "").slice(0, 100),
      effectiveDate: /^\d{4}-\d{2}-\d{2}$/.test(d.effectiveDate)
        ? d.effectiveDate
        : "",
      createdAt: Number.isFinite(Date.parse(d.createdAt))
        ? d.createdAt
        : new Date().toISOString(),
      status: "draft",
    }));
  const preferences =
    input.settings && typeof input.settings === "object"
      ? {
          ...data.settings,
          workspaceName: String(
            input.settings.workspaceName || data.settings.workspaceName,
          ).slice(0, 80),
          reviewerName: String(
            input.settings.reviewerName || data.settings.reviewerName,
          ).slice(0, 80),
          language: input.settings.language === "eng+hin" ? "eng+hin" : "eng",
          confidenceThreshold:
            Number.isFinite(input.settings.confidenceThreshold) &&
            input.settings.confidenceThreshold >= 1 &&
            input.settings.confidenceThreshold <= 95
              ? input.settings.confidenceThreshold
              : data.settings.confidenceThreshold,
          initialized: true,
        }
      : data.settings;
  await storage.transact(
    ["scans", "images", "assessments", "events", "drafts", "settings"],
    "readwrite",
    (stores) => {
      scans.forEach((s) => stores.scans.add(s));
      images.forEach((i) => stores.images.add(i));
      assessments.forEach((a) => stores.assessments.add(a));
      importedEvents.forEach((e) => stores.events.add(e));
      importedDrafts.forEach((d) => stores.drafts.add(d));
      stores.settings.put(preferences);
      stores.events.add({
        id: id(),
        type: "import",
        message: `Imported ${scans.length} products with ${images.length} images`,
        actor: preferences.reviewerName,
        at: new Date().toISOString(),
      });
    },
  );
  await refresh();
  go("/dashboard/scans");
  toast(
    `Imported ${scans.length} products with their images and assessment versions.`,
  );
}
function showImage(imageId) {
  const image = data.images.find((i) => i.id === imageId);
  if (!image) return;
  showModal(
    `${image.surface} image evidence`,
    `<img class="modal-evidence" src="${imageUrl(image)}" alt="Original ${esc(image.surface)} packaging photo"><details class="ocr-details"><summary>Extracted OCR text</summary><pre>${esc(image.text || "No extraction available")}</pre></details><p class="fine-print">${image.width} × ${image.height} · ${esc(image.quality)} · ${image.demo ? "Synthetic fixture" : "Original upload"}<br>SHA-256: ${esc(image.sha256 || "See synthetic source asset")}</p>`,
    `<a class="primary" href="/dashboard/scans/${image.scanId}" data-close-link>Open related report ${icon("arrow-right")}</a>`,
  );
}
function draftRule() {
  showModal(
    "Add a regulatory review note",
    `<p class="settings-copy">This draft stays in your workspace. It is never executed as a legal rule.</p><label>Title<input id="draft-title" maxlength="120" placeholder="e.g. Review a category-specific exception"></label><label>Official source<select id="draft-source">${sources.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select></label><div class="form-row"><label>Clause locator<input id="draft-clause" maxlength="100" placeholder="Unverified until reviewed"></label><label>Effective date<input id="draft-date" type="date"></label></div><label>Review note<textarea id="draft-note" maxlength="5000" placeholder="Summarize the question, applicability and source evidence."></textarea></label>`,
    `<button class="secondary" data-action="close">Cancel</button><button class="primary" data-action="save-draft">${icon("save")} Save draft note</button>`,
  );
}
function bindForms() {
  document
    .querySelectorAll("#product-name,#product-brand,#category,#origin,#surface")
    .forEach((input) => input.addEventListener("input", draftMetadata));
  document.querySelectorAll("label:has(input[type=file])").forEach((label) => {
    label.tabIndex = 0;
    label.setAttribute("role", "button");
    label.addEventListener("keydown", (e) => {
      if (["Enter", " "].includes(e.key)) {
        e.preventDefault();
        label.querySelector("input").click();
      }
    });
  });
  $("#global-search")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.search = e.target.querySelector("input").value;
    go("/dashboard/scans");
  });
  $("#settings-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.savingSettings) return;
    state.savingSettings = true;
    try {
      const form = new FormData(e.target);
      const threshold = Number(form.get("confidenceThreshold"));
      const settings = {
        ...data.settings,
        workspaceName: String(form.get("workspaceName")).trim(),
        reviewerName: String(form.get("reviewerName")).trim(),
        language: String(form.get("language")),
        confidenceThreshold: threshold,
      };
      if (
        !settings.workspaceName ||
        !settings.reviewerName ||
        threshold < 1 ||
        threshold > 95
      )
        return toast("Enter valid preferences.");
      await storage.put("settings", settings);
      await event("settings", "Workspace preferences updated");
      await refresh();
      render();
      toast("Preferences saved on this device.");
    } catch (error) {
      toast(error.message);
    } finally {
      state.savingSettings = false;
    }
  });
  $("#file")?.addEventListener("change", (e) => upload([...e.target.files]));
  $("#camera-file")?.addEventListener("change", (e) =>
    upload([...e.target.files]),
  );
  $("#backup-file")?.addEventListener("change", async (e) => {
    if (state.importing) return;
    state.importing = true;
    try {
      await importBackup(e.target.files[0]);
    } catch (error) {
      toast("Import rejected: " + error.message);
    } finally {
      state.importing = false;
      e.target.value = "";
    }
  });
  $("#dropzone")?.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragging");
  });
  $("#dropzone")?.addEventListener("dragleave", (e) =>
    e.currentTarget.classList.remove("dragging"),
  );
  $("#dropzone")?.addEventListener("drop", (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragging");
    upload([...e.dataTransfer.files]);
  });
  $("#scan-search")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    const position = e.target.selectionStart;
    render();
    $("#scan-search").focus();
    $("#scan-search").setSelectionRange(position, position);
  });
  $("#scan-filter")?.addEventListener("change", (e) => {
    state.scanFilter = e.target.value;
    render();
  });
  $("#gallery-filter")?.addEventListener("change", (e) => {
    state.galleryFilter = e.target.value;
    render();
  });
  $("#assessment-version")?.addEventListener("change", (e) =>
    go(`/dashboard/scans/${currentScan().id}?version=${e.target.value}`),
  );
  document
    .querySelectorAll("[data-image-surface],[data-image-quality]")
    .forEach((element) =>
      element.addEventListener("change", (e) => {
        draftMetadata();
        const index = Number(
          e.target.dataset.imageSurface ?? e.target.dataset.imageQuality,
        );
        const image = state.draft.images[index];
        const persisted = data.images.some((i) => i.id === image.id);
        if (persisted) image.id = id();
        if (e.target.dataset.imageSurface !== undefined)
          image.surface = e.target.value;
        else {
          image.quality = e.target.value;
          image.qualityReason = "Manually classified during capture";
        }
        render();
      }),
    );
}
document.addEventListener("click", async (e) => {
  const anchor = e.target.closest("a");
  if (
    anchor &&
    anchor.origin === location.origin &&
    (/^\/dashboard/.test(anchor.pathname) || anchor.pathname === "/") &&
    !anchor.hash &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey &&
    e.button === 0
  ) {
    e.preventDefault();
    if (state.busy || state.actionBusy) return;
    closeModal();
    go(anchor.pathname + anchor.search);
    return;
  }
  const element = e.target.closest(
    "[data-action],[data-rescan],[data-finding],[data-evidence],[data-review-filter],[data-finding-filter],[data-remove],[data-image],[data-delete-draft]",
  );
  if (element?.dataset.action === "cancel-ocr") {
    state.ocrController?.abort();
    return;
  }
  if (!element || element.disabled || state.busy || state.actionBusy) return;
  state.actionBusy = true;
  element.setAttribute("aria-busy", "true");
  try {
    if (element.dataset.rescan)
      return await rescan(element.dataset.rescan, element.dataset.rescanField);
    if (element.dataset.finding) {
      state.field = element.dataset.finding;
      const params = new URLSearchParams(location.search);
      params.set("field", state.field);
      history.replaceState({}, "", location.pathname + "?" + params);
      state.evidenceImage = null;
      state.zoom = 1;
      render();
      return;
    }
    if (element.dataset.evidence) {
      state.evidenceImage = element.dataset.evidence;
      state.zoom = 1;
      render();
      return;
    }
    if (element.dataset.reviewFilter) {
      state.reviewFilter = element.dataset.reviewFilter;
      render();
      return;
    }
    if (element.dataset.findingFilter) {
      state.findingFilter = element.dataset.findingFilter;
      const selected = currentAssessment().findings.find(
        (f) =>
          state.findingFilter === "all" ||
          (state.findingFilter === "observed"
            ? f.status === "observed"
            : !["observed", "not_applicable"].includes(f.status)),
      );
      if (selected) {
        state.field = selected.key;
        const params = new URLSearchParams(location.search);
        params.set("field", state.field);
        history.replaceState({}, "", location.pathname + "?" + params);
        state.evidenceImage = null;
      }
      render();
      return;
    }
    if (element.dataset.image) return showImage(element.dataset.image);
    if (element.dataset.remove !== undefined) {
      draftMetadata();
      const [removed] = state.draft.images.splice(
        Number(element.dataset.remove),
        1,
      );
      if (removed && urls.has(removed.id)) {
        URL.revokeObjectURL(urls.get(removed.id));
        urls.delete(removed.id);
      }
      render();
      return;
    }
    if (element.dataset.deleteDraft) {
      await storage.transact(["drafts"], "readwrite", (stores) =>
        stores.drafts.delete(element.dataset.deleteDraft),
      );
      await event("draft", "Regulatory draft note deleted");
      await refresh();
      render();
      return;
    }
    const action = element.dataset.action;
    if (action === "cancel-capture") {
      state.draft = null;
      go("/dashboard");
    }
    if (action === "new") {
      state.draft = newDraft();
      go("/dashboard/new");
    }
    if (action === "close") closeModal();
    if (action === "menu") {
      const open = $(".workspace-sidebar").classList.toggle("menu-open");
      document.body.classList.toggle("navigation-open", open);
      $(".menu-toggle").setAttribute("aria-expanded", String(open));
    }
    if (action === "analyze") await analyze();
    if (action === "review") openReview();
    if (action === "save-review") await saveReview();
    if (action === "export-report") await exportBundle(currentScan().id);
    if (action === "export-workspace") await exportBundle();
    if (action === "export-csv") {
      download(
        findingsCSV(
          currentAssessment().productSnapshot || currentScan(),
          currentAssessment(),
          sources,
        ),
        "labelproof-findings.csv",
        "text/csv;charset=utf-8",
      );
      await event(
        "export",
        "Finding register exported as CSV",
        currentScan().id,
      );
      await refresh();
    }
    if (action === "print") {
      const { saveReportPDF } = await import("./pdf.js");
      await saveReportPDF(
        currentScan(),
        currentAssessment(),
        data.images,
        imageUrl,
      );
      await event(
        "export",
        "Complete report and image evidence downloaded as PDF",
        currentScan().id,
      );
      await refresh();
    }
    if (action === "zoom-in") {
      state.zoom = Math.min(2, state.zoom + 0.25);
      render();
    }
    if (action === "zoom-out") {
      state.zoom = Math.max(0.75, state.zoom - 0.25);
      render();
    }
    if (action === "notifications")
      showModal(
        "Recent workspace activity",
        activityList(data.events.slice(0, 8)),
        `<a class="secondary" href="/dashboard/activity">View complete timeline</a>`,
      );
    if (action === "draft-rule") draftRule();
    if (action === "delete-scan")
      showModal(
        "Delete this product and its evidence?",
        `<p class="settings-copy">${esc(currentScan().name)} and all its images and assessment versions will be removed from this browser. Export a backup first if you need them.</p>`,
        `<button class="secondary" data-action="close">Keep product</button><button class="danger-button" data-action="confirm-delete-scan">Delete product</button>`,
      );
    if (action === "confirm-delete-scan") {
      const scan = currentScan();
      for (const image of data.images.filter((i) => i.scanId === scan.id)) {
        if (urls.has(image.id)) {
          URL.revokeObjectURL(urls.get(image.id));
          urls.delete(image.id);
        }
      }
      await storage.deleteScan(scan.id);
      await event("delete", `${scan.name} removed from local workspace`);
      await refresh();
      closeModal();
      go("/dashboard/scans");
      toast("Product and evidence deleted from this device.");
    }
    if (action === "save-draft") {
      const title = $("#draft-title").value.trim(),
        note = $("#draft-note").value.trim();
      if (!title || !note) return toast("Add a title and a review note.");
      await storage.put("drafts", {
        id: id(),
        title,
        note,
        source: $("#draft-source").value,
        clause: $("#draft-clause").value.trim(),
        effectiveDate: $("#draft-date").value,
        createdAt: new Date().toISOString(),
        status: "draft",
      });
      await event("draft", "Regulatory review note saved");
      await refresh();
      closeModal();
      render();
      toast("Draft saved. It does not affect assessments.");
    }
    if (action === "load-demos") {
      await seedDemos();
      state.search = "";
      state.scanFilter = "all";
      await refresh();
      render();
      toast("Three labelled synthetic samples are ready.");
    }
    if (action === "clear")
      showModal(
        "Clear this local workspace?",
        `<p class="settings-copy">This removes all products, images, reports, review notes and preferences from this browser. Export a backup first if you want to keep them.</p>`,
        `<button class="secondary" data-action="close">Keep workspace</button><button class="danger-button" data-action="confirm-clear">Delete local data</button>`,
      );
    if (action === "confirm-clear") {
      await storage.clearWorkspace();
      await storage.put("settings", { ...storage.defaults, initialized: true });
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      await refresh();
      state.draft = null;
      closeModal();
      go("/dashboard");
      toast("Local workspace cleared. You can load samples again.");
    }
  } catch (error) {
    toast(error.message || "This action could not complete.");
    console.error(error);
  } finally {
    state.actionBusy = false;
    element.removeAttribute("aria-busy");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.body.classList.remove("navigation-open");
    $(".workspace-sidebar")?.classList.remove("menu-open");
  }
});
window.addEventListener("popstate", () => {
  draftMetadata();
  state.evidenceImage = null;
  render();
});
window.addEventListener("beforeunload", () =>
  urls.forEach((url) => URL.revokeObjectURL(url)),
);

async function migrateOldSummaries() {
  const raw = localStorage.getItem("labelproof-history");
  if (!raw) return;
  try {
    const old = JSON.parse(raw);
    if (!Array.isArray(old)) return;
    for (const record of old.filter((r) => !r.demo).slice(0, 20)) {
      const findings = fields.map((field) => {
        const prior = record.findings?.find((f) => f.key === field.key);
        return {
          key: field.key,
          name: field.name,
          source: field.source,
          surface: field.surface,
          status: "not_captured",
          applicability: "unknown",
          value: prior?.value || "",
          imageId: null,
          box: null,
          humanConfirmed: false,
          reviewNote:
            "Migrated from the first prototype. Original photographs were not retained. Re-upload photos before relying on observations.",
          observations: [],
        };
      });
      await commitAssessment(
        {
          name: String(record.name || "Migrated product").slice(0, 120),
          brand: "",
          category: "Other packaged food",
          origin: "Unknown",
          demo: false,
        },
        [],
        findings,
        "Legacy summary migrated",
      );
    }
    localStorage.removeItem("labelproof-history");
  } catch {
    /* Keep unrecognized legacy data untouched. */
  }
}
async function boot() {
  $("#app").innerHTML =
    '<div class="boot-screen"><div class="spinner"></div><h2>Opening your evidence workspace…</h2></div>';
  try {
    const settings = await storage.getSettings();
    if (!settings.initialized) {
      await seedDemos();
      await storage.put("settings", { ...settings, initialized: true });
    }
    await refresh();
    await migrateOldSummaries();
    render();
  } catch (error) {
    $("#app").innerHTML =
      `<div class="boot-screen"><h1>Browser storage is unavailable.</h1><p>${esc(error.message)}</p><p>Enable site storage or open LabelProof in a regular browser window.</p><button onclick="location.reload()" class="primary">Retry</button></div>`;
  }
}
boot();
