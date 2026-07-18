-- Smiling Monad training database foundation
-- Run this migration in Supabase before switching the app away from localStorage.

create extension if not exists pgcrypto;

create table if not exists public.sm_training_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('participant', 'worker', 'provider', 'reviewer', 'administrator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sm_training_programs (
  id uuid primary key default gen_random_uuid(),
  program_key text not null,
  version integer not null check (version > 0),
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired')),
  content jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_key, version)
);

create table if not exists public.sm_training_enrolments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.sm_training_programs(id) on delete restrict,
  learner_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by_user_id uuid references auth.users(id) on delete set null,
  circle_id text,
  status text not null default 'invited'
    check (status in (
      'invited',
      'accepted',
      'in-progress',
      'submitted',
      'changes-requested',
      'completed',
      'expired',
      'cancelled'
    )),
  progress jsonb not null default '{}'::jsonb,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (program_id, learner_user_id, circle_id)
);

create table if not exists public.sm_circle_training_modules (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null,
  participant_user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  version integer not null check (version > 0),
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired')),
  content jsonb not null default '{}'::jsonb,
  participant_approval_required boolean not null default true,
  human_review_required boolean not null default false,
  renewal_months integer check (renewal_months is null or renewal_months > 0),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (circle_id, module_key, version)
);

create unique index if not exists sm_one_active_circle_module
  on public.sm_circle_training_modules(circle_id, module_key)
  where status = 'active';

create table if not exists public.sm_circle_training_requirements (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null,
  module_id uuid not null references public.sm_circle_training_modules(id) on delete restrict,
  participant_user_id uuid not null references auth.users(id) on delete cascade,
  learner_user_id uuid not null references auth.users(id) on delete cascade,
  member_display_name text not null,
  audience text not null check (audience in (
    'worker',
    'provider',
    'support-coordinator',
    'therapist',
    'family-member',
    'other-circle-member'
  )),
  status text not null default 'required'
    check (status in (
      'required',
      'in-progress',
      'submitted',
      'changes-requested',
      'completed',
      'waived',
      'expired',
      'removed'
    )),
  responses jsonb not null default '[]'::jsonb,
  acknowledgement_accepted_at timestamptz,
  knowledge_score integer check (
    knowledge_score is null or
    (knowledge_score >= 0 and knowledge_score <= 100)
  ),
  critical_questions_passed boolean,
  participant_decision text
    check (participant_decision is null or participant_decision in (
      'pending',
      'approved',
      'changes-requested'
    )),
  participant_decision_note text not null default '',
  participant_decision_at timestamptz,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_decision text
    check (reviewer_decision is null or reviewer_decision in (
      'pending',
      'satisfactory',
      'changes-requested'
    )),
  reviewer_decision_note text not null default '',
  reviewer_decision_at timestamptz,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (module_id, learner_user_id)
);

create table if not exists public.sm_training_attempts (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid references public.sm_training_enrolments(id) on delete cascade,
  circle_requirement_id uuid references public.sm_circle_training_requirements(id) on delete cascade,
  learner_user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  answers jsonb not null default '[]'::jsonb,
  score integer check (score is null or (score >= 0 and score <= 100)),
  critical_questions_passed boolean,
  integrity_flags jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  constraint sm_training_attempt_parent_check check (
    (enrolment_id is not null and circle_requirement_id is null) or
    (enrolment_id is null and circle_requirement_id is not null)
  )
);

create table if not exists public.sm_training_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  circle_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sm_training_enrolments_learner_idx
  on public.sm_training_enrolments(learner_user_id);

create index if not exists sm_training_enrolments_inviter_idx
  on public.sm_training_enrolments(invited_by_user_id);

create index if not exists sm_circle_modules_participant_idx
  on public.sm_circle_training_modules(participant_user_id);

create index if not exists sm_circle_requirements_learner_idx
  on public.sm_circle_training_requirements(learner_user_id);

create index if not exists sm_circle_requirements_participant_idx
  on public.sm_circle_training_requirements(participant_user_id);

create index if not exists sm_circle_requirements_reviewer_idx
  on public.sm_circle_training_requirements(reviewer_user_id);

create index if not exists sm_training_attempts_learner_idx
  on public.sm_training_attempts(learner_user_id);

create index if not exists sm_training_audit_entity_idx
  on public.sm_training_audit_events(entity_type, entity_id);

create or replace function public.sm_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sm_training_roles_set_updated_at on public.sm_training_roles;
create trigger sm_training_roles_set_updated_at
before update on public.sm_training_roles
for each row execute function public.sm_set_updated_at();

drop trigger if exists sm_training_programs_set_updated_at on public.sm_training_programs;
create trigger sm_training_programs_set_updated_at
before update on public.sm_training_programs
for each row execute function public.sm_set_updated_at();

drop trigger if exists sm_training_enrolments_set_updated_at on public.sm_training_enrolments;
create trigger sm_training_enrolments_set_updated_at
before update on public.sm_training_enrolments
for each row execute function public.sm_set_updated_at();

drop trigger if exists sm_circle_training_modules_set_updated_at on public.sm_circle_training_modules;
create trigger sm_circle_training_modules_set_updated_at
before update on public.sm_circle_training_modules
for each row execute function public.sm_set_updated_at();

drop trigger if exists sm_circle_training_requirements_set_updated_at on public.sm_circle_training_requirements;
create trigger sm_circle_training_requirements_set_updated_at
before update on public.sm_circle_training_requirements
for each row execute function public.sm_set_updated_at();

