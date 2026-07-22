begin;

-- Passkeys are phishing-resistant authentication credentials,
-- but Supabase does not currently represent a passkey session
-- as AAL2. The earlier restrictive AAL2 policies therefore
-- blocked valid passkey-authenticated Circle members.
--
-- Existing table-specific RLS policies continue to enforce
-- authenticated user, Circle membership, role and ownership
-- rules after these blanket AAL2 policies are removed.

do $$
declare
  table_name text;
  protected_tables text[] := array[
    'participants',
    'circles',
    'circle_members',
    'circle_permissions',
    'participant_consents',
    'audit_events',
    'documents',
    'circle_goals',
    'circle_meetings',
    'circle_responsibilities',
    'circle_budget_items'
  ];
begin
  foreach table_name in array protected_tables loop
    if to_regclass(
      format('public.%I', table_name)
    ) is not null then
      execute format(
        'drop policy if exists sm_require_aal2 on public.%I',
        table_name
      );
    end if;
  end loop;
end
$$;

drop policy if exists
  sm_circle_files_require_aal2
on storage.objects;

commit;