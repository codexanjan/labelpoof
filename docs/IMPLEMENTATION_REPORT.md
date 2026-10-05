# Implementation report — 5 October 2026

## Delivered

Separate public landing and nine-page dashboard; guided upload/camera capture; seven packaging surface labels; real browser OCR; 12 declaration detectors; image-linked findings; explicit unresolved states; cross-image conflict retention; reviewer corrections; guarded absence review; optional bounded image highlights; persistent original images; versioned assessments; historical reports; review queue; evidence gallery; analytics; official source library; non-executable drafts; preferences; audit timeline; JSON/CSV/downloadable-PDF export; image-inclusive backup/import; deletion; serverless metadata APIs; reproducible synthetic images; screenshots and project documentation.

## Improvement over v1

The original application stored only report summaries. v2 retains image blobs and extraction records in IndexedDB, so evidence survives reload. It separates the landing page from the dashboard, adds structured navigation, avoids an arbitrary legal score and preserves earlier report versions rather than overwriting corrections. Selected icons and on-demand OCR reduce the initial JavaScript bundle.

## Validation

- Observation/export unit checks: non-detection safety, unreadability, net quantity versus serving size, source links, conflicts, review guards, bounding boxes, backup safety and CSV escaping.
- Metadata API handler checks: explicit integration states, source inventory and method restrictions.
- Browser workflow: nine pages, synthetic images, evidence highlights, absence guard, corrections, earlier versions, reload persistence, exports, PDF generation, guided recapture, backup/import, search, persistent draft notes, settings and mobile navigation.
- Real OCR workflow: 12/12 declarations on one clean English generated fixture, image/hash persistence, second-image price conflict, historical assessment preservation, image backup/import and deletion.
- Mobile overflow regression checked at 390 × 844.
- Production bundle built successfully.
- Published routes, synthetic image assets and `/api/health` / `/api/sources` verified on the production Vercel domain.

The generated fixture is a functional test, not an accuracy benchmark. Hindi settings are implemented but the real OCR smoke test is English. Broader legal, security and accessibility certification has not been performed.

## Known limits

No cloud authentication or shared database; no government registry integration; no validated legal rule publication; no calibrated field-level quality model; no logo/symbol detection; no laboratory/product-content validation. Suggested surface positions and OCR confidence are heuristics. Local audit history is editable by the device owner. Client-side PDF export includes findings and original evidence images; text pages are rasterized for browser script shaping.

## Repository deliverables

Application source, lockfile, Vercel config, read-only APIs, tests, CI workflow template, asset generator, product/label assets, screenshots, sample PDF, PRD/PSD/TRD, current database models, proposed PostgreSQL schema, API roadmap, regulatory source policy, dataset card and demonstration script.

The publishing GitHub login lacks `workflow` permission. GitHub Actions configuration is preserved as `docs/ci-workflow.yml` for installation with an authorized login; no remote Actions run is claimed. Validation was performed locally.

Vercel deployment was performed directly. Automatic GitHub linking was attempted but rejected because the Vercel GitHub integration lacks repository access. The source push itself succeeded. Future pushes require either another direct deployment or configuring repository access in Vercel.

## v2.1 interaction repair

Downloadable PDF, queue-specific rescan guidance, preserved imported comparison evidence, mobile dismissal, OCR cancellation/timeout/error recovery, repeat-save guards, retryable file input and history recovery. See [button audit](BUTTON_AUDIT.md). Unit checks, browser workflow, focused button audit, real OCR and OCR failure checks passed before deployment.
