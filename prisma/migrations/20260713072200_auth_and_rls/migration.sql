-- Conditionally create mock auth.uid() function if it doesn't exist (for shadow database)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) THEN
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE FUNCTION auth.uid() RETURNS uuid AS 'SELECT null::uuid;' LANGUAGE sql STABLE;
    END IF;
END $$;

-- Conditionally create mock auth.users table if it doesn't exist (for shadow database)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE auth.users (
            id uuid PRIMARY KEY,
            email text,
            raw_user_meta_data jsonb
        );
    END IF;
END $$;

-- Create a function to handle new user signups from Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (id, email, name, role, "emailNotificationsEnabled", "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'CLIENT',
    true,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created in Supabase Auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on all tables
alter table "User" enable row level security;
alter table "Service" enable row level security;
alter table "Project" enable row level security;
alter table "Attachment" enable row level security;
alter table "ProjectMessage" enable row level security;
alter table "Payment" enable row level security;
alter table "Notification" enable row level security;

-- Policies for "User"
create policy "users_select_own_or_admin" on "User"
  for select using (auth.uid()::text = id or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

create policy "users_update_own_or_admin" on "User"
  for update using (auth.uid()::text = id or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

-- Policies for "Service"
create policy "services_select_all" on "Service"
  for select using (true);

create policy "services_all_admin" on "Service"
  for all using (exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

-- Policies for "Project"
create policy "projects_select_own_or_admin" on "Project"
  for select using (auth.uid()::text = "clientId" or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

create policy "projects_insert_own_or_admin" on "Project"
  for insert with check (auth.uid()::text = "clientId" or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

create policy "projects_update_own_or_admin" on "Project"
  for update using (auth.uid()::text = "clientId" or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

-- Policies for "Attachment"
create policy "attachments_select_own_or_admin" on "Attachment"
  for select using (
    "uploaderId" = auth.uid()::text 
    or exists (select 1 from "Project" p where p.id = "projectId" and p."clientId" = auth.uid()::text)
    or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN')
  );

create policy "attachments_insert_own_or_admin" on "Attachment"
  for insert with check (
    "uploaderId" = auth.uid()::text 
    or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN')
  );

-- Policies for "ProjectMessage"
create policy "messages_select_own_project_or_admin" on "ProjectMessage"
  for select using (
    exists (
      select 1 from "Project" p
      where p.id = "ProjectMessage"."projectId"
        and (p."clientId" = auth.uid()::text or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'))
    )
  );

create policy "messages_insert_own_project_or_admin" on "ProjectMessage"
  for insert with check (
    "senderId" = auth.uid()::text
    and exists (
      select 1 from "Project" p
      where p.id = "ProjectMessage"."projectId"
        and (p."clientId" = auth.uid()::text or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'))
    )
  );

-- Policies for "Payment"
create policy "payments_select_own_or_admin" on "Payment"
  for select using (
    exists (
      select 1 from "Project" p
      where p.id = "Payment"."projectId"
        and (p."clientId" = auth.uid()::text or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'))
    )
  );

create policy "payments_admin_all" on "Payment"
  for all using (exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

-- Policies for "Notification"
create policy "notifications_select_own_or_admin" on "Notification"
  for select using ("userId" = auth.uid()::text or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));

create policy "notifications_update_own_or_admin" on "Notification"
  for update using ("userId" = auth.uid()::text or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'));
