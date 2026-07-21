-- ============================================================
-- SMILING MONAD
-- Enable Realtime for Circle Messages
--
-- Adds circle_messages to the Supabase Realtime publication so
-- active Circle members receive new messages without refreshing.
-- ============================================================

begin;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'circle_messages'
  ) then
    alter publication supabase_realtime
      add table public.circle_messages;
  end if;
end;
$$;

commit;