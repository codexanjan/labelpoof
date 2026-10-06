# LabelProof Product Requirements

Document LP PRD 1.0 | Prepared 6 October 2026 | Product baseline 3.2 | Delivery package 3.3

## Purpose and product decision

LabelProof helps people inspect Indian packaged-food labels through photographs, extracted declarations and evidence-linked reports. Its core product promise is to distinguish information that appears missing from information that cannot be read or was never photographed. This document defines the product scope, users, journeys, priorities and release conditions for the engineering and product teams.

The current application is a working observation and review prototype. Its browser workflow and private cloud sync are implemented. Public account email, expert-approved legal rules and remote processing are release gates. A product release must not describe text detection, synthetic demonstration accuracy or preliminary reviewer approval as legal certification.

## Problem and opportunity

A checklist based on OCR alone can incorrectly accuse a product of omitting a declaration when the relevant panel was not captured, the text is curved or the image is blurred. Reviewers also lose trust when a finding has no original photograph, no location in the image or no rule provenance. LabelProof should shorten evidence collection and review while keeping uncertainty visible.

Start with packaged-food declarations in India. Extend to cosmetics, medicines, electrical products and other categories only after separate legal scope, exceptions, specialist review and evaluation are available. Barcode recognition identifies candidates; it does not establish product authenticity or regulatory status.

## Users and responsibility

- Consumer or student: capture a product, understand an observation, follow rescanning instructions and export an educational report.
- Uploader in a manufacturer or retailer team: record product revisions, collect packaging surfaces, process images and submit a case for review.
- Reviewer: inspect text and original evidence, correct extraction, assess applicability, resolve conflicts and record a preliminary decision.
- Organization administrator: manage membership and roles, configure retention and monitor processing. Production deletion and retention enforcement still require implementation.
- Legal rule reviewer: approve source documents, exact clauses, effective dates and applicability before a rule pack is published. This is a proposed production responsibility.

The public demo uses synthetic data in a shared cloud workspace with server-enforced read-only access. It must never become a shared writable repository for real customer photographs.

## Product scope and release status

### Working scope

The public landing page and dedicated dashboard support guided surface capture, original image persistence, English or English and Hindi browser OCR, twelve declaration detectors, conflicts, manual correction, rescans, immutable assessment versions, evidence browsing, report comparison, review queues, analytics and activity records. Exports include JSON, CSV, a PDF evidence appendix and a complete local backup. Persistent capture drafts and browser batch records recover after reload. A barcode reader and heuristic quality hints assist capture.

Confirmed accounts can sign in to the active Supabase project. Organization membership controls private image reads and explicit workspace upload or download. Snapshot version checks prevent blind overwrite. Team decisions are bound to an assessment hash and cloud snapshot version. The demo account has one-click login, three synthetic products and cloud mutation restrictions.

### Production scope still to deliver

Public signup and recovery need a verified sender domain, Resend credentials, Supabase authentication configuration and real-inbox testing. The owner currently has no sender domain. A validated legal rule engine needs reviewed operative source documents, applicability and exceptions. Distributed jobs must process without requiring an open browser. Account-isolated local caches, enforced retention and deletion, backup restoration drills, external alerts and a diverse accuracy benchmark remain required.

## Evidence vocabulary

1. Observed: declaration text was extracted or manually confirmed from an existing image. This does not mean the complete legal requirement passed.
2. Not photographed: no relevant evidence surface is available. Ask for a specific additional photograph.
3. Unreadable: evidence exists but cannot be read reliably. Ask for a closer, sharper or differently lit view.
4. Needs review: captured evidence did not establish an answer. A person must inspect the available images.
5. Conflicting: retained images contain differing normalized readings. Display every candidate and its source.
6. Potential issue: an authorized reviewer recorded applicability, readable coverage and a rationale supporting a possible absence.
7. Not applicable: a reviewer documented a category or packaging exception with a rationale. Production findings require the operative clause.

Keep observation status separate from legal evaluation status and external licence verification. No automatic rule may convert OCR non-detection into a missing declaration.

## Primary user journeys

### Capture and review

Open New scan, enter product name and category, attach label photographs, choose each surface and inspect readability. Run Review label, then select each declaration beside its original image. If text is unclear, choose Add a photo and reassess. If extracted text is wrong, enter exact text, evidence and a reason. Save a new assessment version and export a preliminary report.

