-- ============================================================
-- SMILING MONAD
-- Migration 003 — Secure Circle Storage
--
-- Required private bucket:
--   sm-circle-files
--
-- Required object path:
--   {circle_id}/{participant_id}/{document_id}/{filename}
--
-- This migration protects files using Circle membership and
-- document permissions. The bucket must remain private.
-- ============================================================

begin;


-- ============================================================
-- 1. VERIFY PRIVATE BUCKET
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'sm-circle-files'
      and public = false
  ) then
    raise exception
      'Create the private Storage bucket sm-circle-files before running this migration';
  end if;
end;
$$;


-- ============================================================
-- 2. SAFE UUID PARSER
-- ============================================================

create or replace function private.sm_safe_uuid(
  input_value text
)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if input_value is null
    or length(trim(input_value)) = 0
  then
    return null;
  end if;

  return input_value::uuid;

exception
  when invalid_text_representation then
    return null;
end;
$$;


revoke all
on function private.sm_safe_uuid(text)
from public;

revoke all
on function private.sm_safe_uuid(text)
from anon;

grant execute
on function private.sm_safe_uuid(text)
to authenticated;


-- ============================================================
-- 3. READ IDS FROM STORAGE PATH
--
-- Path:
--   circle_id / participant_id / document_id / filename
-- ============================================================

create or replace function private.sm_storage_circle_id(
  object_name text
)
returns uuid
language sql
immutable
security invoker
set search_path = ''
as $$
  select private.sm_safe_uuid(
    (storage.foldername(object_name))[1]
  );
$$;


create or replace function private.sm_storage_participant_id(
  object_name text
)
returns uuid
language sql
immutable
security invoker
set search_path = ''
as $$
  select private.sm_safe_uuid(
    (storage.foldername(object_name))[2]
  );
$$;


create or replace function private.sm_storage_document_id(
  object_name text
)
returns uuid
language sql
immutable
security invoker
set search_path = ''
as $$
  select private.sm_safe_uuid(
    (storage.foldername(object_name))[3]
  );
$$;


revoke all
on function private.sm_storage_circle_id(text)
from public;

revoke all
on function private.sm_storage_circle_id(text)
from anon;

revoke all
on function private.sm_storage_participant_id(text)
from public;

revoke all
on function private.sm_storage_participant_id(text)
from anon;

revoke all
on function private.sm_storage_document_id(text)
from public;

revoke all
on function private.sm_storage_document_id(text)
from anon;


grant execute
on function private.sm_storage_circle_id(text)
to authenticated;

grant execute
on function private.sm_storage_participant_id(text)
to authenticated;

grant execute
on function private.sm_storage_document_id(text)
to authenticated;


-- ============================================================
-- 4. VALIDATE STORAGE PATH
-- ============================================================

create or replace function private.sm_storage_path_is_valid(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circles circle_record
    where circle_record.id =
      private.sm_storage_circle_id(object_name)

      and circle_record.participant_id =
        private.sm_storage_participant_id(object_name)

      and private.sm_storage_document_id(object_name)
        is not null
  );
$$;


revoke all
on function private.sm_storage_path_is_valid(text)
from public;

revoke all
on function private.sm_storage_path_is_valid(text)
from anon;

grant execute
on function private.sm_storage_path_is_valid(text)
to authenticated;


-- ============================================================
-- 5. STORAGE ACCESS HELPERS
-- ============================================================

create or replace function private.sm_can_read_circle_file(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.sm_storage_path_is_valid(object_name)
    and (
      private.sm_is_circle_creator(
        private.sm_storage_circle_id(object_name)
      )
      or private.sm_has_circle_permission(
        private.sm_storage_circle_id(object_name),
        'view_documents'
      )
    );
$$;


create or replace function private.sm_can_upload_circle_file(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.sm_storage_path_is_valid(object_name)
    and (
      private.sm_is_circle_creator(
        private.sm_storage_circle_id(object_name)
      )
      or private.sm_has_circle_permission(
        private.sm_storage_circle_id(object_name),
        'upload_documents'
      )
    );
$$;


create or replace function private.sm_can_manage_circle_file(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.sm_storage_path_is_valid(object_name)
    and (
      private.sm_is_circle_creator(
        private.sm_storage_circle_id(object_name)
      )
      or private.sm_has_circle_permission(
        private.sm_storage_circle_id(object_name),
        'edit_documents'
      )
    );
$$;


revoke all
on function private.sm_can_read_circle_file(text)
from public;

revoke all
on function private.sm_can_read_circle_file(text)
from anon;

revoke all
on function private.sm_can_upload_circle_file(text)
from public;

revoke all
on function private.sm_can_upload_circle_file(text)
from anon;

revoke all
on function private.sm_can_manage_circle_file(text)
from public;

revoke all
on function private.sm_can_manage_circle_file(text)
from anon;


grant execute
on function private.sm_can_read_circle_file(text)
to authenticated;

grant execute
on function private.sm_can_upload_circle_file(text)
to authenticated;

grant execute
on function private.sm_can_manage_circle_file(text)
to authenticated;


-- ============================================================
-- 6. REMOVE REPLACEABLE POLICIES
-- ============================================================

drop policy if exists
  "Authorised members read Circle files"
on storage.objects;

drop policy if exists
  "Authorised members upload Circle files"
on storage.objects;

drop policy if exists
  "Authorised members update Circle files"
on storage.objects;

drop policy if exists
  "Authorised members delete Circle files"
on storage.objects;


-- ============================================================
-- 7. READ POLICY
-- ============================================================

create policy
  "Authorised members read Circle files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sm-circle-files'
  and private.sm_can_read_circle_file(name)
);


-- ============================================================
-- 8. UPLOAD POLICY
-- ============================================================

create policy
  "Authorised members upload Circle files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sm-circle-files'
  and owner_id = auth.uid()::text
  and private.sm_can_upload_circle_file(name)
);


-- ============================================================
-- 9. UPDATE OR REPLACE POLICY
-- ============================================================

create policy
  "Authorised members update Circle files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sm-circle-files'
  and private.sm_can_manage_circle_file(name)
)
with check (
  bucket_id = 'sm-circle-files'
  and private.sm_can_manage_circle_file(name)
);


-- ============================================================
-- 10. DELETE POLICY
-- ============================================================

create policy
  "Authorised members delete Circle files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sm-circle-files'
  and private.sm_can_manage_circle_file(name)
);


commit;