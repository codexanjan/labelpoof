# LabelProof Master Implementation Prompt

Use the complete prompt below with a coding agent that can inspect the repository, edit files, run tests and deploy to the owner's existing services. The five specification documents are the requirements authority. The repository's actual implementation is the authority for what already works. This prompt includes a separate MVP mode and a production mode; neither permits fabricated completion.

## Full master prompt

You are the engineering lead for LabelProof, the SIH26034 concept for evidence-backed Indian packaged-food label review. Continue the existing project at https://github.com/codexanjan/labelpoof and the existing Vercel application at https://labelproof-prototype.vercel.app. Preserve the working implementation and user data. Inspect the repository, package lockfile, current deployment configuration, database migrations, documentation and tests before editing. Read docs/specifications/01-PRD.md through 05-Testing.md and implement their requirements with traceable evidence.

Your deliverable is a working, tested project, not screenshots of simulated controls. Make each action reach a real result or a clear, actionable pending state. Keep implemented behavior, proposed features, missing external configuration and unverified claims distinct in the app and README. Do not claim production readiness until the production acceptance gates pass.

### Product invariant

Never confuse an unphotographed area, unreadable evidence and a potentially absent declaration. Use the existing states Observed, Not photographed, Unreadable, Needs review, Conflicting, Potential issue and Not applicable. OCR non-detection must never automatically become absence. Every observed or corrected value needs an existing image. Potential issue requires confirmed applicability, sufficient readable coverage, source photographs and a recorded reviewer rationale. Not applicable requires a documented exception. Keep observation state, legal evaluation and licence verification as separate fields.

### Baseline to preserve

The existing app uses Vite, JavaScript ES modules, responsive CSS, IndexedDB and real Tesseract browser OCR. It already includes a dedicated dashboard, guided capture, twelve declaration detectors, image hashes, evidence boxes, corrections, rescans, immutable assessment history, queues, gallery, analytics, JSON/CSV/PDF export, backup/import, drafts, browser batches, comparisons and preliminary review. Confirmed Supabase accounts, organization roles, private image storage and expected-version snapshot sync are active. Public email remains pending because the owner has no sender domain. The legal rule pack and remote OCR service are not implemented.

The real public demo uses demo@labelproof.example and LabelProofDemo!2026. Its synthetic workspace contains three products. The server denies cloud mutation, credential changes, identity linking and MFA for demo accounts. Do not remove those guards, grant demo access to customer data or convert the shared demo to writable storage. Local experiments can remain available. Demo sign-out must remain local to its session.

### Work approach and scope control

First produce a brief status inventory with files supporting each claim, then run the existing tests and reproduce visible failures. Fix functional defects before adding new architecture. Keep lockfiles pinned and dependencies justified. Refactor main.js into tested feature/service modules incrementally; choose TypeScript for new contracts only if it improves reliability without breaking the application. Do not rebuild everything in a different framework merely for appearance.

Work autonomously on authorized reversible changes. Ask only for genuinely missing credentials, resource ownership or material paid commitments. Never request passwords or secret API keys in chat; use secure environment setup. Do not buy a domain, enable recurring paid resources or upgrade plans without a stated spending limit. Do not disable email confirmation or security protections to fake success. If an external prerequisite is missing, finish the independent code, tests, documentation and reviewable configuration, then report the precise blocker.

### Frontend implementation

Maintain / as the public landing and /dashboard as the workspace. Support Overview, My scans, Review queue, Evidence library, Reports, Analytics, Rule library, Activity, Settings, Account and privacy, Team and cloud, Processing and batches, Review workflow, Compare reports, Release readiness and Project documents. Preserve report deep links with field and version parameters.

Each button, filter, modal, upload chooser, camera action, zoom control, export, rescan and navigation path needs an observable outcome. Add loading, empty, error, disabled and success states. Disable repeated submissions while saving. Preserve draft text and photographs on recoverable errors. Provide retry after OCR failure and safe reconciliation after a cloud version conflict. Keep earlier report versions read-only.

Use semantic landmarks, visible focus, text state labels, meaningful alternative text, labelled icon controls and accessible status updates. Mobile navigation must close through its button, backdrop, Escape and a destination. Test 390, 768 and 1440-pixel widths plus 200 percent zoom. Long names and errors must wrap. Use an image viewer that preserves aspect ratio and draws only valid boxes.

