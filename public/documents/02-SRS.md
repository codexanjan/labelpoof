# LabelProof Software Requirements

Document LP SRS 1.0 | Prepared 6 October 2026 | Product baseline 3.2 | Delivery package 3.3

## Purpose and conventions

This specification defines testable behavior for LabelProof, its evidence model, interfaces and operating constraints. It covers the working packaged-food observation prototype and the proposed production extension. Requirements marked Current describe supported behavior; Target identifies work that must be implemented and verified before production release.

The application shall preserve the difference between an absent photograph, unreadable evidence and a reviewer-supported potential absence. Shall statements define acceptance behavior. Proposed service budgets are engineering targets and are not claims about the deployed system.

## Operating environment

Current client software uses JavaScript ES modules, Vite, browser IndexedDB and Tesseract.js workers. Chrome is the exercised desktop browser; broader browser support requires the compatibility matrix in Testing. The site is deployed to Vercel, with dashboard route rewrites and metadata functions. The active Supabase project supplies password authentication, PostgreSQL and private image storage. OCR runs on the user's device; its initial worker and language downloads require network access.

Local use does not require login. Cloud actions require a confirmed authenticated account and organization membership. Public email delivery remains unconfigured. Local data remains on the device after cloud sign-out; account-specific local caches are a Target requirement.

## Functional requirements

### Capture and product records

- FR 001 Current: users shall create a product with name, brand, category and origin context; record UUIDs, timestamps, a demo indicator and latest assessment reference.
- FR 002 Current: users shall upload JPEG, PNG or WebP photographs through file selection, drag and drop or supported mobile camera input. Validate format signatures, decoding, dimensions, maximum 12 images per scan and maximum 12 MiB per image. Reject images above 40 million pixels.
- FR 003 Current: each photograph shall retain its original blob or allowlisted synthetic fixture, SHA-256, dimensions, surface and OCR provenance. Surfaces are Front, Back, Left, Right, Top, Bottom and Wraparound.
- FR 004 Current: drafts shall survive ordinary in-app navigation and reload. An explicit capture cancellation shall discard its draft. Interrupted processing shall retain sufficient images for retry.
- FR 005 Current: barcode and quality hints shall be presented as assistance, without claims of authenticity or validated optical quality.

### OCR and observation

- FR 006 Current: processing shall produce raw text, OCR line boxes, engine, language and confidence when available. Support English and configured English with Hindi. Bound worker operations to 90 seconds and expose cancellation or retry.
- FR 007 Current: detectors shall inspect twelve candidate declarations: quantity, price, manufacturer, FSSAI text, batch, date, ingredients, consumer care, nutrition, allergens, origin and storage.
- FR 008 Current: OCR non-detection shall produce Not photographed, Unreadable or Needs review according to available evidence. It shall never automatically create Potential issue.
- FR 009 Current: differing normalized values across images shall remain linked to their images and be presented as Conflicting. A serving-size value shall not be substituted for net quantity.
- FR 010 Target: declaration-level quality shall aggregate relevant line confidence, coverage, crop and layout signals. Confidence shall not be represented as a probability of legal compliance.
- FR 011 Target: durable server jobs shall work after a browser closes, deduplicate retries and append at most one result for an accepted idempotency key.

### Review and reports

- FR 012 Current: an observed correction shall require exact text and an existing evidence image. Optional boxes shall be finite, positive and bounded by the source dimensions.
- FR 013 Current: a Potential issue review shall require applicability set to applies, readable-coverage attestation, available images and a nonempty rationale. Not applicable shall require a reason. Changed text shall not inherit an unrelated highlight.
- FR 014 Current: correction and rescan shall append immutable assessment versions with product snapshot, image snapshots, findings, reviewer, reason, pipeline and detector-pack identifiers. Earlier versions shall be reopenable and read-only.
- FR 015 Current: report exports shall include findings, uncertainty, provenance, review notes and source references. CSV shall neutralize formula-leading values. Backups shall embed uploaded images and validate evidence references before import.
- FR 016 Target: final reports shall include an approved legal pack, exact clauses, effective dates, report identifier and a reviewer decision bound to the evaluated evidence. Unsupported scripts shall retain correctly shaped visual text even when searchable text cannot be guaranteed.

### Organization and account access

- FR 017 Current: confirmed accounts shall sign in and out. The demo shall expose documented public credentials and one-click sign-in, without email delivery.
- FR 018 Current: organization creation and membership changes shall be server-authorized. Only an admin shall update membership; client metadata shall not grant privileges.
- FR 019 Current: upload and download shall require organization membership. Snapshot saves shall supply the expected version; a mismatch shall reject overwrite and require reconciliation.
- FR 020 Current: reviewer or admin roles shall be required for approval, rejection and assignment. Team review events shall bind assessment ID, snapshot version and assessment hash; notes shall contain 1 to 5000 characters.
- FR 021 Current: shared demo accounts shall read only their available demo workspace and shall be denied application write RPCs, storage mutations, credential changes, identity changes and MFA enrollment. Demo UI sign-out shall affect only its current session.
- FR 022 Target: public signup, confirmation and recovery shall use verified SMTP, exact allowed redirects, anti-abuse controls and real-inbox verification. Email confirmation shall not be bypassed to simulate readiness.
- FR 023 Target: account switching shall use isolated local partitions or an explicit export and purge process. Sign-out and revoked membership shall prevent further protected cloud access.

