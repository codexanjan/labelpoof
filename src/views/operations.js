import { esc, heading, date } from "../ui.js";
import { cloudStatus } from "../cloud.js";
import { DEMO_ACCESS, isDemoUser } from "../demo-access.js";
const button = (key, label) =>
  `<button class="secondary" data-extra="${key}" ${isDemoUser(cloudStatus.user) && ["create-org", "add-member", "sync-cloud"].includes(key) ? 'disabled title="Shared demo cloud workspace is read-only"' : ""}>${label}</button>`;
export function operationsView(view, data) {
  const rows = data.operations || [];
  const demo = isDemoUser(cloudStatus.user);
  if (view === "account")
    return `${heading("ACCOUNT & PRIVACY", "Your workspace, your control.", "Local mode is available without an account. Cloud features need a connected project.")}<div class="settings-grid"><section class="panel"><h2>${cloudStatus.user ? "Signed in" : "Account access"}</h2><p>${esc(cloudStatus.user?.email || (cloudStatus.configured ? "Cloud connected" : "Cloud project setup pending"))}</p>${cloudStatus.user ? `<p>Your team user ID: <code>${esc(cloudStatus.user.id)}</code></p>` : ""}${cloudStatus.recovery ? `<p>Recovery link accepted. Enter a new password and choose Update password.</p>` : ""}${demo ? `<p class="badge review">Shared demo · read-only cloud access</p>` : ""}<p class="fine-print">Public signup and recovery email delivery await an administrator email provider. Existing confirmed accounts can sign in.</p><label>Email<input id="account-email" type="email" autocomplete="email"></label><label>Password<input id="account-password" type="password" minlength="12" autocomplete="current-password"></label><div class="capture-actions">${button("login", "Sign in")}${button("signup", "Create account")}${!demo ? button("recovery", "Reset password") : ""}${cloudStatus.user && !demo ? button("password", "Update password") : ""}${cloudStatus.user ? button("logout", "Sign out") : ""}</div><div class="rule-drafts"><h3>Try the demo</h3><p>Email: <code>${esc(DEMO_ACCESS.email)}</code><br>Password: <code>${esc(DEMO_ACCESS.password)}</code></p><p>Synthetic products only. Shared cloud data is read-only; local experiments remain on this browser. Use your own account for real product photos.</p>${button("demo", "Sign in to demo")}</div></section><section class="panel"><h2>Privacy and retention</h2><p>Photos and reports saved or downloaded to this browser remain here after sign-out. On a shared device, remove them in Settings when finished. Cloud sync uploads selected workspace records and images to private storage. Never upload personal material you do not have permission to process.</p><label>Retention reminder (days)<input id="retention-days" type="number" min="1" max="3650" value="${data.settings.retentionDays || 90}"></label>${button("retention", "Save retention reminder")}<p class="fine-print">A reminder is not automatic deletion. Use Settings to export or delete local records. Cloud deletion must be separately confirmed.</p><a href="/dashboard/settings" class="text-button">Manage and export local data</a></section></div>`;
  if (view === "team")
    return `${heading("TEAM & CLOUD", "Connect your review team.", "Cloud access is enforced by organization membership and server permissions.")}<section class="panel"><p>${cloudStatus.configured ? "Cloud connected. Sign in to load your organizations." : "Cloud project setup pending. Team controls activate after connection."}</p>${demo ? `<p class="badge review">Read-only demo: load organizations, select LabelProof Demo, then download the sample workspace.</p>` : ""}<label>Organization name<input id="org-name" maxlength="80" placeholder="Your review team"></label>${button("create-org", "Create organization")}${button("list-orgs", "Load my organizations")}<div id="org-list"></div><label>Organization ID<input id="org-id" placeholder="Select or paste an organization ID"></label><label>Team member user ID<input id="member-id" placeholder="User ID of a registered teammate"></label><label>Role<select id="member-role"><option>uploader</option><option>reviewer</option><option>admin</option></select></label><div class="capture-actions">${button("add-member", "Save member role")}${button("list-members", "Show members")}${button("sync-cloud", "Upload local workspace")}${button("pull-cloud", "Download cloud workspace")}</div><p class="fine-print">Sync uses version checks to prevent overwriting a newer team snapshot. Download merges the selected cloud snapshot: matching cloud records are updated, unrelated local products stay available. Export a local backup before downloading if you have unsynced edits. Repeated downloads do not duplicate products.</p><div id="team-result"></div></section>`;
  if (view === "processing")
    return `${heading("PROCESSING & BULK CAPTURE", "Work that can recover.", "Saved capture and processing records survive reload. Browser OCR requires this page to remain open.")}<section class="panel"><h2>Add a batch</h2><p>Each image becomes a separate product. For multiple sides of one product, use New scan.</p><label class="secondary">Select batch photos<input id="batch-files" type="file" accept="image/png,image/jpeg,image/webp" multiple></label><div class="capture-actions">${button("run-batch", "Process queued products")}${button("stop-batch", "Stop after current product")}</div></section><section class="panel"><h2>Processing history</h2><p id="job-progress" role="status"></p>${
      rows
        .filter((r) => r.type === "job")
        .map(
          (r) =>
            `<article class="rule-drafts"><b>${esc(r.name)}</b><p>${esc(r.status)} · ${date(r.at)}${r.error ? " · " + esc(r.error) : ""}</p>${r.scanId ? `<a href="/dashboard/scans/${esc(r.scanId)}">Open report</a>` : ""}${["queued", "failed", "interrupted"].includes(r.status) ? `<button class="secondary" data-extra="retry-job" data-record="${r.id}">Retry / resume</button>` : ""}${["queued", "failed", "interrupted"].includes(r.status) ? `<button class="danger-button" data-extra="remove-job" data-record="${r.id}">Remove</button>` : ""}</article>`,
        )
        .join("") || "<p>No processing jobs yet.</p>"
    }</section>`;
  if (view === "approvals")
    return `${heading("REVIEW WORKFLOW", "Decisions with a record.", "Local reviewer decisions are preliminary. Cloud roles are required for trusted team approvals.")}<section class="panel"><label>Product<select id="workflow-scan">${data.scans.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label><label>Cloud organization ID (optional)<input id="workflow-org" placeholder="Leave blank for a local preliminary review"></label><label>Assigned reviewer<input id="assigned-reviewer" maxlength="120" placeholder="Reviewer name or cloud user ID"></label><label>Comment / rationale<textarea id="workflow-note" maxlength="5000"></textarea></label><div class="capture-actions">${button("assign", "Assign review")}${button("comment", "Add comment")}${button("rescan-request", "Request rescan")}${button("approve", "Record preliminary approval")}${button("reject", "Return for revision")}${button("cloud-reviews", "Load team review records")}</div><div id="cloud-review-list"></div><p class="fine-print">Approval refers to one assessment version. New photos or corrections require another review. Approval does not certify legal compliance.</p></section><section class="panel"><h2>Review timeline</h2>${
      rows
        .filter((r) => r.type === "workflow")
        .map(
          (r) =>
            `<article><b>${esc(r.action)} · ${esc(data.scans.find((s) => s.id === r.scanId)?.name || "Removed product")}</b><p>${esc(r.note)} · ${esc(r.actor)} · ${date(r.at)}</p><small>Assessment ${esc(r.assessmentId)}${r.assigned ? " · Assigned: " + esc(r.assigned) : ""}</small></article>`,
        )
        .join("") || "<p>No review events yet.</p>"
    }</section>`;
  if (view === "compare")
    return `${heading("PACKAGING COMPARISON", "See what changed.", "Compare any two saved assessment versions, including product revisions.")}<section class="panel"><div class="form-row">${["compare-a", "compare-b"].map((id) => `<label>${id.endsWith("a") ? "Earlier / first" : "Later / second"} assessment<select id="${id}">${data.assessments.map((a) => `<option value="${a.id}">${esc(data.scans.find((s) => s.id === a.scanId)?.name || "Product")} · v${a.version}</option>`).join("")}</select></label>`).join("")}</div>${button("compare", "Compare findings")}<div id="comparison-result"></div></section>`;
  return `${heading("OPERATIONS & RELEASE READINESS", "Know what is ready.", "Deployment health is separate from legal validation and OCR accuracy.")}<div class="stats-grid">${[
    ["Cloud accounts", cloudStatus.configured ? "Connected" : "Setup pending"],
    ["Legal rule publishing", "Expert review required"],
    ["Registry verification", "Not connected"],
    ["Background OCR", "Browser worker"],
  ]
    .map(
      ([a, b]) => `<section class="panel"><h3>${a}</h3><p>${b}</p></section>`,
    )
    .join(
      "",
    )}</div><section class="panel"><h2>Health and privacy</h2><div class="capture-actions">${button("check-health", "Run health check")}${button("export-operations", "Export processing and review history")}${button("export-evaluation", "Export evaluation template")}</div><pre id="health-result"></pre><p>Real-world evaluation must measure extraction errors and false absence conclusions separately, with language, lighting and packaging categories. No validated accuracy score is claimed.</p><p>Use official source review before publishing any legal rule. A changed rule version must flag previous reports for reassessment.</p></section><section class="panel"><h2>Rule version review</h2><p>Collect clause references and effective dates for expert review. These drafts are never executed as legal rules.</p><label>Version name<input id="rule-version" maxlength="120"></label><label>Official source URL<input id="rule-url" type="url" placeholder="https://fssai.gov.in/..."></label><label>Clause locator<input id="rule-clause" maxlength="200"></label><label>Effective date<input id="rule-effective" type="date"></label><label>Applicability and review notes<textarea id="rule-notes" maxlength="5000"></textarea></label>${button("save-rule-version", "Save rule review draft")}<div>${rows
    .filter((r) => r.type === "ruleRevision")
    .map(
      (r) =>
        `<p><b>${esc(r.version)}</b> · Draft · ${esc(r.clause)} · ${esc(r.effective)}<br>${esc(r.notes)}<br><a href="${esc(r.url)}" target="_blank" rel="noopener">Official reference</a></p>`,
    )
    .join("")}</div><h2>Captured application errors</h2>${
    rows
      .filter((r) => r.type === "error")
      .slice(-15)
      .map((r) => `<p>${esc(r.message)} · ${date(r.at)}</p>`)
      .join("") || "<p>No recorded errors.</p>"
  }<p class="fine-print">Local error history is available for diagnosis. External alert delivery requires a configured monitoring service.</p></section>`;
}
