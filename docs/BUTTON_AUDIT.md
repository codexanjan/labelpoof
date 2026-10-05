# Interaction and recovery audit - v2.1

Tests use isolated Chrome desktop and 390px mobile workspaces, before deployment and against the deployed app.

| Controls | Verified outcome |
| --- | --- |
| Landing and dashboard navigation | All routes load content and images without runtime errors |
| Upload, camera file input, surface/readability, removal | Image/signature/size guards, input behavior and capture metadata |
| Review / reassess | Real OCR extracts 12/12 declarations from an English synthetic raster label; images/hashes survive reload |
| Processing cancel / failures | Photos retained, pre-cancelled jobs stop and invalid recognition rejects safely |
| Findings, filters, zoom, evidence comparison | Selected values, highlights and images update |
| Review/correct/save/cancel | Required evidence/rationale guards, immutable history and read-only past versions |
| Queue/report rescan | Selected declaration guides surface; conflicting values remain available |
| PDF/CSV/JSON/backup | Downloads produced; PDF signature and evidence payload verified; CSV guards formulas; backup embeds images |
| Import | Images/history/conflict buttons restore; invalid backup rejected and chooser reset |
| Gallery and OCR disclosure | Filtering, modal and related report navigation |
| Rule notes | Empty validation, save, reload persistence, delete and cancel |
| Preferences, search, sample loader | Settings persist, search works and samples restore after clearing |
| Notifications and activity | Recent activity modal and complete timeline navigation |
| Delete/clear confirmations | Cancel preserves data, confirmation removes it, samples reload |
| Mobile menu | Open, close button, backdrop, Escape and destination navigation |
| Invalid report version | Latest-report and product-library recovery links |

Run `npm test`, `npm run test:browser`, `npm run test:buttons`, `npm run test:ocr`, `npm run test:ocr-errors`, `npm run build`, `npm run test:deployment`.

Limits: physical camera hardware and operating-system permission prompts are not exercised headlessly. External OCR models require network on first use. The OCR fixture benchmark is English; Hindi settings are available but are not benchmarked here. PDF text pages are rasterized, not selectable. Browser storage is implemented; cloud accounts, shared roles, PostgreSQL and official licence verification remain proposed systems. Official links are references, not legal validation. Testing does not certify compliance or guarantee every device.
