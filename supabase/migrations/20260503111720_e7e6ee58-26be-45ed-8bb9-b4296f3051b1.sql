CREATE TYPE public.user_stage AS ENUM (
  'kid_primary',
  'middle_school',
  'high_school',
  'university_student',
  'working_professional',
  'parent'
);

CREATE TYPE public.preferred_language AS ENUM (
  'english',
  'urdu',
  'bilingual'
);

CREATE TYPE public.education_level AS ENUM (
  'primary',
  'middle',
  'secondary',
  'higher_secondary',
  'undergraduate',
  'postgraduate',
  'other'
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Learner',
  date_of_birth DATE,
  learner_stage public.user_stage NOT NULL DEFAULT 'high_school',
  preferred_language public.preferred_language NOT NULL DEFAULT 'english',
  current_education_level public.education_level,
  city TEXT,
  learning_goals TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Learner')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();