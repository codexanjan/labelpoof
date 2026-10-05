# Product and system design

## Information architecture

`/` is the public project page. `/dashboard` is the dedicated workspace. The persistent navigation exposes Overview, My scans, Review queue, Evidence library, Reports, Analytics, Rule library, Activity log and Settings. Guided capture and evidence reports have distinct URLs.

## Visual system

Warm neutral backgrounds, dark forest text, teal actions, muted green observations, amber uncertainty, blue-gray uncaptured states and warm red potential issues. Every state is named in text; colour is supplementary. Product images are explicitly synthetic.

## Main interactions

- Overview: data-derived summary cards, product table, review priorities and event timeline.
- Capture: metadata, surface selector, drag/drop, camera input, thumbnails, readability selectors and coverage guidance.
- Report: finding list beside image evidence, region highlight, image switching, zoom, provenance, source links and version selector.
- Review dialog: exact value, observation status, applicability, source image, rationale, coverage attestation and optional coordinates.
- Evidence library: surface filter, saved thumbnails and image/OCR inspection.
- Reports: complete version inventory with dated reasons.
- Rules: official entry points and draft review notes that cannot change legal outcomes.
- Settings: local preferences, complete backup/import and deletion controls.

## Accessibility

Semantic landmarks, accessible names for icon controls, native select/input controls, skip navigation and native modal dialogs. Native dialogs trap focus and support escape for review dialogs. Processing cannot be dismissed while it is writing an assessment. Mobile sidebar is opened with a labelled menu button. Broader WCAG conformance has not been certified.

## Print design

Workspace chrome is hidden. A complete finding register includes values, review notes and source names, in addition to the selected evidence region and assessment metadata.

## States

No products, no matching search, no image, initial OCR download, processing progress, recoverable OCR failure, missing storage capability, guarded review validation, older read-only version, successful export/import and confirmed deletion.
