ALTER TABLE public.profiles
ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN onboarding_interests TEXT[] NOT NULL DEFAULT '{}';