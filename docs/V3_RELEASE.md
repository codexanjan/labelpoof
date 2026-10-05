# LabelProof v3 release

## Implemented and tested

- 15 dashboard destinations: existing nine plus Account & privacy, Team & cloud, Processing & batches, Review workflow, Compare reports and Release readiness.
- Saved capture drafts and original photos survive page reload. Successful assessment or explicit cancel clears the capture draft.
- Barcode reader for uploaded photos, plus manual barcode entry.
- Capture quality hints for bright/dark areas and low detail. These are heuristics, not validated blur/glare measurements.
- Durable browser batch queue: queued, running, interrupted, failed and completed states; retry/resume, removal and stop-after-current controls. Jobs need an open browser, not a remote OCR worker.
- Cross-tab assessment/job locks and stale-assessment detection.
- Version-specific reviewer assignments, comments, rescan requests and preliminary decisions. Local decisions are explicitly untrusted preliminary records.
- Report comparison for 12 declarations.
- Candidate declaration format checks, separate from legal compliance. Source/clauses/effective-date review drafts do not execute as laws.
- PDF English text search layer, original evidence images and metadata. Other scripts retain raster shaping.
- Retention reminder, operations/history export and accuracy-evaluation CSV template.
- Private cloud adapter for signup/login/recovery, organization roles, evidence storage, snapshot compare-and-swap and role-checked review RPCs. Schema and access-control source included.
- Content security policy, anti-framing, diagnostic endpoint that excludes raw images/PII, and local error history.
- Offline app shell caching excludes API/auth responses. OCR needs initial model download; no guarantee of complete offline OCR on every device.

## Cloud deployment status

Project creation in codexanjan's Org was authorized. Supabase quoted a base project cost of 0 per month. Its connector requires a separate cost confirmation; this remains pending. No new project or database was provisioned and no unrelated existing project was modified. `/api/config` exposes only publishable configuration when configured; no privileged key is in browser source.

The cloud adapter and `supabase/schema.sql` are implemented but have not been exercised against a new deployed LabelProof database. Account/team controls correctly explain setup status; they do not fabricate successful authentication.

## Still required before production certification

- Provision and test cloud service, email redirects/delivery and account recovery; security-test role/organization isolation and backup restoration.
- Independent legal review and published versioned rules with exact operative clauses. Registry verification remains unconnected.
- Server-side OCR worker and distributed processing/rate limits, independently of an open browser.
- Real-world multilingual accuracy and accessibility/device evaluation.
- Automatic cloud retention/deletion, account deletion and externally delivered incident alerts.
- Install GitHub Actions workflow and repository deployment integration with the required account permissions.

This release adds operational features; it does not claim all production gates are met.
