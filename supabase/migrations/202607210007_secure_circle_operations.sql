-- ============================================================
-- SMILING MONAD
-- Migration 007 — Secure Circle Operations
--
-- Creates secure operational records for:
--   • member invitations and membership administration
--   • meetings
--   • responsibilities
--   • budgets
--
-- Existing circle_members and circle_permissions remain the
-- source of truth for membership and access.
-- ============================================================

begin;

-- ============================================================
-- 1. MEETINGS
-- ============================================================

create table if not exists public.circle_meetings (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  title text not null,
  meeting_date date,
  purpose text not null default '',
  meeting_status text not null default 'planned'
    check (meeting_status in ('planned','completed','cancelled','archived')),
  notes text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists circle_meetings_circle_id_idx
  on public.circle_meetings(circle_id);
create index if not exists circle_meetings_date_idx
  on public.circle_meetings(meeting_date);

drop trigger if exists circle_meetings_set_updated_at
  on public.circle_meetings;
create trigger circle_meetings_set_updated_at
before update on public.circle_meetings
for each row execute function private.sm_set_updated_at();

-- ============================================================
-- 2. RESPONSIBILITIES
-- ============================================================

create table if not exists public.circle_responsibilities (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  title text not null,
  owner_name text not null default '',
  responsibility_status text not null default 'open'
    check (responsibility_status in ('open','in_progress','complete','archived')),
  due_date date,
  notes text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists circle_responsibilities_circle_id_idx
  on public.circle_responsibilities(circle_id);
create index if not exists circle_responsibilities_status_idx
  on public.circle_responsibilities(responsibility_status);

drop trigger if exists circle_responsibilities_set_updated_at
  on public.circle_responsibilities;
create trigger circle_responsibilities_set_updated_at
before update on public.circle_responsibilities
for each row execute function private.sm_set_updated_at();

-- ============================================================
-- 3. BUDGETS
-- ============================================================

create table if not exists public.circle_budget_items (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  title text not null,
  category text not null default 'other'
    check (category in ('core','capacity_building','capital','other')),
  allocated numeric(14,2) not null default 0 check (allocated >= 0),
  spent numeric(14,2) not null default 0 check (spent >= 0),
  owner_name text not null default '',
  budget_status text not null default 'active'
    check (budget_status in ('active','review_needed','closed','archived')),
  notes text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists circle_budget_items_circle_id_idx
  on public.circle_budget_items(circle_id);
create index if not exists circle_budget_items_status_idx
  on public.circle_budget_items(budget_status);

drop trigger if exists circle_budget_items_set_updated_at
  on public.circle_budget_items;
create trigger circle_budget_items_set_updated_at
before update on public.circle_budget_items
for each row execute function private.sm_set_updated_at();

-- ============================================================
-- 4. SHARED VALIDATION
-- ============================================================

create or replace function private.sm_validate_circle_operation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(trim(new.title)) = 0 then
    raise exception 'A title is required';
  end if;

  if not exists (
    select 1
    from public.circles c
    where c.id = new.circle_id
      and c.participant_id = new.participant_id
  ) then
    raise exception 'The Circle does not belong to this participant';
  end if;

  if tg_table_name = 'circle_meetings' then
    if new.meeting_status = 'archived' and new.archived_at is null then
      new.archived_at := now();
    elsif new.meeting_status <> 'archived' then
      new.archived_at := null;
    end if;
  elsif tg_table_name = 'circle_responsibilities' then
    if new.responsibility_status = 'archived' and new.archived_at is null then
      new.archived_at := now();
    elsif new.responsibility_status <> 'archived' then
      new.archived_at := null;
    end if;
  elsif tg_table_name = 'circle_budget_items' then
    if new.budget_status = 'archived' and new.archived_at is null then
      new.archived_at := now();
    elsif new.budget_status <> 'archived' then
      new.archived_at := null;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.sm_validate_circle_operation()
  from public, anon;

drop trigger if exists circle_meetings_validate
  on public.circle_meetings;
create trigger circle_meetings_validate
before insert or update on public.circle_meetings
for each row execute function private.sm_validate_circle_operation();

drop trigger if exists circle_responsibilities_validate
  on public.circle_responsibilities;
create trigger circle_responsibilities_validate
before insert or update on public.circle_responsibilities
for each row execute function private.sm_validate_circle_operation();

drop trigger if exists circle_budget_items_validate
  on public.circle_budget_items;
create trigger circle_budget_items_validate
before insert or update on public.circle_budget_items
for each row execute function private.sm_validate_circle_operation();

-- ============================================================
-- 5. RLS
-- ============================================================

alter table public.circle_meetings enable row level security;
alter table public.circle_responsibilities enable row level security;
alter table public.circle_budget_items enable row level security;

drop policy if exists "Authorised members read meetings" on public.circle_meetings;
drop policy if exists "Authorised members create meetings" on public.circle_meetings;
drop policy if exists "Authorised members update meetings" on public.circle_meetings;

create policy "Authorised members read meetings"
on public.circle_meetings for select to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'view_meetings')
);

create policy "Authorised members create meetings"
on public.circle_meetings for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(circle_id, 'manage_meetings')
  )
);

