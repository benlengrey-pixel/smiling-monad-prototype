begin;

create or replace function
  public.sm_cleanup_companion_security_records(
    p_audit_retention_days integer default 90,
    p_rate_limit_retention_hours integer default 24
  )
returns table (
  deleted_audit_events bigint,
  deleted_rate_limit_rows bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted_audit_events bigint;
  v_deleted_rate_limit_rows bigint;
begin
  if
    p_audit_retention_days < 7
    or p_audit_retention_days > 365
  then
    raise exception
      'Audit retention must be between 7 and 365 days.'
      using errcode = '22023';
  end if;

  if
    p_rate_limit_retention_hours < 1
    or p_rate_limit_retention_hours > 168
  then
    raise exception
      'Rate-limit retention must be between 1 and 168 hours.'
      using errcode = '22023';
  end if;

  delete from
    public.companion_gateway_audit_events
  where
    created_at <
      clock_timestamp() -
      make_interval(
        days =>
          p_audit_retention_days
      );

  get diagnostics
    v_deleted_audit_events =
      row_count;

  delete from
    public.companion_gateway_rate_limits
  where
    updated_at <
      clock_timestamp() -
      make_interval(
        hours =>
          p_rate_limit_retention_hours
      );

  get diagnostics
    v_deleted_rate_limit_rows =
      row_count;

  return query
  select
    v_deleted_audit_events,
    v_deleted_rate_limit_rows;
end;
$$;

revoke all
on function
  public.sm_cleanup_companion_security_records(
    integer,
    integer
  )
from public;

revoke all
on function
  public.sm_cleanup_companion_security_records(
    integer,
    integer
  )
from anon;

revoke all
on function
  public.sm_cleanup_companion_security_records(
    integer,
    integer
  )
from authenticated;

grant execute
on function
  public.sm_cleanup_companion_security_records(
    integer,
    integer
  )
to service_role;

comment on function
  public.sm_cleanup_companion_security_records(
    integer,
    integer
  )
is
  'Deletes expired Companion audit and rate-limit records. It does not access or store prompts, conversations, participant information, documents, memory or AI responses.';

commit;