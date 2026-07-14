-- Create/replace the security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid()::text AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public."User";
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public."User";
DROP POLICY IF EXISTS "services_all_admin" ON public."Service";
DROP POLICY IF EXISTS "projects_select_own_or_admin" ON public."Project";
DROP POLICY IF EXISTS "projects_insert_own_or_admin" ON public."Project";
DROP POLICY IF EXISTS "projects_update_own_or_admin" ON public."Project";
DROP POLICY IF EXISTS "attachments_select_own_or_admin" ON public."Attachment";
DROP POLICY IF EXISTS "attachments_insert_own_or_admin" ON public."Attachment";
DROP POLICY IF EXISTS "messages_select_own_project_or_admin" ON public."ProjectMessage";
DROP POLICY IF EXISTS "messages_insert_own_project_or_admin" ON public."ProjectMessage";
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public."Payment";
DROP POLICY IF EXISTS "payments_admin_all" ON public."Payment";
DROP POLICY IF EXISTS "notifications_select_own_or_admin" ON public."Notification";
DROP POLICY IF EXISTS "notifications_update_own_or_admin" ON public."Notification";

-- Recreate policies with the helper function
-- Policies for "User"
CREATE POLICY "users_select_own_or_admin" ON public."User"
  FOR SELECT USING (auth.uid()::text = id OR public.is_admin());

CREATE POLICY "users_update_own_or_admin" ON public."User"
  FOR UPDATE USING (auth.uid()::text = id OR public.is_admin());

-- Policies for "Service"
CREATE POLICY "services_all_admin" ON public."Service"
  FOR ALL USING (public.is_admin());

-- Policies for "Project"
CREATE POLICY "projects_select_own_or_admin" ON public."Project"
  FOR SELECT USING (auth.uid()::text = "clientId" OR public.is_admin());

CREATE POLICY "projects_insert_own_or_admin" ON public."Project"
  FOR INSERT WITH CHECK (auth.uid()::text = "clientId" OR public.is_admin());

CREATE POLICY "projects_update_own_or_admin" ON public."Project"
  FOR UPDATE USING (auth.uid()::text = "clientId" OR public.is_admin());

-- Policies for "Attachment"
CREATE POLICY "attachments_select_own_or_admin" ON public."Attachment"
  FOR SELECT USING (
    "uploaderId" = auth.uid()::text 
    OR EXISTS (SELECT 1 FROM public."Project" p WHERE p.id = "projectId" AND p."clientId" = auth.uid()::text)
    OR public.is_admin()
  );

CREATE POLICY "attachments_insert_own_or_admin" ON public."Attachment"
  FOR INSERT WITH CHECK (
    "uploaderId" = auth.uid()::text 
    OR public.is_admin()
  );

-- Policies for "ProjectMessage"
CREATE POLICY "messages_select_own_project_or_admin" ON public."ProjectMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Project" p
      WHERE p.id = "ProjectMessage"."projectId"
        AND (p."clientId" = auth.uid()::text OR public.is_admin())
    )
  );

CREATE POLICY "messages_insert_own_project_or_admin" ON public."ProjectMessage"
  FOR INSERT WITH CHECK (
    "senderId" = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public."Project" p
      WHERE p.id = "ProjectMessage"."projectId"
        AND (p."clientId" = auth.uid()::text OR public.is_admin())
    )
  );

-- Policies for "Payment"
CREATE POLICY "payments_select_own_or_admin" ON public."Payment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Project" p
      WHERE p.id = "Payment"."projectId"
        AND (p."clientId" = auth.uid()::text OR public.is_admin())
    )
  );

CREATE POLICY "payments_admin_all" ON public."Payment"
  FOR ALL USING (public.is_admin());

-- Policies for "Notification"
CREATE POLICY "notifications_select_own_or_admin" ON public."Notification"
  FOR SELECT USING ("userId" = auth.uid()::text OR public.is_admin());

CREATE POLICY "notifications_update_own_or_admin" ON public."Notification"
  FOR UPDATE USING ("userId" = auth.uid()::text OR public.is_admin());
