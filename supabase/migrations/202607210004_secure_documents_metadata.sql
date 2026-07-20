-- ============================================================
-- SMILING MONAD
-- Migration 004 — Secure Documents Metadata
--
-- Creates:
--   documents
--
-- Connects document records to the private bucket:
--   sm-circle-files
--
-- Required Storage path:
--   {circle_id}/{participant_id}/{document_id}/{filename}
--
-- Documents are archived rather than deleted through the app.
-- ============================================================

begin;


-- ============================================================
-- 1. DOCUMENTS TABLE
-- ============================================================

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete restrict,

  participant_id uuid not null
    references public.participants(id)
    on delete restrict,

  title text not null,
  description text not null default '',

  category text not null default 'other'
    check (
      category in (
        'plan',
        'agreement',
        'report',
        'meeting',
        'assessment',
        'health',
        'financial',
        'consent',
        'correspondence',
        'other'
      )
    ),

  sensitivity text not null default 'personal'
    check (
      sensitivity in (
        'general',
        'personal',
        'health',
        'financial',
        'restricted'
      )
    ),

  document_status text not null default 'draft'
    check (
      document_status in (
        'draft',
        'current',
        'review_needed',
        'archived'
      )
    ),

  storage_bucket text not null
    default 'sm-circle-files'
    check (
      storage_bucket = 'sm-circle-files'
    ),

  storage_path text not null unique,

  original_filename text not null,
  mime_type text not null default '',

  size_bytes bigint not null default 0
    check (
      size_bytes >= 0
    ),

  consent_required boolean not null default false,

  consent_id uuid
    references public.participant_consents(id)
    on delete restrict,

  review_due_at timestamptz,
  archived_at timestamptz,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  updated_by uuid
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index if not exists
  documents_circle_id_idx
on public.documents(circle_id);


create index if not exists
  documents_participant_id_idx
on public.documents(participant_id);


create index if not exists
  documents_status_idx
on public.documents(document_status);


create index if not exists
  documents_category_idx
on public.documents(category);


create index if not exists
  documents_review_due_at_idx
on public.documents(review_due_at);


create index if not exists
  documents_created_by_idx
on public.documents(created_by);


-- ============================================================
-- 2. UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists
  documents_set_updated_at
on public.documents;


create trigger documents_set_updated_at
before update
on public.documents
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 3. VALIDATE DOCUMENT RECORD
-- ============================================================

create or replace function private.sm_validate_document_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  path_circle_id uuid;
  path_participant_id uuid;
  path_document_id uuid;
begin
  if not exists (
    select 1
    from public.circles circle_record
    where circle_record.id = new.circle_id
      and circle_record.participant_id =
        new.participant_id
  ) then
    raise exception
      'The selected Circle does not belong to this participant';
  end if;


  path_circle_id :=
    private.sm_storage_circle_id(
      new.storage_path
    );

  path_participant_id :=
    private.sm_storage_participant_id(
      new.storage_path
    );

  path_document_id :=
    private.sm_storage_document_id(
      new.storage_path
    );


  if path_circle_id is null
    or path_participant_id is null
    or path_document_id is null
  then
    raise exception
      'Invalid document Storage path';
  end if;


  if path_circle_id <> new.circle_id then
    raise exception
      'Storage path Circle ID does not match document Circle ID';
  end if;


  if path_participant_id <> new.participant_id then
    raise exception
      'Storage path participant ID does not match document participant ID';
  end if;


  if path_document_id <> new.id then
    raise exception
      'Storage path document ID does not match document record ID';
  end if;


  if new.consent_id is not null
    and not exists (
      select 1
      from public.participant_consents consent
      where consent.id = new.consent_id
        and consent.circle_id = new.circle_id
        and consent.participant_id =
          new.participant_id
    )
  then
    raise exception
      'Linked consent does not belong to this participant and Circle';
  end if;


  if new.sensitivity in (
    'health',
    'financial',
    'restricted'
  )
    and new.consent_required = false
  then
    new.consent_required := true;
  end if;


  if new.document_status = 'archived'
    and new.archived_at is null
  then
    new.archived_at := now();
  end if;


  if new.document_status <> 'archived' then
    new.archived_at := null;
  end if;


  return new;
