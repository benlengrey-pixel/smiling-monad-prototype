begin;

create table if not exists public.privacy_processors (
  id uuid primary key default gen_random_uuid(),
  processor_name text not null check (char_length(trim(processor_name)) > 0),
  service_purpose text not null check (char_length(trim(service_purpose)) > 0),
  data_categories text[] not null default array[]::text[],
  sensitive_information_processed boolean not null default false,
  hosting_regions text[] not null default array[]::text[],
  cross_border_disclosure boolean not null default false,
  contractual_privacy_terms_confirmed boolean not null default false,
  security_review_completed boolean not null default false,
  deletion_process_confirmed boolean not null default false,
  ai_training_on_customer_data boolean,
  subprocessors_reviewed boolean not null default false,
  risk_level text not null default 'under_review'
    check (
      risk_level in (
        'under_review',
        'low',
        'moderate',
        'high',
        'unacceptable'
      )
    ),
  review_status text not null default 'pending'
    check (
      review_status in (
        'pending',
        'approved',
        'approved_with_conditions',
        'rejected',
        'retired'
      )
    ),
  conditions text not null default '',
  evidence_reference text not null default '',
  next_review_due_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_control_reviews (
  id uuid primary key default gen_random_uuid(),
  control_key text not null,
  control_name text not null,
  control_area text not null check (
    control_area in (
      'access_control',
      'consent',
      'audit',
      'privacy_rights',
      'retention',
      'breach_response',
      'processors',
      'backup_recovery',
      'policy_notice',
      'training'
    )
  ),
  review_status text not null default 'not_reviewed'
    check (
      review_status in (
        'not_reviewed',
        'operating',
        'partially_operating',
        'not_operating',
        'not_applicable'
      )
    ),
  evidence_reference text not null default '',
  findings text not null default '',
  corrective_action text not null default '',
  corrective_action_due_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  next_review_due_at timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(control_key)
);

create index if not exists privacy_processors_review_idx
  on public.privacy_processors(review_status, next_review_due_at);

create index if not exists privacy_control_reviews_status_idx
  on public.privacy_control_reviews(review_status, next_review_due_at);

drop trigger if exists privacy_processors_set_updated_at
  on public.privacy_processors;

create trigger privacy_processors_set_updated_at
before update on public.privacy_processors
for each row execute function private.sm_set_updated_at();

drop trigger if exists privacy_control_reviews_set_updated_at
  on public.privacy_control_reviews;

create trigger privacy_control_reviews_set_updated_at
before update on public.privacy_control_reviews
for each row execute function private.sm_set_updated_at();

alter table public.privacy_processors enable row level security;
alter table public.privacy_control_reviews enable row level security;

create or replace function private.sm_has_privacy_governance_access()
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.circle_members member
    join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.user_id = auth.uid()
      and member.membership_status = 'active'
      and permission.can_manage_circle = true
  );
$$;

revoke all on function private.sm_has_privacy_governance_access() from public;
grant execute on function private.sm_has_privacy_governance_access() to authenticated;

drop policy if exists "privacy processors readable by governance users"
  on public.privacy_processors;

create policy "privacy processors readable by governance users"
on public.privacy_processors
for select to authenticated
using (private.sm_has_privacy_governance_access());

drop policy if exists "privacy processors managed by governance users"
  on public.privacy_processors;

create policy "privacy processors managed by governance users"
on public.privacy_processors
for all to authenticated
using (private.sm_has_privacy_governance_access())
with check (
  private.sm_has_privacy_governance_access()
  and created_by_user_id is not null
);

drop policy if exists "privacy controls readable by governance users"
  on public.privacy_control_reviews;

create policy "privacy controls readable by governance users"
on public.privacy_control_reviews
for select to authenticated
using (private.sm_has_privacy_governance_access());

drop policy if exists "privacy controls managed by governance users"
  on public.privacy_control_reviews;

create policy "privacy controls managed by governance users"
on public.privacy_control_reviews
for all to authenticated
using (private.sm_has_privacy_governance_access())
with check (
  private.sm_has_privacy_governance_access()
  and created_by_user_id is not null
);

insert into public.privacy_control_reviews (
  control_key,
  control_name,
  control_area,
  review_status,
  evidence_reference,
  findings,
  created_by_user_id
)
select
  seed.control_key,
  seed.control_name,
  seed.control_area,
  'not_reviewed',
  seed.evidence_reference,
  '',
  auth.uid()
from (
  values
    ('passkey_access', 'Passkey and device access control', 'access_control', 'Supabase Auth and device registration'),
    ('circle_rls', 'Circle membership and Row Level Security', 'access_control', 'Supabase RLS migrations'),
    ('participant_consent', 'Participant privacy consent', 'consent', 'participant_consents and consent gate'),
    ('audit_history', 'Append-only audit history', 'audit', 'audit_events and audit panel'),
    ('privacy_requests', 'Participant privacy rights requests', 'privacy_rights', 'participant_privacy_requests'),
    ('retention_disposal', 'Retention and secure disposal', 'retention', 'privacy_retention_policies and privacy_disposal_reviews'),
    ('breach_response', 'Privacy breach response', 'breach_response', 'privacy_breach_incidents'),
    ('processor_register', 'Third-party processor register', 'processors', 'privacy_processors'),
    ('backup_recovery', 'Backup, recovery and deletion verification', 'backup_recovery', ''),
    ('privacy_notice', 'Privacy notices and collection statements', 'policy_notice', ''),
    ('privacy_training', 'Privacy training and access reviews', 'training', '')
) as seed(
  control_key,
  control_name,
  control_area,
  evidence_reference
)
where auth.uid() is not null
on conflict (control_key) do nothing;

commit;