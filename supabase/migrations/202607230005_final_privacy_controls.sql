begin;

create table if not exists public.privacy_notices (
  id uuid primary key default gen_random_uuid(),
  notice_key text not null unique,
  title text not null check (char_length(trim(title)) > 0),
  version text not null check (char_length(trim(version)) > 0),
  notice_text text not null check (char_length(trim(notice_text)) > 0),
  effective_at timestamptz not null,
  retired_at timestamptz,
  active boolean not null default true,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_notice_acceptances (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.privacy_notices(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  participant_id uuid references public.participants(id) on delete set null,
  circle_id uuid references public.circles(id) on delete set null,
  accepted_at timestamptz not null default now(),
  acceptance_method text not null default 'in_app'
    check (
      acceptance_method in (
        'in_app',
        'written',
        'verbal_recorded',
        'representative'
      )
    ),
  representative_name text not null default '',
  evidence_reference text not null default '',
  created_at timestamptz not null default now(),
  unique(notice_id, user_id, participant_id, circle_id)
);

create table if not exists public.privacy_training_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  training_key text not null,
  training_title text not null,
  training_version text not null,
  completed_at timestamptz not null,
  expires_at timestamptz,
  attested_at timestamptz not null default now(),
  evidence_reference text not null default '',
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, training_key, training_version)
);

create table if not exists public.privacy_access_reviews (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  reviewed_user_id uuid not null references auth.users(id) on delete restrict,
  circle_member_id uuid not null references public.circle_members(id) on delete cascade,
  review_status text not null default 'pending'
    check (
      review_status in (
        'pending',
        'confirmed',
        'reduced',
        'suspended',
        'removed'
      )
    ),
  permissions_reviewed jsonb not null default '{}'::jsonb,
  findings text not null default '',
  action_taken text not null default '',
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  next_review_due_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_backup_recovery_tests (
  id uuid primary key default gen_random_uuid(),
  test_type text not null
    check (
      test_type in (
        'backup_success',
        'restore_test',
        'deletion_verification',
        'disaster_recovery'
      )
    ),
  environment text not null default 'production',
  started_at timestamptz not null,
  completed_at timestamptz,
  result text not null default 'pending'
    check (
      result in (
        'pending',
        'passed',
        'passed_with_findings',
        'failed'
      )
    ),
  systems_tested text[] not null default array[]::text[],
  findings text not null default '',
  corrective_action text not null default '',
  corrective_action_due_at timestamptz,
  evidence_reference text not null default '',
  performed_by_user_id uuid not null references auth.users(id) on delete restrict,
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists privacy_notices_active_idx
  on public.privacy_notices(active, effective_at desc);

create index if not exists privacy_training_records_expiry_idx
  on public.privacy_training_records(user_id, expires_at);

create index if not exists privacy_access_reviews_due_idx
  on public.privacy_access_reviews(circle_id, next_review_due_at);

create index if not exists privacy_backup_recovery_tests_result_idx
  on public.privacy_backup_recovery_tests(result, started_at desc);

drop trigger if exists privacy_notices_set_updated_at
  on public.privacy_notices;

create trigger privacy_notices_set_updated_at
before update on public.privacy_notices
for each row execute function private.sm_set_updated_at();

drop trigger if exists privacy_access_reviews_set_updated_at
  on public.privacy_access_reviews;

create trigger privacy_access_reviews_set_updated_at
before update on public.privacy_access_reviews
for each row execute function private.sm_set_updated_at();

drop trigger if exists privacy_backup_recovery_tests_set_updated_at
  on public.privacy_backup_recovery_tests;

create trigger privacy_backup_recovery_tests_set_updated_at
before update on public.privacy_backup_recovery_tests
for each row execute function private.sm_set_updated_at();

alter table public.privacy_notices enable row level security;
alter table public.privacy_notice_acceptances enable row level security;
alter table public.privacy_training_records enable row level security;
alter table public.privacy_access_reviews enable row level security;
alter table public.privacy_backup_recovery_tests enable row level security;

drop policy if exists "active privacy notices readable by authenticated users"
  on public.privacy_notices;

create policy "active privacy notices readable by authenticated users"
on public.privacy_notices
for select to authenticated
using (active = true or private.sm_has_privacy_governance_access());

drop policy if exists "privacy notices managed by governance users"
  on public.privacy_notices;

create policy "privacy notices managed by governance users"
on public.privacy_notices
for all to authenticated
using (private.sm_has_privacy_governance_access())
with check (
  private.sm_has_privacy_governance_access()
  and created_by_user_id is not null
);

drop policy if exists "notice acceptances readable by owner or governance"
  on public.privacy_notice_acceptances;

create policy "notice acceptances readable by owner or governance"
on public.privacy_notice_acceptances
for select to authenticated
using (
  user_id = auth.uid()
  or private.sm_has_privacy_governance_access()
);

drop policy if exists "notice acceptances created by owner"
  on public.privacy_notice_acceptances;

create policy "notice acceptances created by owner"
on public.privacy_notice_acceptances
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "training records readable by owner or governance"
  on public.privacy_training_records;

create policy "training records readable by owner or governance"
on public.privacy_training_records
for select to authenticated
using (
  user_id = auth.uid()
  or private.sm_has_privacy_governance_access()
);

drop policy if exists "training records created by owner or governance"
  on public.privacy_training_records;

create policy "training records created by owner or governance"
on public.privacy_training_records
for insert to authenticated
with check (
  user_id = auth.uid()
  or private.sm_has_privacy_governance_access()
);

drop policy if exists "training records updated by governance"
  on public.privacy_training_records;

create policy "training records updated by governance"
on public.privacy_training_records
for update to authenticated
using (private.sm_has_privacy_governance_access())
with check (private.sm_has_privacy_governance_access());

drop policy if exists "access reviews readable by circle managers"
  on public.privacy_access_reviews;

create policy "access reviews readable by circle managers"
on public.privacy_access_reviews
for select to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = privacy_access_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and permission.can_manage_circle = true
  )
);

