DO $$ BEGIN
  CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('login', 'module_completed', 'quiz_completed', 'lesson_interaction');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.accomplishment_type AS ENUM ('certificate', 'milestone');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.course_catalog (
  slug text PRIMARY KEY,
  title text NOT NULL,
  short_description text NOT NULL,
  level public.course_level NOT NULL DEFAULT 'beginner',
  duration_estimate text NOT NULL,
  what_you_will_learn text[] NOT NULL DEFAULT '{}'::text[],
  curriculum text[] NOT NULL DEFAULT '{}'::text[],
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  xp_delta integer NOT NULL DEFAULT 0,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_module_id uuid NULL REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badges (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  xp_threshold integer NOT NULL DEFAULT 0,
  module_threshold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.earned_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL REFERENCES public.badges(key) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, badge_key)
);

CREATE TABLE IF NOT EXISTS public.accomplishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  accomplishment_type public.accomplishment_type NOT NULL DEFAULT 'milestone',
  course_slug text NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_catalog_available ON public.course_catalog(is_available);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_profile_date ON public.user_activity_logs(profile_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_profile_type ON public.user_activity_logs(profile_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_earned_badges_profile ON public.earned_badges(profile_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_accomplishments_profile ON public.accomplishments(profile_id, issued_at DESC);

ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accomplishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view available courses" ON public.course_catalog;
CREATE POLICY "Authenticated users can view available courses"
ON public.course_catalog
FOR SELECT
TO authenticated
USING (is_available = true);

DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.user_activity_logs;
CREATE POLICY "Users can view their own activity logs"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.user_activity_logs;
CREATE POLICY "Users can create their own activity logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view badge definitions" ON public.badges;
CREATE POLICY "Authenticated users can view badge definitions"
ON public.badges
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view their own earned badges" ON public.earned_badges;
CREATE POLICY "Users can view their own earned badges"
ON public.earned_badges
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own earned badges" ON public.earned_badges;
CREATE POLICY "Users can create their own earned badges"
ON public.earned_badges
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own accomplishments" ON public.accomplishments;
CREATE POLICY "Users can view their own accomplishments"
ON public.accomplishments
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own accomplishments" ON public.accomplishments;
CREATE POLICY "Users can create their own accomplishments"
ON public.accomplishments
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.compute_gamification_summary(_profile_id uuid)
RETURNS TABLE(current_streak integer, total_xp integer, total_badges integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_count integer := 0;
  d date := CURRENT_DATE;
BEGIN
  SELECT COALESCE(SUM(xp_delta), 0)::integer
  INTO total_xp
  FROM public.user_activity_logs
  WHERE profile_id = _profile_id;

  SELECT COUNT(*)::integer
  INTO total_badges
  FROM public.earned_badges
  WHERE profile_id = _profile_id;

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.user_activity_logs
      WHERE profile_id = _profile_id
        AND activity_date = d
    );

    streak_count := streak_count + 1;
    d := d - INTERVAL '1 day';
  END LOOP;

  current_streak := streak_count;
  RETURN QUERY SELECT current_streak, total_xp, total_badges;
END;
$$;

CREATE OR REPLACE FUNCTION public.try_award_badges(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_xp integer := 0;
  completed_modules integer := 0;
BEGIN
  SELECT COALESCE(SUM(xp_delta), 0)::integer
    INTO total_xp
  FROM public.user_activity_logs
  WHERE profile_id = _profile_id;

  SELECT COUNT(*)::integer
    INTO completed_modules
  FROM public.learning_modules lm
  JOIN public.course_enrollments ce ON ce.id = lm.enrollment_id
  WHERE ce.profile_id = _profile_id
    AND lm.unlock_state = 'completed';

  INSERT INTO public.earned_badges (profile_id, badge_key)
  SELECT _profile_id, b.key
  FROM public.badges b
  WHERE total_xp >= b.xp_threshold
    AND completed_modules >= b.module_threshold
  ON CONFLICT (profile_id, badge_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_activity_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.try_award_badges(NEW.profile_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_award_badges ON public.user_activity_logs;
CREATE TRIGGER trg_activity_award_badges
AFTER INSERT ON public.user_activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_activity_badges();

INSERT INTO public.course_catalog (slug, title, short_description, level, duration_estimate, what_you_will_learn, curriculum, is_available)
VALUES
  (
    'ai-fundamentals',
    'AI Fundamentals',
    'Beginner to Intermediate journey across AI basics, generative AI, ethics, and practical real-world use cases.',
    'beginner',
    '6 weeks · 4 hrs/week',
    ARRAY['Core AI concepts and modern terminology','Generative AI basics and safe prompting patterns','Ethical use of AI systems in academics and work','How AI is used in healthcare, education, and business'],
    ARRAY['Week 1: Introduction to Artificial Intelligence','Week 2: Generative AI and LLM Basics','Week 3: Prompting and Practical Workflows','Week 4: AI Ethics and Responsible Use','Week 5: Industry Applications','Week 6: Guided Mini Project'],
    true
  ),
  (
    'machine-learning-essentials',
    'Machine Learning Essentials',
    'Intermediate course focused on supervised and unsupervised learning, model training, evaluation, and project work.',
    'intermediate',
    '8 weeks · 5 hrs/week',
    ARRAY['Differentiate supervised vs unsupervised learning','Train ML models with practical workflows','Use evaluation metrics to compare model quality','Apply ML concepts through guided projects'],
    ARRAY['Week 1: ML Foundations and Data Preparation','Week 2: Supervised Learning Algorithms','Week 3: Regression and Classification Labs','Week 4: Unsupervised Learning and Clustering','Week 5: Model Evaluation and Validation','Week 6: Feature Engineering Basics','Week 7: End-to-End ML Project','Week 8: Model Review and Presentation'],
    true
  ),
  (
    'python-programming-for-beginners',
    'Python Programming for Beginners',
    'Absolute beginner-friendly path from Python fundamentals to intermediate problem-solving and small practical projects.',
    'beginner',
    '7 weeks · 4 hrs/week',
    ARRAY['Write clean Python syntax confidently','Use conditionals, loops, functions, and core data structures','Develop problem-solving habits through exercises','Build mini projects using real scenarios'],
    ARRAY['Week 1: Python Setup and Core Syntax','Week 2: Variables, Data Types, and Operators','Week 3: Conditionals and Loops','Week 4: Functions and Reusability','Week 5: Lists, Dictionaries, and Tuples','Week 6: File Handling and Error Basics','Week 7: Mini Project Sprint'],
    true
  )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    level = EXCLUDED.level,
    duration_estimate = EXCLUDED.duration_estimate,
    what_you_will_learn = EXCLUDED.what_you_will_learn,
    curriculum = EXCLUDED.curriculum,
    is_available = EXCLUDED.is_available,
    updated_at = now();

INSERT INTO public.badges (key, label, description, xp_threshold, module_threshold)
VALUES
  ('first-steps', 'First Steps', 'Started your first learning activity.', 1, 0),
  ('consistent-learner', 'Consistent Learner', 'Built steady progress through regular activity.', 250, 2),
  ('mastery-builder', 'Mastery Builder', 'Demonstrated strong commitment to deep learning.', 800, 5)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    xp_threshold = EXCLUDED.xp_threshold,
    module_threshold = EXCLUDED.module_threshold;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.earned_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accomplishments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_catalog;