### Legal rules and operations

- FR 024 Current: official source links and reviewer drafts shall remain distinct from executable legal rules. Licence-format recognition shall show Not verified unless a real authorized registry lookup succeeded.
- FR 025 Target: legal conclusions shall evaluate approved rule versions by category, market, package context, operative date, applicability and exceptions. Store exact source document hash and clause locator. Unknown applicability shall remain unresolved.
- FR 026 Target: an approved rule change shall identify older affected assessments and offer reassessment while retaining original conclusions and pack identifiers.
- FR 027 Target: retention and deletion shall remove eligible database records, objects, derivatives and cached shares, with auditable results and documented backup expiry. A current retention reminder is not deletion enforcement.
- FR 028 Target: failures shall emit redacted operational events to configured monitoring, with deduplicated alerts and an incident owner. Local error history and a health endpoint alone shall not count as alert delivery.
- FR 029 Current: the documentation page shall expose the five specifications, editable source copies, master prompt and downloadable package with working links on mobile and desktop.

## Data requirements and invariants

Image identifiers referenced by findings shall exist in that assessment's image snapshot. Highlight coordinates use original image pixels. Store SHA-256 over original bytes rather than a resized preview. A legal evaluation shall reference a rule version independently of the OCR detector version. Server mutation authorization must use membership records, not user-editable profile metadata.

Current IndexedDB stores are scans, images, assessments, events, settings, drafts, operations and captureDrafts. Current cloud tables are lp_orgs, lp_members, lp_snapshots, lp_audit and lp_review_events; lp_private.demo_accounts is inaccessible to clients. A cloud snapshot is current state, not automatic historical backup. Normalized production records are specified in Architecture.

Import shall reject remote image URLs, unknown fixtures, duplicate or inconsistent identifiers, unsupported schema values, out-of-range boxes and unreviewed absence findings. Recompute hashes on restored uploads. Cloud downloads shall preserve stable per-account, per-organization mappings so repeat downloads do not duplicate products.

## Interface contracts

GET /api/health returns release and integration status. GET /api/config returns only public cloud configuration. GET /api/sources returns the source and declaration manifest with legal validation pending. POST /api/telemetry provides the existing limited telemetry behavior; external monitoring remains pending. Inspect api/ files before relying on exact response fields.

Current cloud clients call lp_create_org(org_name), lp_set_member(organization, member, member_role), lp_save_snapshot(organization, expected_version, payload) and lp_review(organization, assessment, review_action, review_note). Supabase Auth and Storage supply their own interfaces. Future /api/v1 upload, job, case and rule routes are proposed contracts, not deployed endpoints.

## Nonfunctional requirements

- NFR 001 Security: all tenant data and private object reads shall enforce membership; direct anonymous requests and cross-organization identifiers shall fail. Privileged secrets shall never be shipped in a client bundle, source archive or log.
- NFR 002 Reliability: atomic scan writes and versioned cloud saves shall survive retries without partial assessments or silent loss. Durable job lease expiry and duplicate delivery must be tested before Target processing launches.
- NFR 003 Performance Target: measure LCP, INP and CLS on agreed mobile conditions; aim for 2.5 seconds, 200 milliseconds and 0.1 respectively at the 75th percentile. Report raw measurements and fixture size.
- NFR 004 Accessibility Target: achieve WCAG 2.2 AA for primary journeys through keyboard and assistive technology checks. Use text state labels, visible focus, labelled inputs and accessible processing messages.
- NFR 005 Privacy: collect only necessary product evidence and account information; redact telemetry. Target deletion and retention require verified policy and applicable law.
- NFR 006 Maintainability: pin dependencies, commit lockfiles, map requirements to tests, version schemas and preserve migrations. Do not rewrite the working frontend merely to change framework branding.
- NFR 007 Backup Target: approve and demonstrate an initial RPO of 24 hours and RTO of 4 hours in an isolated restoration drill. These budgets are proposed and currently unverified.

## Failure behavior and acceptance

Invalid image: reject before OCR and retain other valid draft images. OCR timeout: show a retry action and preserve evidence. Unavailable browser storage: show a truthful recovery screen; do not claim unsaved data exists. Stale cloud version: block overwrite. Missing legal pack: allow preliminary observation reports only. Unconfigured SMTP: explain setup pending while confirmed and demo logins remain available.

Every Current FR needs the checks listed in Testing. Target FRs require implementation evidence before their status changes. The release owner shall retain build version, commit, environment, test results, unresolved defects and deployment link. Production acceptance is a separate decision requiring legal, security and operational sign-off.