Add an account-isolated local storage strategy before public multi-account use. Do not accidentally upload one account's cached product evidence into another organization. Decide and document partitioning, logout, offline cache, migration and export semantics. Preserve local backup capability even when cloud configuration is unavailable.

### Backend and authentication

Use the existing Supabase project and Vercel project unless the owner requests migration. Treat SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY as public configuration. Privileged database, SMTP or OCR credentials belong only in a server secret store. Never use user_metadata as an authorization source. Enforce authorization in database policies, RPCs and API handlers; client role labels are only presentation.

Configure public signup and recovery with Resend only when the owner has a verified sender domain and provider credentials. Use current official SMTP documentation, exact allowed redirect URLs and real authorized test inboxes. Retain email confirmation. Test confirmation, expired recovery, successful recovery, password change, logout and abuse controls. Do not mark public email working without observed delivery.

Harden server-side input validation for workspace or normalized data. Current client backup validation is not sufficient protection against a direct caller. Enforce schema, record limits, references, hashes, size and per-tenant quotas on the server. Add rate limiting and structured redacted errors. Do not expose raw OCR text, private images, access tokens or signed object URLs in logs.

### Persistence and database models

Preserve current stores scans, images, assessments, events, settings, drafts, operations and captureDrafts during migration. Preserve current cloud tables lp_orgs, lp_members, lp_snapshots, lp_audit and lp_review_events and private demo controls. Apply existing schema files in their documented order on a fresh environment; do not reapply them blindly to an active database.

Introduce normalized products, packaging_revisions, evidence_images, ocr_runs, declarations, declaration_evidence, assessments, findings, source_documents, rule_versions, rule_packs, jobs, job_attempts, review_decisions, audit_events, share_grants and deletion_requests only through reviewed migrations. Tenant-bearing records must carry or derive organization ownership. Add foreign keys, correct indexes and uniqueness for assessment version, object path and idempotency key.

Use immutable assessment records with input hash, original image hashes, detector version, OCR configuration, legal rule pack, exact finding provenance and server timestamps. Bind every review decision to the actual assessment hash and version. Membership changes and deletion require an audit record. Test backfill and rollback/forward repair against an isolated database before changing the live path.

### Upload and durable OCR jobs

Add authenticated private upload initiation and finalize endpoints. Verify actual stored bytes, MIME, decoding, size, pixel count, SHA-256 and object ownership server-side. Keep original evidence separate from previews. Finalization creates a deduplicated job after validation.

Use a durable queue or persisted lease system appropriate to the approved budget. A remote worker must read private originals, run real OCR, retain raw output and boxes, and commit one versioned result. Jobs expose Queued, Running, Retry scheduled, Needs rescan, Failed, Cancelled and Completed. Implement lease expiry, bounded exponential retry with jitter, dead-letter handling, idempotency and cancellation checkpoints. Do not depend on a browser tab or a timer after a serverless response. A retry must not create duplicate reports.

Measure confidence at declaration level using relevant OCR lines and coverage. Treat blur, glare, tiny text, crop and rotation checks as measured signals with explicit uncertainty. Support languages only after real fixtures pass. Browser OCR can remain a fallback, with its network and device limits visible.

### Legal rules and evidence engine

Retrieve official operative FSSAI and Legal Metrology documents and amendments. Never fabricate clauses, effective dates or a universal mandatory-field list. Store authority, URL, original document hash, retrieval date, enacted/draft status, effective interval, category scope, applicability predicates, exceptions and exact clause locators.

Rule authors create drafts; authorized legal reviewers approve test fixtures and publication. Unreviewed notes must not execute. A rule result includes applies, does not apply or unknown; an evaluated requirement includes satisfied, potentially unsatisfied, insufficient evidence or pending review. Unknown applicability stays unresolved. No licence-format detector may claim registry verification without an authorized successful lookup. Record Unavailable and Not verified separately.

Each assessment uses a published immutable rule pack. Amendments trigger a list of affected older reports for reassessment without rewriting their original results. Keep text extraction confidence separate from legal outcome. Physical font size, nutritional validity and symbol requirements need appropriate evidence and implementation rather than regex presence.

### Reports and reviewer governance

Generate searchable reports with report ID, product context, capture dates, image hashes, OCR provenance, detector and legal versions, exact clauses, exceptions, findings, review notes and evidence appendix. Preserve correct script rendering and explicitly document searchable-text limits. Controlled sharing must be authorized, expiring and revocable; direct private evidence links must not become public.

