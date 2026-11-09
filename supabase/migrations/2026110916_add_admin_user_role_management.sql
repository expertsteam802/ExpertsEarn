CREATE OR REPLACE FUNCTION public.admin_update_profile_role(p_user_id uuid, p_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_user_id is null then raise exception 'User ID is required'; end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin role';
  end if;
  update public.profiles set role = p_role, updated_at = now() where id = p_user_id;
  if not found then raise exception 'User profile not found'; end if;
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_update_profile_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_role(uuid, public.app_role) TO authenticated;
