-- Enums for structured learner profile data
create type public.learner_segment as enum (
  'kid_primary',
  'middle_school',
  'high_school',
  'university_student',
  'working_professional',
  'parent'
);

create type public.preferred_language as enum (
  'english',
  'urdu',
  'bilingual'
);

create type public.education_level as enum (
  'primary',
  'middle',
  'secondary',
  'higher_secondary',
  'undergraduate',
  'postgraduate',
  'other'
);

-- Profiles table (one profile per auth user)
create table public.profiles (
  id uuid primary key,
  full_name text not null,
  date_of_birth date,
  learner_segment public.learner_segment,
  preferred_language public.preferred_language,
  education_level public.education_level,
  city text,
  learning_interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row level security
alter table public.profiles enable row level security;

-- RLS: users can read and manage only their own profile
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Timestamp trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Auto-create profile row after signup
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Learner'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();