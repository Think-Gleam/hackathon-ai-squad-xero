CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id uuid NULL REFERENCES public.course_enrollments(id) ON DELETE SET NULL,
  module_id uuid NULL REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  course_slug text NOT NULL,
  topic text NOT NULL,
  score_percent integer NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  is_passed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'adaptive_quiz_engine',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_profile_created
  ON public.quiz_results(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_profile_course
  ON public.quiz_results(profile_id, course_slug, created_at DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quiz results" ON public.quiz_results;
CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own quiz results" ON public.quiz_results;
CREATE POLICY "Users can create their own quiz results"
ON public.quiz_results
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());