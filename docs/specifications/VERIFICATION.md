# LabelProof release verification

Prepared 6 October 2026. Documentation package and application release 3.3 continue the tested 3.2 prototype. The source commit is recorded by Git history. This record distinguishes checks actually run from proposed production work.

## Executed checks before this update

The unchanged 3.2 baseline passed 22 unit/API checks, production build, all 18 live routes with evidence loading and metadata APIs, button interaction checks and the upgraded workflow/batch suite on 6 October 2026. The storage suite initially targeted an inactive preview port; the failure was a test configuration issue, not a demonstrated data-loss defect. Its default origin is now consistent with Vite, and the new full runner supplies an isolated server URL.

## Portable release verification

Repository-local synthetic PNGs now replace external fixture dependencies in button and batch checks. OCR-generated files and backup downloads use ignored work/ inside the project. npm run test:full starts its own local server and checks units, buttons, batches, storage recovery, OCR errors, real OCR and documentation downloads. The deployment and real public-demo checks run separately against the Vercel alias. Executed results are recorded below.

## Release 3.3 local results

Executed `npm run test:full`: PASS, including 22 unit/API checks and all seven browser suites (startup, buttons, upgrades, storage-upgrade, OCR errors, real OCR and documentation). The clean synthetic English OCR fixture produced 12 of 12 detected fields; this is fixture-specific evidence only. Repeated-price rescan retained conflicts, earlier assessments stayed available and uploaded image backup/restoration passed. Executed `npm run build`: PASS. The main JavaScript bundle was 144.99 kB, 43.83 kB gzip, before the final hosted build; this is not a field performance measurement.

All 21 pages across the five generated PDFs were rendered and visually checked. Text boundaries were checked as well. The source documents total over 8,000 words. Each of the thirteen document-page download links returned an appropriate nonempty PDF, Markdown, prompt or ZIP response, and the ZIP download and 390-pixel navigation check passed.

## Hosted publication checks

The first 3.3 publication passed all 19 route/image/API checks, all document downloads and real demo login/read-only/mobile checks on 6 October 2026. The final startup improvement also passed the held-configuration test and demo browser checks locally. Local evidence now renders before cloud configuration or authentication recovery completes, with unavailable cloud actions disabled until the client is connected. Final hosted checks are repeated after publication.

## Existing cloud evidence

On 5 October 2026, normal-account cloud regression passed 12 groups covering membership, outsider isolation, role escalation denial, review hash/version binding, stale sync, private image byte restoration and browser upload/download recovery. Disposable accounts and their test data were removed. That result is historical; it is not a new normal-account test run on 6 October. Real public-demo tests verify current login and server denial of mutations without giving the demo access to customer data.

## Production gates

Public signup and recovery remain blocked by the absence of a verified sender domain and configured SMTP/redirect settings. The user reported no domain. Resend is selected but not activated. No email-confirmation bypass was performed. Legal packs still require operative source collection and expert approval. Remote OCR and durable server jobs, account-isolated local caches, enforced deletion, automated restoration drills, external alerts and diverse packaging evaluation remain pending.

The app is a working observation and cloud-sync prototype, not an accepted production compliance certification service. Synthetic-label results must not be presented as general accuracy. Reviewed absence remains a potential issue, and licence format detection remains unverified.
