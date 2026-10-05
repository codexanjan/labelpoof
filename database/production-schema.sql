-- Proposed PostgreSQL 15+ production design. NOT used by the deployed browser prototype.
-- Review tenant authorization, retention, migrations and legal rule governance before use.
BEGIN;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_subject text NOT NULL UNIQUE,
  display_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('owner','reviewer','member')),
  PRIMARY KEY (organization_id,user_id)
);
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL, brand text, category_code text NOT NULL,
  import_status text NOT NULL DEFAULT 'unknown', barcode text,
  metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,organization_id)
);
CREATE TABLE scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id), product_id uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id), status text NOT NULL DEFAULT 'draft',
  capture_plan_version text NOT NULL, latest_assessment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id,organization_id) REFERENCES products(id,organization_id),
  UNIQUE (id,organization_id)
);
CREATE TABLE scan_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  object_key text NOT NULL UNIQUE, sha256 char(64) NOT NULL, mime_type text NOT NULL,
  width integer NOT NULL CHECK(width>0), height integer NOT NULL CHECK(height>0),
  surface_type text NOT NULL, quality_metadata jsonb NOT NULL DEFAULT '{}',
  uploaded_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,scan_id)
);
CREATE TABLE ocr_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), image_id uuid NOT NULL REFERENCES scan_images(id),
  engine text NOT NULL, engine_version text NOT NULL, config_hash text NOT NULL,
  status text NOT NULL, started_at timestamptz, completed_at timestamptz
);
CREATE TABLE ocr_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ocr_run_id uuid NOT NULL REFERENCES ocr_runs(id),
  raw_text text NOT NULL, language text, polygon jsonb NOT NULL,
  confidence_signals jsonb NOT NULL DEFAULT '{}', transformation_metadata jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE field_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  field_key text NOT NULL, observation_status text NOT NULL CHECK(observation_status IN
  ('observed','unreadable','not_captured','not_found_after_review','conflicting','needs_review')),
  raw_value text, normalized_value jsonb, extraction_version text NOT NULL,
  human_confirmed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,scan_id)
);
CREATE TABLE observation_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), observation_id uuid NOT NULL REFERENCES field_observations(id),
  image_id uuid NOT NULL REFERENCES scan_images(id), ocr_region_id uuid REFERENCES ocr_regions(id),
  polygon jsonb, evidence_role text NOT NULL
);
CREATE TABLE coverage_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  capture_plan_version text NOT NULL, covered_surfaces jsonb NOT NULL,
  uncertain_regions jsonb NOT NULL DEFAULT '[]', sufficiency text NOT NULL,
  rationale text NOT NULL, reviewer_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rule_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), authority text NOT NULL, title text NOT NULL,
  source_url text NOT NULL, document_object_key text, document_sha256 char(64),
  retrieved_at timestamptz NOT NULL, publication_date date
);
CREATE TABLE rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stable_key text NOT NULL UNIQUE, title text NOT NULL
);
CREATE TABLE rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rule_id uuid NOT NULL REFERENCES rules(id),
  source_id uuid NOT NULL REFERENCES rule_sources(id), version text NOT NULL,
  clause_locator text NOT NULL, requirement_summary text NOT NULL,
  applicability_expression jsonb NOT NULL, evaluator_key text NOT NULL,
  required_evidence jsonb NOT NULL, exceptions jsonb NOT NULL DEFAULT '[]',
  effective_from date, effective_to date, review_status text NOT NULL DEFAULT 'draft',
  reviewed_by uuid REFERENCES users(id), UNIQUE(rule_id,version),
  CHECK(effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from)
);
CREATE TABLE rule_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, version text NOT NULL,
  status text NOT NULL DEFAULT 'draft', published_at timestamptz, UNIQUE(name,version)
);
CREATE TABLE rule_pack_entries (
  rule_pack_id uuid NOT NULL REFERENCES rule_packs(id), rule_version_id uuid NOT NULL REFERENCES rule_versions(id),
  PRIMARY KEY(rule_pack_id,rule_version_id)
);
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  version integer NOT NULL CHECK(version>0), rule_pack_id uuid NOT NULL REFERENCES rule_packs(id),
  status text NOT NULL, assessed_at timestamptz NOT NULL DEFAULT now(),
  pipeline_version text NOT NULL, input_snapshot_hash char(64) NOT NULL,
  product_snapshot jsonb NOT NULL, summary jsonb NOT NULL, UNIQUE(scan_id,version), UNIQUE(id,scan_id)
);
ALTER TABLE scans ADD CONSTRAINT latest_assessment_belongs_to_scan
  FOREIGN KEY(latest_assessment_id,id) REFERENCES assessments(id,scan_id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE assessment_observations (
  assessment_id uuid NOT NULL REFERENCES assessments(id), observation_id uuid NOT NULL REFERENCES field_observations(id),
  PRIMARY KEY(assessment_id,observation_id)
);
CREATE TABLE assessment_images (
  assessment_id uuid NOT NULL REFERENCES assessments(id), image_id uuid NOT NULL REFERENCES scan_images(id),
  image_snapshot jsonb NOT NULL, PRIMARY KEY(assessment_id,image_id)
);
CREATE TABLE findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_id uuid NOT NULL REFERENCES assessments(id),
  rule_version_id uuid NOT NULL REFERENCES rule_versions(id),
  applicability text NOT NULL CHECK(applicability IN ('applies','does_not_apply','unknown')),
  outcome text NOT NULL CHECK(outcome IN ('supported','potential_non_compliance','unresolved','not_applicable')),
  reason_code text NOT NULL, explanation text NOT NULL, evidence_sufficiency jsonb NOT NULL,
  review_required boolean NOT NULL DEFAULT true
);
CREATE TABLE finding_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), finding_id uuid NOT NULL REFERENCES findings(id),
  observation_evidence_id uuid REFERENCES observation_evidence(id), image_id uuid REFERENCES scan_images(id),
  evidence_role text NOT NULL, rationale text NOT NULL,
  CHECK(observation_evidence_id IS NOT NULL OR image_id IS NOT NULL)
);
CREATE TABLE rescan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  finding_id uuid REFERENCES findings(id), target_surface text, target_field text,
  reason_code text NOT NULL, instruction text NOT NULL, status text NOT NULL DEFAULT 'open',
  resolved_by_image_id uuid REFERENCES scan_images(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  observation_id uuid NOT NULL REFERENCES field_observations(id), actor_id uuid NOT NULL REFERENCES users(id),
  previous_value jsonb NOT NULL, new_value jsonb NOT NULL, reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  field_key text NOT NULL, authority text NOT NULL, status text NOT NULL,
  checked_at timestamptz, response_reference text, evidence_metadata jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scan_id uuid NOT NULL REFERENCES scans(id),
  assessment_id uuid REFERENCES assessments(id), idempotency_key text NOT NULL UNIQUE,
  stage text NOT NULL, status text NOT NULL, attempt_count integer NOT NULL DEFAULT 0,
  error_code text, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE report_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_id uuid NOT NULL REFERENCES assessments(id),
  format text NOT NULL, object_key text NOT NULL, checksum char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  actor_id uuid REFERENCES users(id), entity_type text NOT NULL, entity_id uuid,
  action text NOT NULL, change_metadata jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scans_org_updated_idx ON scans(organization_id,updated_at DESC);
CREATE INDEX images_scan_idx ON scan_images(scan_id);
CREATE INDEX observations_scan_field_idx ON field_observations(scan_id,field_key);
CREATE INDEX findings_assessment_outcome_idx ON findings(assessment_id,outcome);
CREATE INDEX jobs_status_created_idx ON processing_jobs(status,created_at);
CREATE INDEX audit_org_created_idx ON audit_events(organization_id,created_at DESC);

-- Authentication integration, tenant-enforcing RLS/API authorization, object-store policies,
-- immutable-record guards and retention procedures are required before production deployment.
COMMIT;
