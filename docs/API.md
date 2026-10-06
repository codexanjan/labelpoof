# API contracts

## Implemented Vercel endpoints

`GET /api/health`: application/version, status, browser database and OCR architecture, legal rule publication state and registry connection state. Returns JSON with cache disabled.

`GET /api/sources`: official reference manifest, candidate declaration metadata and observation-pack identifier. Regex implementations are omitted from the response. Legal validation is explicitly marked not validated. Cache is five minutes.

`GET /api/config`: public cloud connection configuration only, including Supabase URL and publishable key when configured. No privileged key is returned.

`POST /api/telemetry`: accepts validated `LP_` diagnostic codes, checks supplied origin and records a redacted code/timestamp in platform logs. It does not provide external alert delivery. Other methods return 405. Supabase Auth, Storage and the four membership-authorized RPCs provide cloud operations; see the current [architecture](specifications/03-Development-Architecture.md).

Unsupported HTTP methods return 405. These metadata functions do not collect uploads or return authenticated user data. Local Vite serves the frontend; use Vercel development/deployment for functions.

## Planned production API — not deployed

| Method | Path | Intended contract |
| --- | --- | --- |
| POST | `/api/v1/scans` | Create a tenant-scoped scan |
| POST | `/api/v1/scans/:id/images` | Validate private upload and issue evidence record |
| POST | `/api/v1/scans/:id/assessments` | Idempotent asynchronous assessment submission |
| GET | `/api/v1/jobs/:id` | Processing status and recoverable failure codes |
| GET | `/api/v1/assessments/:id` | Immutable findings and rule/input snapshot |
| POST | `/api/v1/scans/:id/corrections` | Authorized correction with provenance |
| GET | `/api/v1/scans/:id/rescan-requests` | Specific outstanding capture actions |
| POST | `/api/v1/assessments/:id/exports` | Generate a private report export |
| POST | `/api/v1/admin/rule-packs/:id/publish` | Reviewed, authorized legal rule publication |

Require object-level authorization, pagination, stable errors, upload/rate limits, private short-lived image access and audit trails. These paths are a roadmap and must not be advertised as working endpoints.