drop policy if exists "access reviews managed by circle managers"
  on public.privacy_access_reviews;

create policy "access reviews managed by circle managers"
on public.privacy_access_reviews
for all to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = privacy_access_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and permission.can_manage_circle = true
  )
)
with check (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = privacy_access_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and permission.can_manage_circle = true
  )
);

drop policy if exists "backup tests readable by governance users"
  on public.privacy_backup_recovery_tests;

create policy "backup tests readable by governance users"
on public.privacy_backup_recovery_tests
for select to authenticated
using (private.sm_has_privacy_governance_access());

drop policy if exists "backup tests managed by governance users"
  on public.privacy_backup_recovery_tests;

create policy "backup tests managed by governance users"
on public.privacy_backup_recovery_tests
for all to authenticated
using (private.sm_has_privacy_governance_access())
with check (
  private.sm_has_privacy_governance_access()
  and performed_by_user_id is not null
);

create or replace function private.sm_audit_privacy_access_review()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  changed text[] := array[]::text[];
  action_name text := 'insert';
begin
  if tg_op = 'UPDATE' then
    action_name := case
      when old.review_status is distinct from new.review_status
        then 'status_change'
      else 'update'
    end;

    if old.review_status is distinct from new.review_status then
      changed := array_append(changed, 'review_status');
    end if;

    if old.permissions_reviewed is distinct from new.permissions_reviewed then
      changed := array_append(changed, 'permissions_reviewed');
    end if;

    if old.action_taken is distinct from new.action_taken then
      changed := array_append(changed, 'action_taken');
    end if;
  end if;

  insert into public.audit_events (
    circle_id,
    participant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    changed_fields,
    event_summary,
    source
  )
  select
    new.circle_id,
    circle.participant_id,
    auth.uid(),
    action_name,
    'privacy_access_review',
    new.id,
    changed,
    case
      when tg_op = 'INSERT'
        then 'Privacy access review created'
      else
        'Privacy access review updated: ' || new.review_status
    end,
    'database_trigger'
  from public.circles circle
  where circle.id = new.circle_id;

  return new;
end;
$$;

drop trigger if exists privacy_access_reviews_audit
  on public.privacy_access_reviews;

create trigger privacy_access_reviews_audit
after insert or update
on public.privacy_access_reviews
for each row execute function private.sm_audit_privacy_access_review();

commit;