create or replace function public.sm_has_training_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sm_training_roles
    where user_id = (select auth.uid())
      and role = required_role
  );
$$;

revoke all on function public.sm_has_training_role(text) from public;
grant execute on function public.sm_has_training_role(text) to authenticated;

alter table public.sm_training_roles enable row level security;
alter table public.sm_training_programs enable row level security;
alter table public.sm_training_enrolments enable row level security;
alter table public.sm_circle_training_modules enable row level security;
alter table public.sm_circle_training_requirements enable row level security;
alter table public.sm_training_attempts enable row level security;
alter table public.sm_training_audit_events enable row level security;

drop policy if exists "Users can read their own training role" on public.sm_training_roles;
create policy "Users can read their own training role"
on public.sm_training_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Administrators manage training roles" on public.sm_training_roles;
create policy "Administrators manage training roles"
on public.sm_training_roles
for all
to authenticated
using (public.sm_has_training_role('administrator'))
with check (public.sm_has_training_role('administrator'));

drop policy if exists "Authenticated users read active programs" on public.sm_training_programs;
create policy "Authenticated users read active programs"
on public.sm_training_programs
for select
to authenticated
using (
  status = 'active'
  or created_by = (select auth.uid())
  or public.sm_has_training_role('reviewer')
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Administrators manage training programs" on public.sm_training_programs;
create policy "Administrators manage training programs"
on public.sm_training_programs
for all
to authenticated
using (public.sm_has_training_role('administrator'))
with check (public.sm_has_training_role('administrator'));

drop policy if exists "Learners and inviters read enrolments" on public.sm_training_enrolments;
create policy "Learners and inviters read enrolments"
on public.sm_training_enrolments
for select
to authenticated
using (
  learner_user_id = (select auth.uid())
  or invited_by_user_id = (select auth.uid())
  or public.sm_has_training_role('reviewer')
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Participants create enrolments" on public.sm_training_enrolments;
create policy "Participants create enrolments"
on public.sm_training_enrolments
for insert
to authenticated
with check (
  invited_by_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Learners and inviters update enrolments" on public.sm_training_enrolments;
create policy "Learners and inviters update enrolments"
on public.sm_training_enrolments
for update
to authenticated
using (
  learner_user_id = (select auth.uid())
  or invited_by_user_id = (select auth.uid())
  or public.sm_has_training_role('reviewer')
  or public.sm_has_training_role('administrator')
)
with check (
  learner_user_id = learner_user_id
);

drop policy if exists "Participants read their Circle modules" on public.sm_circle_training_modules;
create policy "Participants read their Circle modules"
on public.sm_circle_training_modules
for select
to authenticated
using (
  participant_user_id = (select auth.uid())
  or exists (
    select 1
    from public.sm_circle_training_requirements requirement
    where requirement.module_id = sm_circle_training_modules.id
      and requirement.learner_user_id = (select auth.uid())
      and requirement.status not in ('removed', 'expired')
  )
  or public.sm_has_training_role('reviewer')
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Participants manage their Circle modules" on public.sm_circle_training_modules;
create policy "Participants manage their Circle modules"
on public.sm_circle_training_modules
for all
to authenticated
using (
  participant_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
)
with check (
  participant_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Authorised users read Circle requirements" on public.sm_circle_training_requirements;
create policy "Authorised users read Circle requirements"
on public.sm_circle_training_requirements
for select
to authenticated
using (
  learner_user_id = (select auth.uid())
  or participant_user_id = (select auth.uid())
  or reviewer_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Participants assign Circle requirements" on public.sm_circle_training_requirements;
create policy "Participants assign Circle requirements"
on public.sm_circle_training_requirements
for insert
to authenticated
with check (
  participant_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
);

drop policy if exists "Authorised users update Circle requirements" on public.sm_circle_training_requirements;
create policy "Authorised users update Circle requirements"
on public.sm_circle_training_requirements
for update
to authenticated
using (
  learner_user_id = (select auth.uid())
  or participant_user_id = (select auth.uid())
  or reviewer_user_id = (select auth.uid())
  or public.sm_has_training_role('administrator')
)
with check (
  participant_user_id = participant_user_id
  and learner_user_id = learner_user_id
  and module_id = module_id
);

drop policy if exists "Learners and reviewers read attempts" on public.sm_training_attempts;
create policy "Learners and reviewers read attempts"
on public.sm_training_attempts
for select
to authenticated
using (
  learner_user_id = (select auth.uid())
  or public.sm_has_training_role('reviewer')
  or public.sm_has_training_role('administrator')
  or exists (
    select 1
    from public.sm_circle_training_requirements requirement
    where requirement.id = sm_training_attempts.circle_requirement_id
      and requirement.participant_user_id = (select auth.uid())
  )
);

drop policy if exists "Learners create their own attempts" on public.sm_training_attempts;
create policy "Learners create their own attempts"
on public.sm_training_attempts
for insert
to authenticated
with check (learner_user_id = (select auth.uid()));

drop policy if exists "Administrators read audit events" on public.sm_training_audit_events;
create policy "Administrators read audit events"
on public.sm_training_audit_events
for select
to authenticated
using (
  public.sm_has_training_role('administrator')
  or actor_user_id = (select auth.uid())
);

-- No update or delete policies are intentionally created for attempts or audit events.
-- They are append-only through the authenticated API.