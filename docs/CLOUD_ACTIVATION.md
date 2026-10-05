# LabelProof cloud activation — 3.1.0

Approved 5 October 2026. Dedicated project: `labelproof`, region `ap-south-1` (Mumbai), in codexanjan's Org. Quoted base project cost: 0/month. Existing unrelated cloud projects were not changed.

## Deployed and verified

- Supabase PostgreSQL tables for organizations, memberships, workspace snapshots, audit events and review events; RLS on every exposed application table.
- Private JPEG/PNG/WebP evidence bucket with a 12 MiB server limit. Organization membership is checked on reads/uploads; administrators can remove objects. Images are uploaded without overwrite.
- Confirmed-account password login, password-update control and logout. Client receives a publishable key; no service-role key is included in browser code or source deliverables.
- Organization creator becomes admin. Only admins manage roles; uploader/reviewer/admin permissions are checked in server functions, independently of editable user metadata.
- Team snapshots use a database lock and expected version. Stale devices must download before uploading. Per-account/org mappings survive reload and prevent duplicate cloud imports; local backup imports still create new IDs.
- Cloud evidence downloads are checked against their source SHA-256. Downloads validate backup references and dimensions before a single local transaction writes records. Unrelated local products remain; matching cloud records update. Export unsynced local edits before pulling.
- Team review events require an existing assessment. Approve/reject/assign require reviewer or admin. Server review events retain actor, snapshot version and the SHA-256 of the database-normalized assessment JSON; this is distinct from a PDF or source-image hash. New evidence requires a new review.
- Account controls wrap within their panels; public mail failures explain setup requirements instead of claiming success.

## Verification

`tests/cloud.mjs` exercises disposable confirmed accounts only; it sends no emails. Its 12 groups test password auth; organizations/membership; outsider isolation; forged-metadata/self-promotion denial; reviewer events and hash/version binding; invalid/stale snapshot denial; private photo byte restoration; anonymous denial; logout; browser team buttons; separate-account/browser restoration with a real PNG, repeated pulls and reload-safe upload; stale browser rejection; browser sign-out. Temporary test users, objects and organizations are removed after final verification.

Also passed: 22 unit checks, original button suite, upgraded-route/batch suite, storage-upgrade recovery and production build. Live route/API and cloud checks are repeated after deployment. No database RLS/security findings were returned. A later Auth advisor flags disabled leaked-password protection; Supabase makes that feature available on Pro and above, so the approved free project was not upgraded ([password-security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Public auth hardening remains a release gate. Performance advisories report only indexes not yet used on this new database; indexes are retained to support foreign keys and future audit queries ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)).

## Setup still required for public accounts

Supabase's default mail service accepts only organization-member addresses. Public signup and password recovery need a configured SMTP provider. Email confirmation remains enabled; it has not been bypassed. The dashboard session must also set Site URL to `https://labelproof-prototype.vercel.app` and allow exactly `https://labelproof-prototype.vercel.app/dashboard/account`. Test confirmation and recovery in a real inbox before public enrollment. The backend password minimum should be set to 12 to match the interface.

See [official SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp) and [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls). No public email-delivery or account-recovery success is claimed.

## Deployment and use

Vercel production variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Database source: `supabase/schema.sql`, then `supabase/002_review_bindings.sql`. Never put a privileged key in frontend configuration. Development cloud tests require separately provisioned disposable accounts and an ignored `.env.cloud-test`; no test password is committed.

Confirmed users sign in at Account & privacy, then use Team & cloud to create/select an organization. Teammates share their signed-in user ID; admins add them with the appropriate role. Upload local workspace explicitly. On another device, sign in, select the same organization and download. Sync includes the current local workspace; review what it contains before uploading. Cloud snapshots are current-state records, not automated historical backups. Signing out ends cloud access but does not erase local cached photos/reports: use Settings on shared devices. The local workspace is device-wide; full account-isolated local caches are a remaining production gate.

## Production gates remain

This release is a tested cloud-connected prototype. It still needs public auth email setup, reviewed versioned legal rules, diverse real-package accuracy evaluation, distributed OCR processing, automated backup/restore drills, cloud/account deletion and retention enforcement, and external incident alerts. OCR, local batches and quality signals remain browser-based. Licence format detection does not verify a licence. Preliminary or team approval is not legal certification.
