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

The approved LabelProof project is active in codexanjan's Org (Mumbai). Its quoted base cost was 0 per month. Database migrations, private image bucket, RLS policies and role-checked RPCs are deployed. The live server receives only the URL and publishable key; no privileged key is in browser source.

Confirmed-account login, team membership, private evidence restoration, repeat-download deduplication, version conflicts, review permissions and cross-organization isolation have been exercised against the deployed database. Public signup and recovery still need custom SMTP and verified redirect configuration; the Supabase dashboard session is not signed in.

## Still required before production certification

- Configure and test public email delivery, confirmation/recovery redirects and real inbox recovery; test a disaster-recovery procedure.
- Independent legal review and published versioned rules with exact operative clauses. Registry verification remains unconnected.
- Server-side OCR worker and distributed processing/rate limits, independently of an open browser.
- Real-world multilingual accuracy and accessibility/device evaluation.
- Automatic cloud retention/deletion, account deletion and externally delivered incident alerts.
- Install GitHub Actions workflow and repository deployment integration with the required account permissions.

This release adds operational features; it does not claim all production gates are met.

## Verification

22 unit checks passed. Original button and browser suites passed. Upgrade suite verified new routes, comparison, version-specific preliminary decisions, capture reload recovery and real batch OCR. Live Vercel routes and original OCR/backup workflow are checked after deployment. Twelve cloud verification groups now pass; see CLOUD_ACTIVATION.md for scope and remaining email limitations.

## v3.0.1 storage recovery

Fixed IndexedDB upgrades blocked by older tabs. An upgrade waits instead of reporting storage as unavailable. A recovery control refreshes older dashboard tabs while leaving capture pages alone; original data is preserved. Connections close on version change and page exit. The storage retry uses an event handler compatible with the content security policy. Browser regression checks cover a held version-1 connection, retained settings, automatic version-change release and retry when storage is genuinely denied.
