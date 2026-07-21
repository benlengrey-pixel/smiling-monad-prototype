begin;

do $$
declare
  table_name text;
  protected_tables text[] := array[
    'participants','circles','circle_members','circle_permissions',
    'participant_consents','audit_events','documents','circle_goals',
    'circle_meetings','circle_responsibilities','circle_budget_items'
  ];
begin
  foreach table_name in array protected_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists sm_require_aal2 on public.%I', table_name);
      execute format(
        'create policy sm_require_aal2 on public.%I as restrictive for all to authenticated using ((select auth.jwt()->>''aal'') = ''aal2'') with check ((select auth.jwt()->>''aal'') = ''aal2'')',
        table_name
      );
    end if;
  end loop;
end
$$;

drop policy if exists sm_circle_files_require_aal2 on storage.objects;

create policy sm_circle_files_require_aal2
on storage.objects
as restrictive
for all
to authenticated
using (
  bucket_id <> 'sm-circle-files'
  or (select auth.jwt()->>'aal') = 'aal2'
)
with check (
  bucket_id <> 'sm-circle-files'
  or (select auth.jwt()->>'aal') = 'aal2'
);

commit;