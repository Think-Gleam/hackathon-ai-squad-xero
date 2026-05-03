-- Make the read summary function run with caller permissions
ALTER FUNCTION public.compute_gamification_summary(uuid)
  SECURITY INVOKER;

-- Internal helper functions should not be directly callable by app users
REVOKE EXECUTE ON FUNCTION public.try_award_badges(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.try_award_badges(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.try_award_badges(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_activity_badges() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_activity_badges() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_activity_badges() FROM authenticated;

-- Summary function should only be callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.compute_gamification_summary(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_gamification_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.compute_gamification_summary(uuid) TO authenticated;