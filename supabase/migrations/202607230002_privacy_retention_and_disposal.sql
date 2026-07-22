begin;

create table if not exists public.privacy_retention_policies (
  id uuid primary key default gen_random_uuid(),
  record_type text not null unique,
  retention_years integer not null check (retention_years >= 0),
  retention_basis text not null,
  disposal_method text not null default 'secure_delete',
  legal_hold_allowed boolean not null default true,
  active boolean not null default true,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_disposal_reviews (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  record_type text not null,
  record_reference text not null,
  retention_due_at timestamptz not null,
  review_status text not null default 'pending'
    check (
      review_status in (
        'pending',
        'retained',
        'disposed',
        'legal_hold',
        'not_found'
      )
    ),
  review_reason text not null default '',
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  disposal_verified_by_user_id uuid references auth.users(id) on delete set null,
  disposal_verified_at timestamptz,
  evidence_reference text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privacy_disposal_review_completion_check check (
    (
      review_status in ('retained','disposed','legal_hold','not_found')
      and reviewed_at is not null
      and reviewed_by_user_id is not null
    )
    or review_status = 'pending'
  ),
  constraint privacy_disposal_verification_check check (
    review_status <> 'disposed'
    or (
      disposal_verified_at is not null
      and disposal_verified_by_user_id is not null
    )
  )
);

create index if not exists privacy_disposal_reviews_circle_idx
  on public.privacy_disposal_reviews(circle_id, retention_due_at);

create index if not exists privacy_disposal_reviews_status_due_idx
  on public.privacy_disposal_reviews(review_status, retention_due_at);

drop trigger if exists privacy_retention_policies_set_updated_at
  on public.privacy_retention_policies;

create trigger privacy_retention_policies_set_updated_at
before update on public.privacy_retention_policies
for each row execute function private.sm_set_updated_at();

drop trigger if exists privacy_disposal_reviews_set_updated_at
  on public.privacy_disposal_reviews;

create trigger privacy_disposal_reviews_set_updated_at
before update on public.privacy_disposal_reviews
for each row execute function private.sm_set_updated_at();

alter table public.privacy_retention_policies enable row level security;
alter table public.privacy_disposal_reviews enable row level security;

drop policy if exists "retention policies readable by authenticated users"
  on public.privacy_retention_policies;

create policy "retention policies readable by authenticated users"
on public.privacy_retention_policies
for select to authenticated
using (active = true);

drop policy if exists "retention policies managed by circle managers"
  on public.privacy_retention_policies;

create policy "retention policies managed by circle managers"
on public.privacy_retention_policies
for all to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.user_id = auth.uid()
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
    where member.user_id = auth.uid()
      and member.membership_status = 'active'
      and permission.can_manage_circle = true
  )
);

drop policy if exists "disposal reviews readable by active circle members"
  on public.privacy_disposal_reviews;

create policy "disposal reviews readable by active circle members"
on public.privacy_disposal_reviews
for select to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    where member.circle_id = privacy_disposal_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
  )
);

drop policy if exists "disposal reviews managed by authorised circle managers"
  on public.privacy_disposal_reviews;

create policy "disposal reviews managed by authorised circle managers"
on public.privacy_disposal_reviews
for all to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = privacy_disposal_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        permission.can_manage_consents = true
        or permission.can_manage_circle = true
      )
  )
)
with check (
  exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = privacy_disposal_reviews.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        permission.can_manage_consents = true
        or permission.can_manage_circle = true
      )
  )
);

insert into public.privacy_retention_policies (
  record_type,
  retention_years,
  retention_basis,
  disposal_method,
  created_by_user_id
)
select
  seed.record_type,
  seed.retention_years,
  seed.retention_basis,
  seed.disposal_method,
  auth.uid()
from (
  values
    (
      'participant_profile',
      7,
      'Operational and legal recordkeeping requirement; confirm against final legal advice.',
      'secure_delete'
    ),
    (
      'consent_record',
      7,
      'Evidence of consent, withdrawal and review history.',
      'retain_audit_then_secure_delete'
    ),
    (
      'audit_event',
      7,
      'Security, accountability and incident investigation evidence.',
      'secure_archive'
    ),
    (
      'privacy_request',
      7,
      'Evidence of access, correction, export, restriction and deletion handling.',
      'retain_audit_then_secure_delete'
    ),
    (
      'circle_document',
      7,
      'Operational record; confirm category-specific requirements before disposal.',
      'secure_delete'
    )
) as seed(
  record_type,
  retention_years,
  retention_basis,
  disposal_method
)
where auth.uid() is not null
on conflict (record_type) do nothing;

create or replace function private.sm_audit_privacy_disposal_review()
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

    if old.review_reason is distinct from new.review_reason then
      changed := array_append(changed, 'review_reason');
    end if;

    if old.retention_due_at is distinct from new.retention_due_at then
      changed := array_append(changed, 'retention_due_at');
    end if;

    if old.disposal_verified_at is distinct from new.disposal_verified_at then
      changed := array_append(changed, 'disposal_verified_at');
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
  values (
    new.circle_id,
    new.participant_id,
    auth.uid(),
    action_name,
    'privacy_disposal_review',
    new.id,
    changed,
    case
      when tg_op = 'INSERT'
        then 'Privacy retention review created'
      else
        'Privacy retention review updated: ' || new.review_status
    end,
    'database_trigger'
  );

  return new;
end;
$$;

drop trigger if exists privacy_disposal_reviews_audit
  on public.privacy_disposal_reviews;

create trigger privacy_disposal_reviews_audit
after insert or update
on public.privacy_disposal_reviews
for each row execute function private.sm_audit_privacy_disposal_review();

commit;