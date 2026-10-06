# Product requirements — LabelProof v2

Historical v2 document. The current [complete PRD](specifications/01-PRD.md) supersedes this baseline. Private cloud accounts and sync are now active; public email and production rule validation remain pending.

## Problem

OCR checklists often confuse “not read” with “not present”. A packaging photograph may be blurry, incomplete, curved or obstructed. A useful review must make that uncertainty visible and connect observations to evidence.

## Users

Consumers, small manufacturers, retailers and reviewers inspecting packaged-food declarations. The prototype provides a local personal workspace; organization permissions are future work.

## Primary journey

Open dashboard → create a product → add surface photographs → run OCR → inspect declaration evidence → correct/review or rescan → reopen the assessment history → export report or workspace backup.

## Implemented requirements

- Separate public landing and full dashboard.
- Guided upload and mobile camera input.
- Original image persistence and SHA-256 provenance.
- English OCR, optional English/Hindi configuration.
- Twelve declaration detectors with explicit uncertainty.
- Cross-image conflicting-value retention.
- Human corrections, evidence linkage and optional image-region coordinates.
- Guarded absence review requiring applicability, coverage confirmation, images and rationale.
- Versioned findings and product/image snapshots.
- Review queue, evidence library, reports, analytics, official source library, local drafts, preferences and activity.
- JSON/CSV/PDF export and workspace backup/import.
- Three labelled synthetic scenarios and reproducible image assets.

## Success criteria

Every observed finding has an available source-image link. OCR non-detection never automatically produces absence. Rescans and corrections preserve earlier assessments. Photographs remain available after reload. Users can export and restore an uploaded product with its image evidence.

## Boundaries

Observation is not compliance. Category applicability, effective legal provisions, exception handling, labelling measurements and licence validity are not automatically verified. The prototype cannot inspect actual product contents, laboratory quality, counterfeit authenticity or cross-device accounts.

## Future production requirements

Authenticated organizations, private storage, a shared database, asynchronous workers, versioned reviewed legal rule packs, audited publishing, retention controls and a rights-cleared real packaging benchmark.