### Team review

Sign in, create or select an organization and explicitly upload a reviewed local workspace. Another member signs in, selects the same organization and downloads it. A reviewer records comments, assignment, rescan requests or a preliminary approval. If a snapshot changed, download and reconcile rather than overwriting. A decision on an older version must remain bound to that version.

### Demo and demonstration

Choose Sign in to demo on Account and privacy. Load organizations, select LabelProof Demo and download the synthetic workspace. Inspect oats with incomplete evidence, tea with illustrative observations and snack with a reviewed price-absence scenario. Allow local experiments while blocking writes to the shared demo cloud.

### Restore and recover

Export a workspace backup before clearing browser data or downloading a cloud snapshot that could update matching local records. Import validated backup records and photographs with remapped identifiers. When storage is blocked by an older tab, display a recovery action; when storage is unavailable, provide clear instructions without implying that saved evidence survived eviction.

## Prioritized requirements

- P0 Evidence integrity: original bytes, image hash, dimensions, surface, OCR provenance and coordinates persist together. Every observed value has a source image.
- P0 Safe uncertainty: missing evidence and unreadability remain distinct; absence requires deliberate human evidence review.
- P0 Case history: corrections and rescans append versions, retaining prior product and image snapshots.
- P0 Tenant isolation: reads and mutations check organization membership on the server. A forged client role must fail.
- P0 Usable recovery: uploads, OCR failure, cancellation, browser reload and stale sync have explicit outcomes and actionable retry controls.
- P1 Public authentication: verified confirmation and recovery email, approved redirect URLs, abuse protection and session lifecycle tests.
- P1 Reviewed legal packs: source hashes, effective dates, clause locators, exception fixtures and approved publishing.
- P1 Remote processing: resumable server jobs, bounded retries, progress, cancellation and idempotent report creation.
- P1 Reliable operations: restoration drills, performance budgets, external alerts, audit retention and incident ownership.
- P2 Convenience: revision comparison, bulk review, more languages, offline synchronization, authorized licence lookup and rule-change reassessment alerts.

## Success measures and targets

These are proposed acceptance targets, not measured production results. Safety targets are zero automatic absence findings from OCR failure and complete evidence linkage for every observed finding. All tenant-isolation and unauthorized-mutation tests must pass. Retain all prior assessments through rescan and restore checks.

Measure median capture-to-review time, rescans per case, reviewer correction rate and report export completion by device. For a curated benchmark, report declaration-level precision and recall, false absence rate, conflict detection and unreadability detection separately by language, package shape and lighting. Publish sample counts and uncertainty intervals. A single clean English fixture cannot support a general accuracy claim.

Initial performance targets are LCP at or below 2.5 seconds and INP at or below 200 milliseconds at the 75th percentile on the agreed mobile population. Set remote processing and availability targets only after representative load tests and hosting limits are established.

## Commercial and operational boundaries

Do not purchase a domain, upgrade plans or enable chargeable automatic usage without a specified spending limit. Keep public demonstration data synthetic and rights-cleared. Build privacy notices, retention choices and deletion handling around verified applicable law and organizational policy. An external service being unconfigured must display Setup pending or Unavailable rather than fabricated success.

## Release acceptance and build sequence

The prototype release is acceptable when capture, correction, history, export, backup, demo and private cloud workflows pass their documented checks. Production requires additional evidence: real-inbox account recovery, cross-tenant denial, independently approved legal packs, diverse-package evaluation, interrupted job recovery, enforced deletion, successful restoration and alerts reaching the named operator.

Build in this order: reproducible local workflow and documentation; public authentication and local account isolation; normalized cloud persistence and durable jobs; reviewed legal packs and reviewer governance; benchmark, privacy and operational drills; optional convenience features. Each phase needs a working release with a rollback path.

## References and ownership

The SRS assigns requirement identifiers and acceptance rules. The architecture document specifies current and proposed components. UI UX defines interaction states. Testing maps requirements to executable checks. The product owner accepts scope; an appointed legal reviewer accepts rule applicability. No such legal approval is implied by this specification.

Official source entry points: FSSAI https://fssai.gov.in/food-law/regulations/amendments/labelling-display and Department of Consumer Affairs https://consumeraffairs.gov.in/pages/legal-metrology-act. They are discovery references, not a reviewed rule pack.
