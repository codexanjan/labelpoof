-- Apply after schema.sql and 002_review_bindings.sql. No demo UUID is hardcoded.
create table lp_private.demo_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table lp_private.demo_accounts enable row level security;
revoke all on lp_private.demo_accounts from public, anon, authenticated;

create function lp_private.is_demo() returns boolean language sql stable
security definer set search_path='' as $$
  select exists(select 1 from lp_private.demo_accounts where user_id=(select auth.uid()))
$$;
create function lp_private.assert_writable_account() returns void language plpgsql
security definer set search_path='' as $$ begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if lp_private.is_demo() then raise exception 'Shared demo account is read-only'; end if;
end $$;
revoke all on function lp_private.is_demo(),lp_private.assert_writable_account() from public;
grant execute on function lp_private.is_demo(),lp_private.assert_writable_account() to authenticated;

-- Preserve the deployed implementations (including version/hash bindings).
do $$ declare definition text; begin
  for definition in
    select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on p.pronamespace=n.oid
    where n.nspname='lp_private' and p.proname in('create_org','set_member','save_snapshot','review')
  loop
    execute regexp_replace(definition,'\mbegin\M','begin perform lp_private.assert_writable_account();','i');
  end loop;
end $$;
alter policy evidence_upload on storage.objects with check (
  bucket_id='labelproof-evidence' and not lp_private.is_demo()
  and lp_private.member_role(((storage.foldername(name))[1])::uuid) is not null
);
alter policy evidence_delete on storage.objects using (
  bucket_id='labelproof-evidence' and not lp_private.is_demo()
  and lp_private.member_role(((storage.foldername(name))[1])::uuid)='admin'
);

-- Shared credentials cannot be changed through the public Auth API.
create function lp_private.protect_demo_credentials() returns trigger language plpgsql
security definer set search_path='' as $$ begin
  if exists(select 1 from lp_private.demo_accounts where user_id=old.id) and (
    new.email is distinct from old.email or new.encrypted_password is distinct from old.encrypted_password
    or new.phone is distinct from old.phone or new.email_change is distinct from old.email_change
    or new.phone_change is distinct from old.phone_change
  ) then raise exception 'Shared demo credentials cannot be changed'; end if;
  return new;
end $$;
revoke all on function lp_private.protect_demo_credentials() from public,anon,authenticated;
create trigger lp_protect_demo_credentials before update on auth.users
for each row execute function lp_private.protect_demo_credentials();

create function lp_private.protect_demo_mfa() returns trigger language plpgsql
security definer set search_path='' as $$ begin
  if exists(select 1 from lp_private.demo_accounts where user_id=coalesce(new.user_id,old.user_id))
    then raise exception 'MFA is unavailable for the shared demo account'; end if;
  if tg_op='DELETE' then return old; end if; return new;
end $$;
revoke all on function lp_private.protect_demo_mfa() from public,anon,authenticated;
create trigger lp_protect_demo_mfa before insert or update or delete on auth.mfa_factors
for each row execute function lp_private.protect_demo_mfa();

create function lp_private.protect_demo_identity() returns trigger language plpgsql
security definer set search_path='' as $$ begin
  if exists(select 1 from lp_private.demo_accounts where user_id=coalesce(new.user_id,old.user_id)) then
    if tg_op<>'UPDATE' then raise exception 'Shared demo identity cannot be linked or removed'; end if;
    if new.user_id is distinct from old.user_id or new.provider_id is distinct from old.provider_id
      or new.provider is distinct from old.provider or new.identity_data->>'email' is distinct from old.identity_data->>'email'
      then raise exception 'Shared demo identity cannot be changed'; end if;
  end if;
  if tg_op='DELETE' then return old; end if; return new;
end $$;
revoke all on function lp_private.protect_demo_identity() from public,anon,authenticated;
create trigger lp_protect_demo_identity before insert or update or delete on auth.identities
for each row execute function lp_private.protect_demo_identity();
