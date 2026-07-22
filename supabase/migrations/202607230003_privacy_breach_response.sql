begin;

create table if not exists public.privacy_breach_incidents (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  reported_by_user_id uuid not null references auth.users(id) on delete restrict,

  title text not null check (char_length(trim(title)) > 0),
  description text not null check (char_length(trim(description)) > 0),

  breach_type text not null check (
    breach_type in (
      'unauthorised_access',
      'unauthorised_disclosure',
      'loss',
      'misuse',
      'system_compromise',
      'credential_compromise',
      'other'
    )
  ),

  severity text not null default 'under_assessment' check (
    severity in (
      'under_assessment',
      'low',
      'moderate',
      'high',
      'critical'
    )
  ),

  status text not null default 'reported' check (
    status in (
      'reported',
      'contained',
      'assessing',
      'notifiable',
      'not_notifiable',
      'notifications_in_progress',
      'resolved',
      'closed'
    )
  ),

  occurred_at timestamptz,
  discovered_at timestamptz not null default now(),
  contained_at timestamptz,
  resolved_at timestamptz,

  information_types text[] not null default array[]::text[],
  affected_people_count integer not null default 0
    check (affected_people_count >= 0),

  containment_actions text not null default '',
  risk_assessment text not null default '',
  remedial_actions text not null default '',

  likely_serious_harm boolean,
  oaic_notification_required boolean,
  ndis_commission_notification_required boolean,
  participant_notification_required boolean,

  oaic_notified_at timestamptz,
  ndis_commission_notified_at timestamptz,
  participant_notified_at timestamptz,

  assigned_to_user_id uuid references auth.users(id) on delete set null,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  evidence_reference text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists privacy_breach_incidents_circle_idx
  on public.privacy_breach_incidents(circle_id, created_at desc);

create index if not exists privacy_breach_incidents_status_idx
  on public.privacy_breach_incidents(status, discovered_at desc);

create index if not exists privacy_breach_incidents_severity_idx
  on public.privacy_breach_incidents(severity, discovered_at desc);

drop trigger if exists privacy_breach_incidents_set_updated_at
  on public.privacy_breach_incidents;

create trigger privacy_breach_incidents_set_updated_at
before update on public.privacy_breach_incidents
for each row execute function private.sm_set_updated_at();

alter table public.privacy_breach_incidents enable row level security;

drop policy if exists "breach incidents readable by authorised circle managers"
  on public.privacy_breach_incidents;

create policy "breach incidents readable by authorised circle managers"
on public.privacy_breach_incidents
for select to authenticated
using (
  (
    circle_id is not null
    and exists (
      select 1
      from public.circle_members member
      join public.circle_permissions permission
        on permission.circle_member_id = member.id
      where member.circle_id = privacy_breach_incidents.circle_id
        and member.user_id = auth.uid()
        and member.membership_status = 'active'
        and (
          permission.can_manage_consents = true
          or permission.can_manage_circle = true
          or permission.can_view_sensitive_information = true
        )
    )
  )
  or reported_by_user_id = auth.uid()
);

drop policy if exists "breach incidents can be reported by authenticated users"
  on public.privacy_breach_incidents;

create policy "breach incidents can be reported by authenticated users"
on public.privacy_breach_incidents
for insert to authenticated
with check (
  reported_by_user_id = auth.uid()
  and (
    circle_id is null
    or exists (
      select 1
      from public.circle_members member
      where member.circle_id = privacy_breach_incidents.circle_id
        and member.user_id = auth.uid()
        and member.membership_status = 'active'
    )
  )
);

drop policy if exists "breach incidents manageable by authorised circle managers"
  on public.privacy_breach_incidents;

create policy "breach incidents manageable by authorised circle managers"
on public.privacy_breach_incidents
for update to authenticated
using (
  reported_by_user_id = auth.uid()
  or (
    circle_id is not null
    and exists (
      select 1
      from public.circle_members member
      join public.circle_permissions permission
        on permission.circle_member_id = member.id
      where member.circle_id = privacy_breach_incidents.circle_id
        and member.user_id = auth.uid()
        and member.membership_status = 'active'
        and (
          permission.can_manage_consents = true
          or permission.can_manage_circle = true
        )
    )
  )
)
with check (
  reported_by_user_id = auth.uid()
  or (
    circle_id is not null
    and exists (
      select 1
      from public.circle_members member
      join public.circle_permissions permission
        on permission.circle_member_id = member.id
      where member.circle_id = privacy_breach_incidents.circle_id
        and member.user_id = auth.uid()
        and member.membership_status = 'active'
        and (
          permission.can_manage_consents = true
          or permission.can_manage_circle = true
        )
    )
  )
);

drop policy if exists "breach incidents cannot be deleted"
  on public.privacy_breach_incidents;

create policy "breach incidents cannot be deleted"
on public.privacy_breach_incidents
for delete to authenticated
using (false);

create or replace function private.sm_audit_privacy_breach_incident()
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
      when old.status is distinct from new.status then 'status_change'
      else 'update'
    end;

    if old.status is distinct from new.status then
      changed := array_append(changed, 'status');
    end if;

    if old.severity is distinct from new.severity then
      changed := array_append(changed, 'severity');
    end if;

    if old.containment_actions is distinct from new.containment_actions then
      changed := array_append(changed, 'containment_actions');
    end if;

    if old.risk_assessment is distinct from new.risk_assessment then
      changed := array_append(changed, 'risk_assessment');
    end if;

    if old.remedial_actions is distinct from new.remedial_actions then
      changed := array_append(changed, 'remedial_actions');
    end if;

    if old.oaic_notification_required is distinct from new.oaic_notification_required then
      changed := array_append(changed, 'oaic_notification_required');
    end if;

    if old.ndis_commission_notification_required is distinct from new.ndis_commission_notification_required then
      changed := array_append(changed, 'ndis_commission_notification_required');
    end if;

    if old.participant_notification_required is distinct from new.participant_notification_required then
      changed := array_append(changed, 'participant_notification_required');
    end if;
  end if;

  if new.circle_id is not null then
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
      'privacy_breach_incident',
      new.id,
      changed,
      case
        when tg_op = 'INSERT'
          then 'Privacy breach incident reported'
        else
          'Privacy breach incident updated: ' || new.status
      end,
      'database_trigger'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists privacy_breach_incidents_audit
  on public.privacy_breach_incidents;

create trigger privacy_breach_incidents_audit
after insert or update
on public.privacy_breach_incidents
for each row execute function private.sm_audit_privacy_breach_incident();

commit;