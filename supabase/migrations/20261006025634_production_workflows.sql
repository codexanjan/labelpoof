-- Strict evidence graph, immutable reports, recoverable OCR and cloud restore points.
create function lp_private.validate_workspace(organization uuid, document jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare item jsonb; report jsonb; finding jsonb; evidence jsonb; reference text; region jsonb;
begin
 if document is null or pg_column_size(document)>10000000 or document->>'format' is distinct from 'labelproof-workspace' or document->>'schemaVersion' is distinct from '2' then raise exception 'Invalid workspace envelope'; end if;
 foreach reference in array array['scans','images','assessments'] loop
  if jsonb_typeof(document->reference) is distinct from 'array' then raise exception 'Invalid workspace collections'; end if;
  if exists(select 1 from jsonb_array_elements(document->reference) r where jsonb_typeof(r) is distinct from 'object' or length(coalesce(r->>'id','')) not between 1 and 100) then raise exception 'Invalid record identifier'; end if;
  if (select count(*) from jsonb_array_elements(document->reference))<>(select count(distinct r->>'id') from jsonb_array_elements(document->reference) r) then raise exception 'Duplicate record identifier'; end if;
 end loop;
 if jsonb_array_length(document->'scans')>100 or jsonb_array_length(document->'images')>1200 or jsonb_array_length(document->'assessments')>1000 then raise exception 'Workspace capacity exceeded'; end if;
 for item in select value from jsonb_array_elements(document->'scans') loop
  if length(coalesce(item->>'name','')) not between 1 and 120 or length(coalesce(item->>'category','')) not between 1 and 100 or item->>'createdAt' is null or item->>'updatedAt' is null then raise exception 'Invalid product'; end if;
  perform (item->>'createdAt')::timestamptz, (item->>'updatedAt')::timestamptz;
  if not exists(select 1 from jsonb_array_elements(document->'assessments') a where a->>'id'=item->>'latestAssessmentId' and a->>'scanId'=item->>'id') then raise exception 'Invalid latest report'; end if;
 end loop;
 for item in select value from jsonb_array_elements(document->'images') loop
  if not exists(select 1 from jsonb_array_elements(document->'scans') s where s->>'id'=item->>'scanId') or coalesce((item->>'width')::numeric,0)<1 or coalesce((item->>'height')::numeric,0)<1 or (item->>'width')::numeric*(item->>'height')::numeric>40000000 or length(coalesce(item->>'text',''))>100000 then raise exception 'Invalid evidence metadata'; end if;
  if item ? 'data' or item ? 'url' or item ? 'blob' then raise exception 'Use private storage for evidence'; end if;
  if item ? 'storagePath' then
   if item->>'storagePath' not like organization::text||'/%' or item->>'storagePath' like '%..%' or coalesce(item->>'sha256','') !~ '^[a-f0-9]{64}$' or not exists(select 1 from storage.objects where bucket_id='labelproof-evidence' and name=item->>'storagePath') then raise exception 'Invalid private evidence path or hash'; end if;
  elsif coalesce(item->>'fixture','') not in('/images/oats-label.svg','/images/tea-label.svg','/images/snack-label.svg') or coalesce(item->>'demo','false')<>'true' then raise exception 'Evidence object required'; end if;
 end loop;
 for report in select value from jsonb_array_elements(document->'assessments') loop
  if not exists(select 1 from jsonb_array_elements(document->'scans') s where s->>'id'=report->>'scanId') or coalesce((report->>'version')::integer,0)<1 or report->>'createdAt' is null or length(coalesce(report->>'rulePack',''))=0 or jsonb_typeof(report->'imageIds') is distinct from 'array' or jsonb_typeof(report->'findings') is distinct from 'array' then raise exception 'Invalid assessment'; end if;
  perform (report->>'createdAt')::timestamptz;
  if jsonb_array_length(report->'findings')<>12 or (select count(distinct f->>'key') from jsonb_array_elements(report->'findings') f)<>12 then raise exception 'Incomplete findings'; end if;
  for reference in select jsonb_array_elements_text(report->'imageIds') loop
   if not exists(select 1 from jsonb_array_elements(document->'images') i where i->>'id'=reference and i->>'scanId'=report->>'scanId') then raise exception 'Report evidence unavailable'; end if;
  end loop;
  for finding in select value from jsonb_array_elements(report->'findings') loop
   if coalesce(finding->>'key','') not in('quantity','price','manufacturer','licence','batch','date','ingredients','care','nutrition','allergen','origin','storage') or coalesce(finding->>'status','') not in('observed','missing','unreadable','not_captured','review','not_applicable','conflicting') or length(coalesce(finding->>'value',''))>3000 or length(coalesce(finding->>'reviewNote',''))>5000 then raise exception 'Invalid finding'; end if;
   if coalesce(finding->>'imageId','')<>'' and not (report->'imageIds' ? (finding->>'imageId')) then raise exception 'Finding evidence unavailable'; end if;
   if finding->>'status'='missing' then
    if coalesce(finding->>'coverageConfirmed','false')<>'true' or finding->>'applicability' is distinct from 'applies' or length(trim(coalesce(finding->>'reviewNote','')))=0 or jsonb_typeof(finding->'coverageImageIds') is distinct from 'array' then raise exception 'Absence requires applicability, rationale and readable coverage'; end if;
    if jsonb_array_length(finding->'coverageImageIds')=0 then raise exception 'Absence requires captured coverage'; end if;
    for reference in select jsonb_array_elements_text(finding->'coverageImageIds') loop
     if not (report->'imageIds' ? reference) or not exists(select 1 from jsonb_array_elements(document->'images') i where i->>'id'=reference and i->>'quality'='Readable') then raise exception 'Absence coverage must be readable'; end if;
    end loop;
   end if;
   for region,evidence in
    select finding->'box', i from jsonb_array_elements(document->'images') i where i->>'id'=finding->>'imageId' and jsonb_typeof(finding->'box')='object'
    union all
    select o->'box', i from jsonb_array_elements(coalesce(finding->'observations','[]')) o join jsonb_array_elements(document->'images') i on i->>'id'=o->>'imageId' where jsonb_typeof(o->'box')='object'
   loop
    if coalesce((region->>'x0')::numeric,-1)<0 or coalesce((region->>'y0')::numeric,-1)<0 or coalesce((region->>'x1')::numeric,-1)<=(region->>'x0')::numeric or coalesce((region->>'y1')::numeric,-1)<=(region->>'y0')::numeric or (region->>'x1')::numeric>(evidence->>'width')::numeric or (region->>'y1')::numeric>(evidence->>'height')::numeric then raise exception 'Evidence region outside image'; end if;
   end loop;
   if exists(select 1 from jsonb_array_elements(coalesce(finding->'observations','[]')) o where not (report->'imageIds' ? (o->>'imageId'))) then raise exception 'Observation evidence unavailable'; end if;
  end loop;
 end loop;
end $$;
revoke all on function lp_private.validate_workspace(uuid,jsonb) from public,anon,authenticated;

create table public.lp_snapshot_history (
 org_id uuid references public.lp_orgs(id) on delete cascade,
 version bigint not null, payload jsonb not null, created_at timestamptz not null default now(),
 primary key(org_id,version)
);
alter table public.lp_snapshot_history enable row level security;
create policy history_read on public.lp_snapshot_history for select to authenticated using(lp_private.member_role(org_id) is not null);
revoke all on public.lp_snapshot_history from anon,authenticated;
grant select on public.lp_snapshot_history to authenticated;

create or replace function lp_private.save_snapshot(organization uuid,expected_version bigint,payload jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_version bigint; previous jsonb;
begin
 perform lp_private.assert_writable_account();
 if auth.uid() is null or lp_private.member_role(organization) is null then raise exception 'Organization access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(organization::text,0));
 select s.version,s.payload into current_version,previous from public.lp_snapshots s where org_id=organization;
 current_version:=coalesce(current_version,0);
 if current_version<>expected_version then raise exception 'Version conflict: download newest cloud snapshot'; end if;
 perform lp_private.validate_workspace(organization,payload);
 if exists(select 1 from jsonb_array_elements(previous->'assessments') a join jsonb_array_elements(payload->'assessments') b on a->>'id'=b->>'id' where a<>b) then raise exception 'Assessment versions are immutable; create a new version'; end if;
 if previous is not null then insert into public.lp_snapshot_history(org_id,version,payload) values(organization,current_version,previous) on conflict do nothing; end if;
 delete from public.lp_snapshot_history where org_id=organization and version<current_version-9;
 insert into public.lp_snapshots(org_id,version,payload,updated_by) values(organization,current_version+1,payload,auth.uid()) on conflict(org_id) do update set version=excluded.version,payload=excluded.payload,updated_by=excluded.updated_by,updated_at=now();
 insert into public.lp_audit(org_id,actor,action,details) values(organization,auth.uid(),'workspace_saved',jsonb_build_object('version',current_version+1));
 return current_version+1;
end $$;

create function lp_private.restore_snapshot(organization uuid,restore_version bigint,expected_version bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare previous jsonb; target jsonb; current_version bigint;
begin
 perform lp_private.assert_writable_account();
 if auth.uid() is null or lp_private.member_role(organization) is distinct from 'admin' then raise exception 'Administrator required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(organization::text,0));
 select version,payload into current_version,previous from public.lp_snapshots where org_id=organization;
 if current_version is distinct from expected_version then raise exception 'Version conflict: download newest cloud snapshot'; end if;
 select payload into target from public.lp_snapshot_history where org_id=organization and version=restore_version;
 if target is null then raise exception 'Restore point unavailable'; end if;
 perform lp_private.validate_workspace(organization,target);
 insert into public.lp_snapshot_history(org_id,version,payload)values(organization,current_version,previous)on conflict do nothing;
 update public.lp_snapshots set payload=target,version=current_version+1,updated_by=auth.uid(),updated_at=now() where org_id=organization;
 insert into public.lp_audit(org_id,actor,action,details)values(organization,auth.uid(),'workspace_restored',jsonb_build_object('from_version',restore_version,'version',current_version+1));
 return current_version+1;
end $$;
create function public.lp_restore_snapshot(organization uuid,restore_version bigint,expected_version bigint)returns bigint language sql security invoker set search_path='' as $$select lp_private.restore_snapshot(organization,restore_version,expected_version)$$;
revoke all on function lp_private.restore_snapshot(uuid,bigint,bigint),public.lp_restore_snapshot(uuid,bigint,bigint) from public,anon;
grant execute on function lp_private.restore_snapshot(uuid,bigint,bigint),public.lp_restore_snapshot(uuid,bigint,bigint) to authenticated;

create function lp_private.review_checked(organization uuid,assessment text,review_action text,review_note text,expected_version bigint,assigned_to uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare event uuid; current_version bigint;
begin
 perform lp_private.assert_writable_account();
 if auth.uid() is null or lp_private.member_role(organization) is null then raise exception 'Organization access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(organization::text,0));
 select version into current_version from public.lp_snapshots where org_id=organization;
 if current_version is distinct from expected_version then raise exception 'Review version conflict: download newest cloud workspace'; end if;
 if review_action='assign' and (assigned_to is null or not exists(select 1 from public.lp_members where org_id=organization and user_id=assigned_to and role in('reviewer','admin'))) then raise exception 'Assign to a current team reviewer or administrator'; end if;
 event:=lp_private.review(organization,assessment,review_action,review_note);
 if review_action='assign' then update public.lp_review_events set assigned_user=assigned_to where id=event; end if;
 return event;
end $$;
alter table public.lp_review_events add column assigned_user uuid references auth.users(id) on delete set null;
create index lp_review_assigned_idx on public.lp_review_events(assigned_user);
create function public.lp_review_checked(organization uuid,assessment text,review_action text,review_note text,expected_version bigint,assigned_to uuid default null)returns uuid language sql security invoker set search_path='' as $$select lp_private.review_checked(organization,assessment,review_action,review_note,expected_version,assigned_to)$$;
revoke all on function lp_private.review_checked(uuid,text,text,text,bigint,uuid), public.lp_review_checked(uuid,text,text,text,bigint,uuid) from public,anon;
grant execute on function lp_private.review_checked(uuid,text,text,text,bigint,uuid), public.lp_review_checked(uuid,text,text,text,bigint,uuid) to authenticated;
-- Old mutation endpoint cannot bypass version checks. Demo and legacy clients get an upgrade error.
revoke execute on function public.lp_review(uuid,text,text,text),lp_private.review(uuid,text,text,text) from authenticated;

create table public.lp_jobs (
 id uuid primary key, org_id uuid not null references public.lp_orgs(id) on delete cascade,
 created_by uuid not null references auth.users(id), request jsonb not null,
 status text not null default 'queued' check(status in('queued','running','completed','failed')),
 attempts integer not null default 0, lease_token uuid, lease_until timestamptz,
 error text, result_scan text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.lp_jobs enable row level security;
create policy jobs_read on public.lp_jobs for select to authenticated using(lp_private.member_role(org_id) is not null);
revoke all on public.lp_jobs from anon,authenticated;
grant select on public.lp_jobs to authenticated;
create index lp_jobs_org_created_idx on public.lp_jobs(org_id,created_at);
create index lp_jobs_creator_idx on public.lp_jobs(created_by);
create index lp_jobs_pending_idx on public.lp_jobs(status,lease_until) where status in('queued','running');

create function lp_private.enqueue_job(organization uuid,job_id uuid,job_request jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare image jsonb; existing public.lp_jobs;
begin
 perform lp_private.assert_writable_account();
 if auth.uid() is null or lp_private.member_role(organization) is null then raise exception 'Organization access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(organization::text,0));
 select * into existing from public.lp_jobs where id=job_id;
 if found then
  if existing.org_id<>organization or existing.created_by<>auth.uid() or existing.request<>job_request then raise exception 'Idempotency key belongs to a different request'; end if;
  return job_id;
 end if;
 if job_id is null or length(trim(coalesce(job_request->>'name',''))) not between 1 and 120 or coalesce(job_request->>'language','') not in('eng','eng+hin') or jsonb_typeof(job_request->'images') is distinct from 'array' or pg_column_size(job_request)>10000 then raise exception 'Invalid OCR request'; end if;
 if jsonb_array_length(job_request->'images') not between 1 and 6 then raise exception 'Use 1–6 photos per product'; end if;
 for image in select value from jsonb_array_elements(job_request->'images') loop
  if image->>'storagePath' not like organization::text||'/jobs/'||job_id::text||'/%' or image->>'storagePath' like '%..%' or coalesce(image->>'surface','') not in('Front','Back','Left','Right','Top','Bottom','Wraparound') or coalesce(image->>'sha256','') !~ '^[a-f0-9]{64}$' or not exists(select 1 from storage.objects where bucket_id='labelproof-evidence' and name=image->>'storagePath' and coalesce((metadata->>'size')::bigint,0) between 1 and 12582912) then raise exception 'Invalid uploaded job evidence'; end if;
 end loop;
 if (select count(*) from public.lp_jobs where org_id=organization and created_at>now()-interval '24 hours')>=20 or (select count(*) from public.lp_jobs where created_at>now()-interval '24 hours')>=100 then raise exception 'Daily OCR capacity reached. Use browser OCR or retry tomorrow'; end if;
 insert into public.lp_jobs(id,org_id,created_by,request)values(job_id,organization,auth.uid(),job_request);
 insert into public.lp_audit(org_id,actor,action,details)values(organization,auth.uid(),'ocr_queued',jsonb_build_object('job',job_id));
 return job_id;
end $$;
create function public.lp_enqueue_job(organization uuid,job_id uuid,job_request jsonb)returns uuid language sql security invoker set search_path='' as $$select lp_private.enqueue_job(organization,job_id,job_request)$$;
revoke all on function lp_private.enqueue_job(uuid,uuid,jsonb),public.lp_enqueue_job(uuid,uuid,jsonb) from public,anon;
grant execute on function lp_private.enqueue_job(uuid,uuid,jsonb),public.lp_enqueue_job(uuid,uuid,jsonb) to authenticated;

create function lp_private.check_worker(worker_secret text)returns void language plpgsql security definer set search_path='' as $$
begin
 if length(coalesce(worker_secret,''))<>64 or not exists(select 1 from vault.decrypted_secrets where name='labelproof_worker' and extensions.digest(decrypted_secret,'sha256')=extensions.digest(worker_secret,'sha256')) then raise exception 'Worker authentication failed'; end if;
end $$;
create function lp_private.claim_job(worker_secret text,organization uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.lp_jobs;
begin
 perform lp_private.check_worker(worker_secret);
 perform pg_advisory_xact_lock(hashtextextended('labelproof-global-worker',0));
 update public.lp_jobs set status='failed',error='Worker stopped after three attempts. Upload a clearer photo as a new request.',lease_token=null,lease_until=null,updated_at=now() where status='running' and lease_until<now() and attempts>=3;
 if exists(select 1 from public.lp_jobs where status='running' and lease_until>now()) then return null; end if;
 select * into job from public.lp_jobs where (status='queued' or (status='running' and lease_until<now())) and attempts<3 and (organization is null or org_id=organization) order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 -- A removed member cannot leave work running against an old organization.
 if not exists(select 1 from public.lp_members where org_id=job.org_id and user_id=job.created_by) then update public.lp_jobs set status='failed',error='Uploader no longer belongs to this team',updated_at=now() where id=job.id; return null; end if;
 update public.lp_jobs set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',error=null,updated_at=now() where id=job.id returning * into job;
 return to_jsonb(job);
end $$;
create function lp_private.finish_job(worker_secret text,job_id uuid,claim_token uuid,bundle jsonb,failure text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare job public.lp_jobs; payload jsonb; previous jsonb; current_version bigint;
begin
 perform lp_private.check_worker(worker_secret);
 select * into job from public.lp_jobs where id=job_id for update;
 if not found or job.status<>'running' or job.lease_token is distinct from claim_token or job.lease_until<now() then return false; end if;
 if failure is not null then
  update public.lp_jobs set status=case when attempts<3 then 'queued' else 'failed' end,error=left(failure,1000),lease_token=null,lease_until=null,updated_at=now() where id=job_id;
  insert into public.lp_audit(org_id,actor,action,details)values(job.org_id,job.created_by,'ocr_attempt_failed',jsonb_build_object('job',job_id,'attempt',job.attempts));
  return true;
 end if;
 if not exists(select 1 from public.lp_members where org_id=job.org_id and user_id=job.created_by) then raise exception 'Uploader no longer belongs to team'; end if;
 perform pg_advisory_xact_lock(hashtextextended(job.org_id::text,0));
 select s.version,s.payload into current_version,previous from public.lp_snapshots s where org_id=job.org_id;
 current_version:=coalesce(current_version,0);
 payload:=coalesce(previous,jsonb_build_object('format','labelproof-workspace','schemaVersion',2,'scans','[]'::jsonb,'images','[]'::jsonb,'assessments','[]'::jsonb,'events','[]'::jsonb,'drafts','[]'::jsonb,'operations','[]'::jsonb,'settings','{}'::jsonb));
 payload:=jsonb_set(payload,'{scans}',payload->'scans'||jsonb_build_array(bundle->'scan'));
 payload:=jsonb_set(payload,'{images}',payload->'images'||bundle->'images');
 payload:=jsonb_set(payload,'{assessments}',payload->'assessments'||jsonb_build_array(bundle->'assessment'));
 payload:=jsonb_set(payload,'{events}',coalesce(payload->'events','[]')||jsonb_build_array(bundle->'event'));
 perform lp_private.validate_workspace(job.org_id,payload);
 if previous is not null then insert into public.lp_snapshot_history(org_id,version,payload)values(job.org_id,current_version,previous)on conflict do nothing; end if;
 delete from public.lp_snapshot_history where org_id=job.org_id and version<current_version-9;
 insert into public.lp_snapshots(org_id,version,payload,updated_by)values(job.org_id,current_version+1,payload,job.created_by)on conflict(org_id)do update set version=excluded.version,payload=excluded.payload,updated_by=excluded.updated_by,updated_at=now();
 update public.lp_jobs set status='completed',result_scan=bundle->'scan'->>'id',lease_token=null,lease_until=null,updated_at=now() where id=job_id;
 insert into public.lp_audit(org_id,actor,action,details)values(job.org_id,job.created_by,'ocr_completed',jsonb_build_object('job',job_id,'scan',bundle->'scan'->>'id','snapshot_version',current_version+1));
 return true;
end $$;
create function public.lp_worker_claim(worker_secret text,organization uuid default null)returns jsonb language sql security invoker set search_path='' as $$select lp_private.claim_job(worker_secret,organization)$$;
create function public.lp_worker_finish(worker_secret text,job_id uuid,claim_token uuid,bundle jsonb,failure text default null)returns boolean language sql security invoker set search_path='' as $$select lp_private.finish_job(worker_secret,job_id,claim_token,bundle,failure)$$;
revoke all on function lp_private.check_worker(text),lp_private.claim_job(text,uuid),lp_private.finish_job(text,uuid,uuid,jsonb,text),public.lp_worker_claim(text,uuid),public.lp_worker_finish(text,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant usage on schema lp_private to service_role;
grant execute on function lp_private.claim_job(text,uuid),lp_private.finish_job(text,uuid,uuid,jsonb,text),public.lp_worker_claim(text,uuid),public.lp_worker_finish(text,uuid,uuid,jsonb,text) to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create function lp_private.pump_jobs()returns void language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if not exists(select 1 from public.lp_jobs where status='queued' or (status='running' and lease_until<now())) or exists(select 1 from public.lp_jobs where status='running' and lease_until>now()) then return; end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='labelproof_worker';
 if secret is null then return; end if;
 perform net.http_post(url:='https://labelproof-prototype.vercel.app/api/worker',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:='{}'::jsonb,timeout_milliseconds:=200000);
end $$;
revoke all on function lp_private.pump_jobs() from public,anon,authenticated;
select cron.schedule('labelproof-ocr-recovery','* * * * *','select lp_private.pump_jobs()');