Implement assignment, comments, rescan requests, approval and rejection with server role checks and optimistic concurrency. Changed evidence requires a new assessment and a new decision. Preserve all earlier history. Local preliminary approval must remain clearly different from a legally reviewed production conclusion.

### Security privacy and operations

Test anonymous and cross-organization denial for products, images, OCR, reviews, jobs and exports. Guard direct API mutation, forged metadata and member self-promotion. Enable RLS for exposed tables and audit privileged functions. Keep security-definer helpers private with restricted grants and explicit caller checks. Verify object access and signed-link lifetime after role changes.

Define actual retention, account deletion, object cleanup, cache purging and backup expiry. A reminder alone is not retention enforcement. Use verified applicable privacy law and a clear notice, without invented legal assurance. Create isolated restore drills, approved RPO/RTO, dependency checks, preview checks, deployment rollback and external alert delivery to the named operator. Redact all sensitive telemetry.

### Required file structure

Keep src/views, src/rules.js, src/storage.js, src/ocr.js and src/cloud.js working while extracting modules. Add src/domain, src/services, src/features, src/components and src/adapters as needed; shared/schemas for request and data contracts; api/v1 for authenticated handlers; workers/ocr for durable processing; rules for reviewed pack fixtures; supabase/migrations for schema history; tests for unit, integration, browser, security, migration and evaluation; docs/specifications for the five specifications; public/documents for checked downloads. Use ignored work for scratch output.

### Testing and completion definition

Run the repository's full local suite, build, real OCR fixtures, storage upgrade recovery, all documentation downloads and deployment routes. Run demo read-only checks against the real service. For normal cloud tests, provision disposable confirmed accounts in the authorized test workflow and clean up their data afterward. Do not skip required tests without naming the reason.

Add tests for each new production requirement: public email in a real inbox, account-isolated local cache, server validation, direct tenant attacks, worker crashes and duplicate delivery, rule effective dates/exceptions, review hash binding, deletion, restore and external alerts. Maintain a requirement-to-test map. Report actual commands, results, fixture provenance and environment.

Collect rights-cleared real Indian labels and a held-out multilingual benchmark. Measure extraction and false absence separately, stratify by package and lighting, report counts and intervals, and require legal adjudication of potential absence. Do not turn a synthetic 12-field fixture into a production accuracy claim.

Finish with a clean source tree, updated README and the five specifications, environment example without secrets, database migrations, reproducible fixtures, run/deploy instructions, source ZIP and verified Vercel link. Push to the authorized repository after checks. Explain any unresolved service or legal prerequisite. Call the product production-ready only after every production gate has actual evidence.

## MVP implementation prompt

Build or repair the smallest working LabelProof application for packaged-food observations. Preserve the existing Vite frontend, browser OCR and IndexedDB persistence. Provide guided image capture, twelve candidate declarations, source-linked findings, the seven uncertainty states, guarded human correction, rescanning, immutable report versions, complete JSON/CSV/PDF export and validated backup/import. Make all primary buttons and mobile navigation work. Use labelled synthetic sample products.

Keep the existing read-only public demo and explicit private cloud sync if configured. If cloud configuration is unavailable, retain a fully usable local workspace and show setup pending. Do not fabricate public email, remote OCR, registry verification or legal validation. Do not weaken authentication to bypass external prerequisites.

Include the five specification documents, Project documents page and a full test command. Tests must use repository-local fixtures and scratch files. Verify uploads, uncertainty, correction prerequisites, evidence boxes, old versions, PDF, backups, OCR cancellation, stale sync, demo guards and mobile controls. Run the build and verify deployed routes.

MVP completion requires a working hosted observation workflow and downloadable source. Production legal conclusions, public signup delivery, background jobs, enforced deletion, verified backups and external alerts are explicitly outside MVP until independently implemented and accepted. Return the live link, exact tested scope and a prioritized remaining-work list.

## Output contract for the coding agent

Provide the hosting URL and source commit; list implemented behavior and test evidence; provide files for PRD, SRS, development architecture, UI UX and testing; include this full master and MVP prompt; identify blockers with exact missing prerequisites; and state whether the result is a working prototype or an accepted production service. Never use a readiness label that contradicts the test report.
