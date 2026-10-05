# Regulatory references and publication policy

The prototype links to official resources:

| Authority | Official entry point | Current use |
| --- | --- | --- |
| Department of Consumer Affairs | https://consumeraffairs.gov.in/pages/legal-metrology-act | Source reference for packaged commodity declarations |
| FSSAI | https://fssai.gov.in/food-law/regulations/amendments/labelling-display | Food label regulation/amendment reference |
| BIS | https://www.bis.gov.in/bis-apps/?lang=en | Verification-resource reference only |

Source entry points were checked during development on 5 October 2026. The Consumer Affairs page fetch timed out during one check; its content is not treated as a retrieved or reviewed legal rule pack. The application does not claim a complete current-law ingestion.

The identifier `declaration-observations-2.0` versions extraction heuristics, not an authoritative legal rule set. No operative clause numbers, effective dates or universal mandatory-field claims are invented.

## Before activating production legal checks

Retrieve the operative official document and amendments. Distinguish enacted rules from consultation drafts. Store document hash, retrieval date, authority, publication/effective dates, exact clause locator, category scope, applicability predicate, exceptions and reviewer approval. Add regression fixtures. Publish a versioned rule pack through an authorized review process.

## Verification boundaries

FSSAI number recognition is not licence verification. BIS applicability is category-specific, not universal. No government registry API is assumed to exist or connected. The prototype records licence verification as not attempted.

Draft source notes in the dashboard are local review records. They never become executable rules or modify findings.