end;
$$;


revoke all
on function private.sm_validate_document_record()
from public;


revoke all
on function private.sm_validate_document_record()
from anon;


drop trigger if exists
  documents_validate_record
on public.documents;


create trigger documents_validate_record
before insert or update
on public.documents
for each row
execute function private.sm_validate_document_record();


-- ============================================================
-- 4. PROTECT DOCUMENT IDENTITY
-- ============================================================

create or replace function private.sm_protect_document_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.circle_id <> old.circle_id
    or new.participant_id <> old.participant_id
    or new.storage_bucket <> old.storage_bucket
    or new.storage_path <> old.storage_path
    or new.created_by <> old.created_by
  then
    raise exception
      'Document identity and Storage location cannot be changed';
  end if;

  return new;
end;
$$;


revoke all
on function private.sm_protect_document_identity()
from public;


revoke all
on function private.sm_protect_document_identity()
from anon;


drop trigger if exists
  documents_protect_identity
on public.documents;


create trigger documents_protect_identity
before update
on public.documents
for each row
execute function private.sm_protect_document_identity();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.documents
  enable row level security;


drop policy if exists
  "Authorised members read documents"
on public.documents;


drop policy if exists
  "Authorised members create documents"
on public.documents;


drop policy if exists
  "Authorised members update documents"
on public.documents;


-- ============================================================
-- 6. READ POLICY
-- ============================================================

create policy
  "Authorised members read documents"
on public.documents
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_documents'
  )
);


-- ============================================================
-- 7. CREATE POLICY
-- ============================================================

create policy
  "Authorised members create documents"
on public.documents
for insert
to authenticated
with check (
  created_by = auth.uid()

  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(
      circle_id,
      'upload_documents'
    )
  )

  and exists (
    select 1
    from public.circles circle_record
    where circle_record.id =
      documents.circle_id
      and circle_record.participant_id =
        documents.participant_id
  )
);


-- ============================================================
-- 8. UPDATE POLICY
-- ============================================================

create policy
  "Authorised members update documents"
on public.documents
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'edit_documents'
  )
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'edit_documents'
  )
);


-- ============================================================
-- 9. DOCUMENT AUDIT HISTORY
-- ============================================================

create or replace function private.sm_record_document_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_field_names text[];
  audit_action text;
begin
  if tg_op = 'INSERT' then
    select coalesce(
      array_agg(
        field_name
        order by field_name
      ),
      array[]::text[]
    )
    into changed_field_names
    from jsonb_object_keys(
      to_jsonb(new)
        - 'created_at'
        - 'updated_at'
    ) as field_name;

    audit_action := 'insert';


  elsif tg_op = 'UPDATE' then
    select coalesce(
      array_agg(
        field_name
        order by field_name
      ),
      array[]::text[]
    )
    into changed_field_names
    from (
      select
        new_fields.key as field_name
      from jsonb_each(
        to_jsonb(new) - 'updated_at'
      ) new_fields
      join jsonb_each(
        to_jsonb(old) - 'updated_at'
      ) old_fields
        on old_fields.key =
          new_fields.key
      where new_fields.value
        is distinct from old_fields.value
    ) changed;

    audit_action :=
      case
        when new.document_status = 'archived'
          and old.document_status <> 'archived'
          then 'archive'

        when new.document_status <>
          old.document_status
          then 'status_change'

        else 'update'
      end;
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
    audit_action,
    'documents',
    new.id,
    changed_field_names,
    'Document metadata changed',
    'database'
  );


  return new;
end;
$$;


revoke all
on function private.sm_record_document_audit()
from public;


revoke all
on function private.sm_record_document_audit()
from anon;


drop trigger if exists
  documents_record_audit
on public.documents;


create trigger documents_record_audit
after insert or update
on public.documents
for each row
execute function private.sm_record_document_audit();


-- ============================================================
-- 10. TABLE PRIVILEGES
--
-- No DELETE permission is granted.
-- Documents are archived using document_status.
-- ============================================================

revoke all
on public.documents
from anon;


revoke all
on public.documents
from authenticated;


grant select, insert, update
on public.documents
to authenticated;


commit;