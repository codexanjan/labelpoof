import { esc, date } from "../ui.js";
import { cloudStatus } from "../cloud.js";
import { isDemoUser } from "../demo-access.js";
export function cloudJobRows(jobs) {
  return (
    jobs
      .map(
        (j) =>
          `<article class="rule-drafts"><b>${esc(j.request.name)}</b><p>${esc(j.status)} · Attempt ${j.attempts} of 3 · ${date(j.updated_at)}${j.error ? " · " + esc(j.error) : ""}</p>${j.result_scan ? "<p>Report is saved in the cloud. Download completed reports to review evidence.</p>" : ""}</article>`,
      )
      .join("") || "<p>No saved cloud jobs yet.</p>"
  );
}
export function cloudProcessing(data) {
  const ready =
    cloudStatus.configured && cloudStatus.user && !isDemoUser(cloudStatus.user);
  return `<section class="panel"><h2>Cloud processing</h2><p>Upload photos once. Server OCR continues after you close this page, retries interrupted attempts and saves a versioned report to your private team workspace. Results still require human review.</p>
    <label>Cloud organization ID<input id="cloud-job-org" value="${esc(data.settings.cloudOrganization || "")}" placeholder="Select your organization in Team & cloud"></label>
    <label>Product name<input id="cloud-job-name" maxlength="120" placeholder="Name on the pack"></label>
    <label>Photo panel<select id="cloud-job-surface">${["Front", "Back", "Left", "Right", "Top", "Bottom", "Wraparound"].map((s) => `<option ${s === "Back" ? "selected" : ""}>${s}</option>`).join("")}</select></label>
    <label>Label photos<input id="cloud-job-files" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>
    <p class="fine-print">1–6 photos of one product, 12 MiB each. English or English + Hindi follows your Settings choice. Daily limit: 20 jobs per team. Other panels remain “not photographed” until captured.</p>
    <div class="capture-actions"><button class="primary" data-extra="queue-cloud-job" ${ready ? "" : "disabled"}>Upload and process in cloud</button><button class="secondary" data-extra="load-cloud-jobs" ${cloudStatus.user ? "" : "disabled"}>Refresh cloud jobs</button><button class="secondary" data-extra="download-job-reports" ${cloudStatus.user ? "" : "disabled"}>Download completed reports</button></div>
    <p role="status" id="cloud-job-progress">${ready ? "Private team access is checked by the server." : "Sign in to your own account to upload. The shared demo is read-only."}</p>
    <div id="cloud-jobs-list">${(data.cloudJobs || []).map((j) => `<article class="rule-drafts"><b>${esc(j.request.name)}</b><p>${esc(j.status)} · Attempt ${j.attempts} of 3 · ${date(j.updated_at)}${j.error ? " · " + esc(j.error) : ""}</p>${j.result_scan ? "<p>Report is saved in the cloud. Download completed reports to review evidence.</p>" : ""}</article>`).join("") || "<p>Refresh to load saved cloud jobs.</p>"}</div>
  </section>`;
}
export function cloudRestore(data) {
  return `<section class="panel"><h2>Cloud restore points and audit</h2><p>Each publication keeps the previous snapshot. Up to ten recent restore points are retained. Restoring creates a new cloud version; only a team administrator can restore.</p><div class="capture-actions"><button class="secondary" data-extra="list-restore-points">Show restore points</button><button class="secondary" data-extra="cloud-audit">Show server audit</button></div><div id="restore-points"></div><label>Restore version<input id="restore-version" type="number" min="1"></label><button class="secondary" data-extra="preview-restore">Preview selected restore point</button><div id="restore-preview"></div><p class="fine-print">Restoring report records requires their original private photos to remain available. Export backups before removing cloud evidence.</p><div id="cloud-audit"></div></section>`;
}
