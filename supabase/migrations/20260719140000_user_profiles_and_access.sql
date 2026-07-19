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
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(
        coalesce(new.email, 'friend'),
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
  on conflict (user_id) do nothing;

  insert into public.user_access (
    user_id,
    access_status,
    is_admin
  )
  values (
    new.id,
    'pending',
    false
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists
  create_smiling_monad_user_records
  on auth.users;

create trigger create_smiling_monad_user_records
after insert on auth.users
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
  coalesce(users.email, ''),
  coalesce(
    users.raw_user_meta_data ->> 'display_name',
    split_part(
      coalesce(users.email, 'friend'),
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
on conflict (user_id) do nothing;

insert into public.user_access (
  user_id,
  access_status,
  is_admin
)
select
  users.id,
  'pending',
  false
from auth.users as users
on conflict (user_id) do nothing;

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