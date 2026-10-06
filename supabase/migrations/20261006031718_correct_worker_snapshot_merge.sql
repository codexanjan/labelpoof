-- Parenthesize both JSONB operands to preserve the workspace envelope.
create or replace function lp_private.finish_job(worker_secret text,job_id uuid,claim_token uuid,bundle jsonb,failure text default null)
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
 payload:=jsonb_set(payload,'{images}',(payload->'images')||(bundle->'images'));
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
