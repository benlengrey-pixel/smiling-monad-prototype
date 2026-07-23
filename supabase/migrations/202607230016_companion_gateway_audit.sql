begin;

create table if not exists
  public.companion_gateway_audit_events (
    id bigint
      generated always as identity
      primary key,

    user_id uuid
      not null
      references auth.users(id)
      on delete cascade,

    event_type text
      not null
      check (
        event_type in (
          'request_started',
          'request_completed',
          'request_failed',
          'rate_limited'
        )
      ),

    outcome text
      not null
      check (
        outcome in (
          'allowed',
          'completed',
          'failed',
          'blocked'
        )
      ),

    status_code integer
      null
      check (
        status_code is null
        or (
          status_code >= 100
          and status_code <= 599
        )
      ),

    model_name text
      null
      check (
        model_name is null
        or char_length(
          model_name
        ) between 1 and 120
      ),

    created_at timestamptz
      not null
      default now()
  );

alter table
  public.companion_gateway_audit_events
enable row level security;

revoke all
on table
  public.companion_gateway_audit_events
from public;

revoke all
on table
  public.companion_gateway_audit_events
from anon;

revoke all
on table
  public.companion_gateway_audit_events
from authenticated;

create index if not exists
  companion_gateway_audit_user_created_idx
on
  public.companion_gateway_audit_events (
    user_id,
    created_at desc
  );

create index if not exists
  companion_gateway_audit_created_idx
on
  public.companion_gateway_audit_events (
    created_at desc
  );

create or replace function
  public.sm_record_companion_gateway_event(
    p_event_type text,
    p_outcome text,
    p_status_code integer default null,
    p_model_name text default null
  )
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_event_id bigint;
  v_event_type text;
  v_outcome text;
  v_model_name text;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication is required.'
      using errcode = '42501';
  end if;

  v_event_type :=
    lower(
      trim(
        coalesce(
          p_event_type,
          ''
        )
      )
    );

  v_outcome :=
    lower(
      trim(
        coalesce(
          p_outcome,
          ''
        )
      )
    );

  if
    v_event_type not in (
      'request_started',
      'request_completed',
      'request_failed',
      'rate_limited'
    )
  then
    raise exception
      'Invalid Companion event type.'
      using errcode = '22023';
  end if;

  if
    v_outcome not in (
      'allowed',
      'completed',
      'failed',
      'blocked'
    )
  then
    raise exception
      'Invalid Companion outcome.'
      using errcode = '22023';
  end if;

  if
    p_status_code is not null
    and (
      p_status_code < 100
      or p_status_code > 599
    )
  then
    raise exception
      'Invalid HTTP status code.'
      using errcode = '22023';
  end if;

  v_model_name :=
    nullif(
      left(
        trim(
          coalesce(
            p_model_name,
            ''
          )
        ),
        120
      ),
      ''
    );

  insert into
    public.companion_gateway_audit_events (
      user_id,
      event_type,
      outcome,
      status_code,
      model_name
    )
  values (
    v_user_id,
    v_event_type,
    v_outcome,
    p_status_code,
    v_model_name
  )
  returning
    id
  into
    v_event_id;

  return
    v_event_id;
end;
$$;

revoke all
on function
  public.sm_record_companion_gateway_event(
    text,
    text,
    integer,
    text
  )
from public;

revoke all
on function
  public.sm_record_companion_gateway_event(
    text,
    text,
    integer,
    text
  )
from anon;

grant execute
on function
  public.sm_record_companion_gateway_event(
    text,
    text,
    integer,
    text
  )
to authenticated;

comment on table
  public.companion_gateway_audit_events
is
  'Privacy-minimised Companion security audit records. This table never stores prompts, conversation text, participant information, memory, documents or AI responses.';

comment on function
  public.sm_record_companion_gateway_event(
    text,
    text,
    integer,
    text
  )
is
  'Records a minimal authenticated Companion gateway event without storing user content.';

commit;