-- Restrict trigger helper function execution
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM authenticated;

-- Use invoker security for learner-evaluation function
ALTER FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT)
  SECURITY INVOKER;

-- Keep function callable for signed-in learners only
REVOKE ALL ON FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_module_evaluation(UUID, UUID, NUMERIC, INTEGER, INTEGER, TEXT) TO authenticated;