-- Smiling Monad user profiles, access control and administrator bootstrap.
-- This migration intentionally does not modify Kimi, the Companion gateway,
-- tool execution, permissions or tool-selection logic.

create table if not exists public.user_profiles (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text not null default '',
  display_name text not null default '',
  role text not null default 'community-member'
    check (
      role in (
        'participant',
        'family',
        'support-worker',
        'provider',
        'professional',
        'community-member',
        'other'
      )
    ),

  general_location text not null default '',
  about text not null default '',
  access_purpose text not null default '',

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create table if not exists public.user_access (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  access_status text not null default 'pending'
    check (
      access_status in (
        'pending',
        'approved',
        'suspended'
      )
    ),

  is_admin boolean not null default false,

  invited_by uuid
    references auth.users(id)
    on delete set null,

  approved_at timestamptz,
  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create or replace function public.set_updated_at()
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

drop trigger if exists
  set_user_profiles_updated_at
  on public.user_profiles;

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists
  set_user_access_updated_at
  on public.user_access;

create trigger set_user_access_updated_at
before update on public.user_access
for each row
execute function public.set_updated_at();

create or replace function public.is_smiling_monad_bootstrap_admin_email(
  candidate_email text
)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select lower(trim(coalesce(candidate_email, ''))) = any (
    array[
      'thesmilingmonad@gmail.com',
      'benlengrey@gmail.com'
    ]::text[]
  );
$$;

create or replace function public.is_smiling_monad_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_access
    where user_id = auth.uid()
      and is_admin = true
      and access_status = 'approved'
  );
$$;

revoke all
on function public.is_smiling_monad_admin()
from public;

grant execute
on function public.is_smiling_monad_admin()
to authenticated;

create or replace function public.create_smiling_monad_user_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_admin boolean :=
    public.is_smiling_monad_bootstrap_admin_email(new.email);
begin
  insert into public.user_profiles (
    user_id,
    email,
    display_name,
    role,
    general_location,
    about,
    access_purpose
  )
  values (
    new.id,
    lower(trim(coalesce(new.email, ''))),
    coalesce(
      nullif(
        trim(
          new.raw_user_meta_data ->> 'display_name'
        ),
        ''
      ),
      split_part(
        lower(trim(coalesce(new.email, 'friend'))),
        '@',
        1
      )
    ),
    case
      when new.raw_user_meta_data ->> 'role' in (
        'participant',
        'family',
        'support-worker',
        'provider',
        'professional',
        'community-member',
        'other'
      )
      then new.raw_user_meta_data ->> 'role'
      when bootstrap_admin
      then 'provider'
      else 'community-member'
    end,
    coalesce(
      new.raw_user_meta_data ->> 'general_location',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'about',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'access_purpose',
      ''
    )
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    display_name = case
      when trim(public.user_profiles.display_name) = ''
      then excluded.display_name
      else public.user_profiles.display_name
    end,
    role = case
      when bootstrap_admin
        and public.user_profiles.role = 'community-member'
      then 'provider'
      else public.user_profiles.role
    end,
    updated_at = now();

  insert into public.user_access (
    user_id,
    access_status,
    is_admin,
    approved_at
  )
  values (
    new.id,
    case
      when bootstrap_admin then 'approved'
      else 'pending'
    end,
    bootstrap_admin,
    case
      when bootstrap_admin then now()
      else null
    end
  )
  on conflict (user_id)
  do update set
    access_status = case
      when bootstrap_admin then 'approved'
      else public.user_access.access_status
    end,
    is_admin = case
      when bootstrap_admin then true
      else public.user_access.is_admin
    end,
    approved_at = case
      when bootstrap_admin
      then coalesce(
        public.user_access.approved_at,
        now()
      )
      else public.user_access.approved_at
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists
  create_smiling_monad_user_records
  on auth.users;

create trigger create_smiling_monad_user_records
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.create_smiling_monad_user_records();

insert into public.user_profiles (
  user_id,
  email,
  display_name,
  role,
  general_location,
  about,
  access_purpose
)
select
  users.id,
  lower(trim(coalesce(users.email, ''))),
  coalesce(
    nullif(
      trim(
        users.raw_user_meta_data ->> 'display_name'
      ),
      ''
    ),
    split_part(
      lower(trim(coalesce(users.email, 'friend'))),
      '@',
      1
    )
  ),
  case
    when users.raw_user_meta_data ->> 'role' in (
      'participant',
      'family',
      'support-worker',
      'provider',
      'professional',
      'community-member',
      'other'
    )
    then users.raw_user_meta_data ->> 'role'
    when public.is_smiling_monad_bootstrap_admin_email(
      users.email
    )
    then 'provider'
    else 'community-member'
  end,
  coalesce(
    users.raw_user_meta_data ->> 'general_location',
    ''
  ),
  coalesce(
    users.raw_user_meta_data ->> 'about',
    ''
  ),
  coalesce(
    users.raw_user_meta_data ->> 'access_purpose',
    ''
  )
from auth.users as users
on conflict (user_id)
do update set
  email = excluded.email,
  display_name = case
    when trim(public.user_profiles.display_name) = ''
    then excluded.display_name
    else public.user_profiles.display_name
  end,
  role = case
    when public.is_smiling_monad_bootstrap_admin_email(
      excluded.email
    )
      and public.user_profiles.role = 'community-member'
    then 'provider'
    else public.user_profiles.role
  end,
  updated_at = now();

insert into public.user_access (
  user_id,
  access_status,
  is_admin,
  approved_at
)
select
  users.id,
  case
    when public.is_smiling_monad_bootstrap_admin_email(
      users.email
    )
    then 'approved'
    else 'pending'
  end,
  public.is_smiling_monad_bootstrap_admin_email(
    users.email
  ),
  case
    when public.is_smiling_monad_bootstrap_admin_email(
      users.email
    )
    then now()
    else null
  end
from auth.users as users
on conflict (user_id)
do update set
  access_status = case
    when public.is_smiling_monad_bootstrap_admin_email(
      (
        select email
        from auth.users
        where id = excluded.user_id
      )
    )
    then 'approved'
    else public.user_access.access_status
  end,
  is_admin = case
    when public.is_smiling_monad_bootstrap_admin_email(
      (
        select email
        from auth.users
        where id = excluded.user_id
      )
    )
    then true
    else public.user_access.is_admin
  end,
  approved_at = case
    when public.is_smiling_monad_bootstrap_admin_email(
      (
        select email
        from auth.users
        where id = excluded.user_id
      )
    )
    then coalesce(
      public.user_access.approved_at,
      now()
    )
    else public.user_access.approved_at
  end,
  updated_at = now();

alter table public.user_profiles
enable row level security;

alter table public.user_access
enable row level security;

drop policy if exists
  "Users can read their own profile"
  on public.user_profiles;

create policy
  "Users can read their own profile"
on public.user_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_smiling_monad_admin()
);

drop policy if exists
  "Users can update their own profile"
  on public.user_profiles;

create policy
  "Users can update their own profile"
on public.user_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_smiling_monad_admin()
)
with check (
  auth.uid() = user_id
  or public.is_smiling_monad_admin()
);

drop policy if exists
  "Users can read their own access"
  on public.user_access;

create policy
  "Users can read their own access"
on public.user_access
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_smiling_monad_admin()
);

drop policy if exists
  "Admins can update user access"
  on public.user_access;

create policy
  "Admins can update user access"
on public.user_access
for update
to authenticated
using (
  public.is_smiling_monad_admin()
)
with check (
  public.is_smiling_monad_admin()
);

-- Final correction pass for existing bootstrap administrator accounts.
update public.user_profiles as profile
set
  email = lower(trim(users.email)),
  display_name = case
    when trim(profile.display_name) = ''
    then split_part(
      lower(trim(users.email)),
      '@',
      1
    )
    else profile.display_name
  end,
  role = case
    when profile.role = 'community-member'
    then 'provider'
    else profile.role
  end,
  updated_at = now()
from auth.users as users
where profile.user_id = users.id
  and public.is_smiling_monad_bootstrap_admin_email(
    users.email
  );

update public.user_access as access
set
  access_status = 'approved',
  is_admin = true,
  approved_at = coalesce(
    access.approved_at,
    now()
  ),
  updated_at = now()
from auth.users as users
where access.user_id = users.id
  and public.is_smiling_monad_bootstrap_admin_email(
    users.email
  );