-- Run once in Supabase → SQL Editor. No passwords or private keys go here.
begin;
create table if not exists public.dashboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz,
  profile jsonb,
  constraint dashboard_profile_size check (profile is null or octet_length(profile::text) <= 32768)
);
alter table public.dashboard_profiles enable row level security;
revoke all on public.dashboard_profiles from public, anon, authenticated;
grant select on public.dashboard_profiles to authenticated;
drop policy if exists "Read own dashboard" on public.dashboard_profiles;
create policy "Read own dashboard" on public.dashboard_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.save_dashboard_profile(p_profile jsonb, p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  saved public.dashboard_profiles;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'Log ind for at gemme opsætningen.'; end if;
  if p_profile is null or jsonb_typeof(p_profile) <> 'object'
    or coalesce(jsonb_typeof(p_profile->'layout'),'') <> 'array'
    or coalesce(jsonb_typeof(p_profile->'widgets'),'') <> 'object'
    or coalesce(p_profile->>'appearance','') not in ('auto','day','night')
    or coalesce(p_profile->>'density','') not in ('compact','comfortable')
    or coalesce(jsonb_typeof(p_profile->'briefing'),'') <> 'boolean'
    or octet_length(p_profile::text) > 32768 then
    raise sqlstate 'PT400' using message = 'Dashboardopsætningen er ugyldig.';
  end if;
  if jsonb_array_length(p_profile->'layout') not in (12,13) then
    raise sqlstate 'PT400' using message = 'Dashboardlayoutet er ugyldigt.';
  end if;
  insert into public.dashboard_profiles(user_id) values (caller) on conflict do nothing;
  select * into saved from public.dashboard_profiles where user_id = caller for update;
  if p_expected_revision is null or p_expected_revision <> saved.revision then
    raise sqlstate 'PT409' using message = 'Opsætningen er ændret på en anden enhed. Hent den seneste opstilling.';
  end if;
  update public.dashboard_profiles set profile=p_profile, revision=revision+1, updated_at=now()
    where user_id=caller returning * into saved;
  return jsonb_build_object('version',1,'revision',saved.revision,'updatedAt',saved.updated_at,'profile',saved.profile);
end;
$$;
revoke all on function public.save_dashboard_profile(jsonb,bigint) from public, anon, authenticated;
grant execute on function public.save_dashboard_profile(jsonb,bigint) to authenticated;
commit;
