# Database models

## Deployed prototype: IndexedDB

Database name: `labelproof-workspace-v2`, schema version 1. Object stores use `id` as key. `scans`, `images`, `assessments` and `events` are committed together during assessment creation. `settings` holds preferences; `drafts` holds non-executable review notes.

```mermaid
erDiagram
    SCAN ||--o{ IMAGE : captures
    SCAN ||--o{ ASSESSMENT : versions
    SCAN ||--o{ EVENT : logs
    ASSESSMENT }o--o{ IMAGE : snapshots
    ASSESSMENT ||--o{ FINDING : contains
    FINDING }o--o{ IMAGE : references
```

`FINDING` is embedded in the current assessment object, not a separate IndexedDB store. Image references and region coordinates link it to original evidence. Original bytes are blobs. Assessment snapshots retain the product metadata and relevant image metadata used for that version.

Older report IDs cannot be overwritten through the application. Corrected findings are new assessment records. This is application-level versioning; browser data remains user-controlled.

## Proposed production model — not deployed

`database/production-schema.sql` describes PostgreSQL tables for organizations/users/memberships, products/scans/images, OCR runs/regions, observations/evidence, coverage, rule sources/versions/packs, assessments/findings, rescans/corrections, registry attempts, jobs/exports and audits.

```mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBERSHIP : authorizes
    USER ||--o{ MEMBERSHIP : joins
    ORGANIZATION ||--o{ PRODUCT : owns
    PRODUCT ||--o{ SCAN : reviews
    SCAN ||--o{ SCAN_IMAGE : captures
    SCAN_IMAGE ||--o{ OCR_RUN : processes
    OCR_RUN ||--o{ OCR_REGION : extracts
    SCAN ||--o{ FIELD_OBSERVATION : observes
    FIELD_OBSERVATION ||--o{ OBSERVATION_EVIDENCE : supports
    SCAN ||--o{ ASSESSMENT : versions
    RULE_SOURCE ||--o{ RULE_VERSION : documents
    RULE ||--o{ RULE_VERSION : versions
    RULE_PACK ||--o{ RULE_PACK_ENTRY : includes
    RULE_VERSION ||--o{ RULE_PACK_ENTRY : belongs
    ASSESSMENT ||--o{ FINDING : reports
    RULE_VERSION ||--o{ FINDING : evaluates
    FINDING ||--o{ FINDING_EVIDENCE : links
    SCAN ||--o{ CORRECTION : records
    SCAN ||--o{ RESCAN_REQUEST : requests
    ASSESSMENT ||--o{ REPORT_EXPORT : exports
```

The SQL is a reviewable design artifact and was not executed against a provisioned database. Authentication, tenant enforcement, authorized rule publication, object-store access, immutable-record guards, migrations and deletion/retention policies must be completed before production use. Do not connect this unreviewed schema directly to public requests.
