REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_profiles_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_profiles_updated_at() FROM authenticated;