begin;

create table if not exists public.participant_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  request_type text not null check (
    request_type in ('access','correction','export','restriction','deletion')
  ),
  request_details text not null check (char_length(trim(request_details)) > 0),
  status text not null default 'submitted' check (
    status in ('submitted','acknowledged','in_progress','completed','partially_completed','declined','cancelled')
  ),
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  due_at timestamptz not null default (now() + interval '30 days'),
  acknowledged_at timestamptz,
  completed_at timestamptz,
  outcome_summary text not null default '',
  refusal_reason text not null default '',
  identity_verified_at timestamptz,
  identity_verified_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participant_privacy_requests_completion_check check (
    (
      status in ('completed','partially_completed','declined','cancelled')
      and completed_at is not null
    )
    or status not in ('completed','partially_completed','declined','cancelled')
  ),
  constraint participant_privacy_requests_refusal_check check (
    status <> 'declined'
    or char_length(trim(refusal_reason)) > 0
  )
);

create index if not exists participant_privacy_requests_circle_idx
  on public.participant_privacy_requests (circle_id, created_at desc);

create index if not exists participant_privacy_requests_participant_idx
  on public.participant_privacy_requests (participant_id, created_at desc);

create index if not exists participant_privacy_requests_status_due_idx
  on public.participant_privacy_requests (status, due_at);

create or replace function private.sm_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists participant_privacy_requests_touch_updated_at
  on public.participant_privacy_requests;

create trigger participant_privacy_requests_touch_updated_at
before update on public.participant_privacy_requests
for each row execute function private.sm_touch_updated_at();

alter table public.participant_privacy_requests enable row level security;

drop policy if exists "privacy requests readable by authorised circle members"
  on public.participant_privacy_requests;

create policy "privacy requests readable by authorised circle members"
on public.participant_privacy_requests
for select to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    where member.circle_id = participant_privacy_requests.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
  )
);

drop policy if exists "privacy requests can be created by active circle members"
  on public.participant_privacy_requests;

create policy "privacy requests can be created by active circle members"
on public.participant_privacy_requests
for insert to authenticated
with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.circle_members member
    where member.circle_id = participant_privacy_requests.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
  )
);

drop policy if exists "privacy requests manageable by authorised circle managers"
  on public.participant_privacy_requests;

create policy "privacy requests manageable by authorised circle managers"
on public.participant_privacy_requests
for update to authenticated
using (
  requested_by_user_id = auth.uid()
  or exists (
    select 1
    from public.circle_permissions permission
    join public.circle_members member
      on member.id = permission.circle_member_id
    where member.circle_id = participant_privacy_requests.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        permission.can_manage_consents = true
        or permission.can_manage_members = true
        or permission.can_manage_circle = true
      )
  )
)
with check (
  requested_by_user_id = auth.uid()
  or exists (
    select 1
    from public.circle_permissions permission
    join public.circle_members member
      on member.id = permission.circle_member_id
    where member.circle_id = participant_privacy_requests.circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        permission.can_manage_consents = true
        or permission.can_manage_members = true
        or permission.can_manage_circle = true
      )
  )
);

drop policy if exists "privacy requests cannot be deleted"
  on public.participant_privacy_requests;

create policy "privacy requests cannot be deleted"
on public.participant_privacy_requests
for delete to authenticated
using (false);

create or replace function private.sm_audit_privacy_request()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  changed text[] := array[]::text[];
  action_name text := 'insert';
  summary_text text;
begin
  if tg_op = 'UPDATE' then
    action_name := case
      when old.status is distinct from new.status then 'status_change'
      else 'update'
    end;

    if old.status is distinct from new.status then changed := array_append(changed, 'status'); end if;
    if old.assigned_to_user_id is distinct from new.assigned_to_user_id then changed := array_append(changed, 'assigned_to_user_id'); end if;
    if old.due_at is distinct from new.due_at then changed := array_append(changed, 'due_at'); end if;
    if old.outcome_summary is distinct from new.outcome_summary then changed := array_append(changed, 'outcome_summary'); end if;
    if old.refusal_reason is distinct from new.refusal_reason then changed := array_append(changed, 'refusal_reason'); end if;
    if old.identity_verified_at is distinct from new.identity_verified_at then changed := array_append(changed, 'identity_verified_at'); end if;
  end if;

  summary_text := case
    when tg_op = 'INSERT' then 'Privacy rights request submitted: ' || new.request_type
    else 'Privacy rights request updated: ' || new.request_type
  end;

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
    'participant_privacy_request',
    new.id,
    changed,
    summary_text,
    'database_trigger'
  );

  return new;
end;
$$;

drop trigger if exists participant_privacy_requests_audit
  on public.participant_privacy_requests;

create trigger participant_privacy_requests_audit
after insert or update
on public.participant_privacy_requests
for each row execute function private.sm_audit_privacy_request();

commit;