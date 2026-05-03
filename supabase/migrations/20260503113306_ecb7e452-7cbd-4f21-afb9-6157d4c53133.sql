-- Adaptive enums
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE public.adaptive_pace AS ENUM ('supportive', 'balanced', 'accelerated');
CREATE TYPE public.content_complexity AS ENUM ('simple', 'standard', 'advanced');
CREATE TYPE public.module_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.module_unlock_state AS ENUM ('locked', 'unlocked', 'completed');
CREATE TYPE public.plan_status AS ENUM ('pending', 'completed', 'skipped');
CREATE TYPE public.voice_mode AS ENUM ('tts', 'stt', 'duplex');
CREATE TYPE public.agent_name AS ENUM ('planner', 'teacher', 'quiz', 'evaluator', 'tutor');

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  preferred_language public.preferred_language NOT NULL DEFAULT 'english',
  pace_mode public.adaptive_pace NOT NULL DEFAULT 'balanced',
  complexity_mode public.content_complexity NOT NULL DEFAULT 'standard',
  current_module_index INTEGER NOT NULL DEFAULT 1,
  mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status public.enrollment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, course_slug)
);

CREATE INDEX idx_course_enrollments_profile_id ON public.course_enrollments(profile_id);
CREATE INDEX idx_course_enrollments_status ON public.course_enrollments(status);

-- Learning modules (adaptive module units per enrollment)
CREATE TABLE public.learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  module_index INTEGER NOT NULL,
  module_title TEXT NOT NULL,
  module_goal TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  difficulty_level public.module_difficulty NOT NULL DEFAULT 'beginner',
  unlock_state public.module_unlock_state NOT NULL DEFAULT 'locked',
  lesson_content TEXT,
  lesson_summary TEXT,
  pakistan_context_examples TEXT[] NOT NULL DEFAULT '{}',
  voice_script TEXT,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, module_index)
);

CREATE INDEX idx_learning_modules_enrollment_id ON public.learning_modules(enrollment_id);
CREATE INDEX idx_learning_modules_unlock_state ON public.learning_modules(unlock_state);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  difficulty_applied public.module_difficulty NOT NULL DEFAULT 'beginner',
  feedback TEXT,
  recommended_next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, profile_id, attempt_no)
);

CREATE INDEX idx_quiz_attempts_profile_id ON public.quiz_attempts(profile_id);
CREATE INDEX idx_quiz_attempts_module_id ON public.quiz_attempts(module_id);

-- Daily planner outputs
CREATE TABLE public.daily_learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  course_slug TEXT NOT NULL,
  focus_minutes INTEGER NOT NULL DEFAULT 20,
  module_ids UUID[] NOT NULL DEFAULT '{}',
  planner_notes TEXT,
  status public.plan_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, plan_date, course_slug)
);

CREATE INDEX idx_daily_learning_plans_profile_date ON public.daily_learning_plans(profile_id, plan_date);

-- Voice interaction logs
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  mode public.voice_mode NOT NULL,
  input_text TEXT,
  transcript_text TEXT,
  audio_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'success',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_sessions_profile_id ON public.voice_sessions(profile_id);
CREATE INDEX idx_voice_sessions_created_at ON public.voice_sessions(created_at DESC);

