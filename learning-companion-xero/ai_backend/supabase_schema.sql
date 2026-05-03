-- Recommended tables for EduMentor multi-agent persistence

create table if not exists public.edumentor_study_plans (
  id uuid primary key,
  user_id text not null,
  topic text,
  plan_json jsonb not null default '{}'::jsonb,
  created_at bigint not null
);

create table if not exists public.edumentor_quiz_results (
  id uuid primary key,
  user_id text not null,
  topic text,
  quiz_json jsonb not null default '{}'::jsonb,
  answers_json jsonb not null default '{}'::jsonb,
  evaluation_json jsonb not null default '{}'::jsonb,
  created_at bigint not null
);

create table if not exists public.edumentor_progress (
  id uuid primary key,
  user_id text not null,
  topic text,
  progress_json jsonb not null default '{}'::jsonb,
  created_at bigint not null
);

create index if not exists idx_edumentor_plans_user_created
  on public.edumentor_study_plans(user_id, created_at desc);

create index if not exists idx_edumentor_quiz_user_created
  on public.edumentor_quiz_results(user_id, created_at desc);

create index if not exists idx_edumentor_progress_user_created
  on public.edumentor_progress(user_id, created_at desc);