create policy "Authorised members update meetings"
on public.circle_meetings for update to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'manage_meetings')
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'manage_meetings')
);

drop policy if exists "Authorised members read responsibilities" on public.circle_responsibilities;
drop policy if exists "Authorised members create responsibilities" on public.circle_responsibilities;
drop policy if exists "Authorised members update responsibilities" on public.circle_responsibilities;

create policy "Authorised members read responsibilities"
on public.circle_responsibilities for select to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'view_responsibilities')
);

create policy "Authorised members create responsibilities"
on public.circle_responsibilities for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(circle_id, 'edit_responsibilities')
  )
);

create policy "Authorised members update responsibilities"
on public.circle_responsibilities for update to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'edit_responsibilities')
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'edit_responsibilities')
);

drop policy if exists "Authorised members read budgets" on public.circle_budget_items;
drop policy if exists "Authorised members create budgets" on public.circle_budget_items;
drop policy if exists "Authorised members update budgets" on public.circle_budget_items;

create policy "Authorised members read budgets"
on public.circle_budget_items for select to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'view_budget')
);

create policy "Authorised members create budgets"
on public.circle_budget_items for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(circle_id, 'edit_budget')
  )
);

create policy "Authorised members update budgets"
on public.circle_budget_items for update to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'edit_budget')
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'edit_budget')
);

-- Existing membership tables: strengthen invitation/update policies.
drop policy if exists "Circle managers invite members" on public.circle_members;
create policy "Circle managers invite members"
on public.circle_members for insert to authenticated
with check (
  invited_by = auth.uid()
  and private.sm_has_circle_permission(circle_id, 'manage_members')
);

drop policy if exists "Circle managers update memberships" on public.circle_members;
create policy "Circle managers update memberships"
on public.circle_members for update to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'manage_members')
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(circle_id, 'manage_members')
);

-- ============================================================
-- 6. AUDIT TRIGGERS
-- ============================================================

drop trigger if exists circle_meetings_record_audit on public.circle_meetings;
create trigger circle_meetings_record_audit
after insert or update on public.circle_meetings
for each row execute function private.sm_record_audit_event();

drop trigger if exists circle_responsibilities_record_audit on public.circle_responsibilities;
create trigger circle_responsibilities_record_audit
after insert or update on public.circle_responsibilities
for each row execute function private.sm_record_audit_event();

drop trigger if exists circle_budget_items_record_audit on public.circle_budget_items;
create trigger circle_budget_items_record_audit
after insert or update on public.circle_budget_items
for each row execute function private.sm_record_audit_event();

-- ============================================================
-- 7. PRIVILEGES
-- ============================================================

revoke all on public.circle_meetings from anon, authenticated;
revoke all on public.circle_responsibilities from anon, authenticated;
revoke all on public.circle_budget_items from anon, authenticated;

grant select, insert, update on public.circle_meetings to authenticated;
grant select, insert, update on public.circle_responsibilities to authenticated;
grant select, insert, update on public.circle_budget_items to authenticated;

commit;