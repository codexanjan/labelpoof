# Technical requirements and implementation

Historical v2 document. Use the current [development architecture](specifications/03-Development-Architecture.md) and [SRS](specifications/02-SRS.md) for active cloud services, database models, current interfaces and production targets.

## Current architecture

Vite builds a browser application from JavaScript ES modules. Routing uses the History API, backed by Vercel rewrites for `/dashboard/*`. Page templates are split into landing, workspace, capture and report modules. Selected Lucide icons and lazy OCR reduce the main bundle compared with the original prototype.

Tesseract.js runs in a browser worker. Images are not submitted to a remote OCR service. Worker/language assets download on first use. IndexedDB stores image blobs, extraction records, assessment snapshots, events, preferences and draft notes.

Two Vercel functions expose read-only health and source manifests. They do not store scans or validate legal compliance.

## Image pipeline

1. Check MIME allowlist, 12 MB per image and 12 images per scan.
2. Decode image and limit it to 40 million pixels.
3. Check basic format signature.
4. Compute SHA-256 over original bytes.
5. Run selected-language OCR with text and line-box output.
6. Retain raw text, line coordinates, engine, dimensions and heuristic confidence.
7. Extract candidate declaration text across all images.
8. Retain differing normalized text readings as conflicts.
9. Classify non-detection as uncaptured, unreadable or requiring review.
10. Commit scan, images, assessment and event atomically.

## Versioning

Assessment records contain a unique ID, scan ID, version, reason, reviewer, pipeline/rule-pack IDs, product snapshot, image snapshot references and findings. Corrections create another assessment. Capture changes to persisted image metadata create a new image ID, allowing old versions to retain their original metadata. Local audit logs are not cryptographically authenticated.

## Human review invariants

Observed corrections need exact text and an existing image. Absence review needs applicability=`applies`, readable coverage attestation, available images and a rationale. Non-applicability needs an explicit exception rationale. Highlight coordinates are bounded to the source image. A changed value does not inherit an unrelated old highlight.

## Backup/import

Schema version 2 embeds uploaded images as base64 data URLs; bundled synthetic images use a fixture allowlist. Validation checks record limits, IDs, dimensions, evidence references, finding keys/states, region bounds and absence prerequisites. Import decodes uploaded images, checks dimensions, recomputes image hashes and remaps record identifiers. Historical imported events are labelled. Preferences and drafts are restored, with drafts remaining non-executable.

## Operational boundaries

No deployed shared database, cloud account, background queue, permission model or registry connector. Browser storage may be evicted or cleared. OCR is dependent on the user's device and initial asset download. Regex-based candidate extraction is not a robust legal or document-layout parser. Whole-image confidence and suggested surfaces are heuristics.

## Production expansion

Use authenticated frontend sessions, a private object store, PostgreSQL, an authorization-enforcing API and a worker queue. Adopt reviewed legal RuleVersion/RulePack records with official document hashes, clause locators, applicability and effective dates. Do not automatically publish retrieved rules or treat document text as instructions.

See the proposed database schema and API roadmap. These designs must be implemented, migrated and validated before being described as live services.
