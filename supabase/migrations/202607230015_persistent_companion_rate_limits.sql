begin;

create table if not exists
  public.companion_gateway_rate_limits (
    user_id uuid primary key
      references auth.users(id)
      on delete cascade,

    window_started_at timestamptz
      not null
      default now(),

    request_count integer
      not null
      default 0
      check (request_count >= 0),

    updated_at timestamptz
      not null
      default now()
  );

alter table
  public.companion_gateway_rate_limits
enable row level security;

revoke all
on table
  public.companion_gateway_rate_limits
from public;

revoke all
on table
  public.companion_gateway_rate_limits
from anon;

revoke all
on table
  public.companion_gateway_rate_limits
from authenticated;

create or replace function
  public.sm_enforce_companion_gateway_rate_limit(
    p_limit integer default 30,
    p_window_seconds integer default 60
  )
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining_requests integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_now timestamptz;
  v_window_started_at timestamptz;
  v_request_count integer;
  v_retry_after integer;
begin
  v_user_id := auth.uid();
  v_now := clock_timestamp();

  if v_user_id is null then
    raise exception
      'Authentication is required.'
      using errcode = '42501';
  end if;

  if
    p_limit < 1
    or p_limit > 300
  then
    raise exception
      'Rate limit must be between 1 and 300.'
      using errcode = '22023';
  end if;

  if
    p_window_seconds < 1
    or p_window_seconds > 3600
  then
    raise exception
      'Rate-limit window must be between 1 and 3600 seconds.'
      using errcode = '22023';
  end if;

  insert into
    public.companion_gateway_rate_limits (
      user_id,
      window_started_at,
      request_count,
      updated_at
    )
  values (
    v_user_id,
    v_now,
    0,
    v_now
  )
  on conflict (user_id)
  do nothing;

  select
    rate_limit.window_started_at,
    rate_limit.request_count
  into
    v_window_started_at,
    v_request_count
  from
    public.companion_gateway_rate_limits
      as rate_limit
  where
    rate_limit.user_id =
      v_user_id
  for update;

  if
    v_window_started_at +
      make_interval(
        secs => p_window_seconds
      ) <= v_now
  then
    update
      public.companion_gateway_rate_limits
    set
      window_started_at = v_now,
      request_count = 1,
      updated_at = v_now
    where
      user_id = v_user_id;

    return query
    select
      true,
      0,
      greatest(
        p_limit - 1,
        0
      );

    return;
  end if;

  if
    v_request_count >=
      p_limit
  then
    v_retry_after :=
      greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_window_started_at +
              make_interval(
                secs =>
                  p_window_seconds
              ) -
              v_now
            )
          )
        )::integer
      );

    return query
    select
      false,
      v_retry_after,
      0;

    return;
  end if;

  update
    public.companion_gateway_rate_limits
  set
    request_count =
      request_count + 1,
    updated_at = v_now
  where
    user_id = v_user_id
  returning
    request_count
  into
    v_request_count;

  return query
  select
    true,
    0,
    greatest(
      p_limit -
        v_request_count,
      0
    );
end;
$$;

revoke all
on function
  public.sm_enforce_companion_gateway_rate_limit(
    integer,
    integer
  )
from public;

revoke all
on function
  public.sm_enforce_companion_gateway_rate_limit(
    integer,
    integer
  )
from anon;

grant execute
on function
  public.sm_enforce_companion_gateway_rate_limit(
    integer,
    integer
  )
to authenticated;

comment on table
  public.companion_gateway_rate_limits
is
  'Stores only per-user Companion request counters. It does not store prompts, conversations, participant information or AI responses.';

comment on function
  public.sm_enforce_companion_gateway_rate_limit(
    integer,
    integer
  )
is
  'Atomically enforces a Companion request limit using the authenticated Supabase user identity.';

commit;