-- Agent execution logs
CREATE TABLE public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  agent public.agent_name NOT NULL,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_execution_logs_profile_id ON public.agent_execution_logs(profile_id);
CREATE INDEX idx_agent_execution_logs_agent ON public.agent_execution_logs(agent);

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_course_enrollments_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_learning_modules_updated_at
BEFORE UPDATE ON public.learning_modules
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_daily_learning_plans_updated_at
BEFORE UPDATE ON public.daily_learning_plans
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- Adaptive evaluator function
CREATE OR REPLACE FUNCTION public.apply_module_evaluation(
  _profile_id UUID,
  _module_id UUID,
  _score_percent NUMERIC,
  _question_count INTEGER,
  _correct_count INTEGER,
  _feedback TEXT DEFAULT NULL
)
RETURNS TABLE (
  next_action TEXT,
  unlocked_module_id UUID,
  enrollment_completed BOOLEAN,
  updated_mastery_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id UUID;
  v_module_index INTEGER;
  v_max_attempts INTEGER;
  v_attempt_no INTEGER;
  v_next_module_id UUID;
  v_mastery_score NUMERIC;
  v_passed BOOLEAN;
BEGIN
  SELECT lm.enrollment_id, lm.module_index, lm.max_attempts, lm.attempts_count
  INTO v_enrollment_id, v_module_index, v_max_attempts, v_attempt_no
  FROM public.learning_modules lm
  JOIN public.course_enrollments ce ON ce.id = lm.enrollment_id
  WHERE lm.id = _module_id
    AND ce.profile_id = _profile_id;

  IF v_enrollment_id IS NULL THEN
    RAISE EXCEPTION 'Module not found for this learner';
  END IF;

  v_attempt_no := COALESCE(v_attempt_no, 0) + 1;
  v_passed := COALESCE(_score_percent, 0) >= 75;

  INSERT INTO public.quiz_attempts (
    module_id,
    profile_id,
    attempt_no,
    question_count,
    correct_count,
    score_percent,
    difficulty_applied,
    feedback,
    recommended_next_action
  )
  VALUES (
    _module_id,
    _profile_id,
    v_attempt_no,
    COALESCE(_question_count, 0),
    COALESCE(_correct_count, 0),
    COALESCE(_score_percent, 0),
    CASE
      WHEN COALESCE(_score_percent, 0) >= 85 THEN 'advanced'::public.module_difficulty
      WHEN COALESCE(_score_percent, 0) >= 65 THEN 'intermediate'::public.module_difficulty
      ELSE 'beginner'::public.module_difficulty
    END,
    _feedback,
    CASE
      WHEN v_passed THEN 'proceed'
      WHEN v_attempt_no >= v_max_attempts THEN 'relearn_simplified'
      ELSE 'retry'
    END
  );

  UPDATE public.learning_modules
  SET
    attempts_count = v_attempt_no,
    unlock_state = CASE WHEN v_passed THEN 'completed'::public.module_unlock_state ELSE unlock_state END
  WHERE id = _module_id;

  IF v_passed THEN
    SELECT id INTO v_next_module_id
    FROM public.learning_modules
    WHERE enrollment_id = v_enrollment_id
      AND module_index = v_module_index + 1;

    IF v_next_module_id IS NOT NULL THEN
      UPDATE public.learning_modules
      SET unlock_state = 'unlocked'::public.module_unlock_state
      WHERE id = v_next_module_id
        AND unlock_state = 'locked'::public.module_unlock_state;

      UPDATE public.course_enrollments
      SET current_module_index = v_module_index + 1,
          mastery_score = ROUND(((mastery_score * 0.7) + (COALESCE(_score_percent, 0) * 0.3))::numeric, 2)
      WHERE id = v_enrollment_id
      RETURNING mastery_score INTO v_mastery_score;

      RETURN QUERY SELECT 'proceed_to_next_module'::TEXT, v_next_module_id, FALSE, v_mastery_score;
      RETURN;
    ELSE
      UPDATE public.course_enrollments
      SET status = 'completed'::public.enrollment_status,
          mastery_score = ROUND(((mastery_score * 0.7) + (COALESCE(_score_percent, 0) * 0.3))::numeric, 2)
      WHERE id = v_enrollment_id
      RETURNING mastery_score INTO v_mastery_score;

      RETURN QUERY SELECT 'course_completed'::TEXT, NULL::UUID, TRUE, v_mastery_score;
      RETURN;
    END IF;
  END IF;

  SELECT mastery_score INTO v_mastery_score
  FROM public.course_enrollments
  WHERE id = v_enrollment_id;

  IF v_attempt_no >= v_max_attempts THEN
    RETURN QUERY SELECT 'relearn_with_simplified_lesson'::TEXT, _module_id, FALSE, v_mastery_score;
  ELSE
    RETURN QUERY SELECT 'retry_quiz'::TEXT, _module_id, FALSE, v_mastery_score;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT) TO authenticated;

-- Row level security
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own enrollments"
ON public.course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
ON public.course_enrollments
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Modules policies (scoped through enrollment owner)
CREATE POLICY "Users can view modules for own enrollments"
ON public.learning_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.id = learning_modules.enrollment_id
      AND ce.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create modules for own enrollments"
ON public.learning_modules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.id = learning_modules.enrollment_id
      AND ce.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update modules for own enrollments"
ON public.learning_modules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.id = learning_modules.enrollment_id
      AND ce.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.id = learning_modules.enrollment_id
      AND ce.profile_id = auth.uid()
  )
);

-- Quiz attempts policies
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Daily plan policies
CREATE POLICY "Users can view their own plans"
ON public.daily_learning_plans
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own plans"
ON public.daily_learning_plans
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own plans"
ON public.daily_learning_plans
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Voice session policies
CREATE POLICY "Users can view their own voice sessions"
ON public.voice_sessions
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own voice sessions"
ON public.voice_sessions
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Agent log policies
CREATE POLICY "Users can view their own agent logs"
ON public.agent_execution_logs
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own agent logs"
ON public.agent_execution_logs
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());