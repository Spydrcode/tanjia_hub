Demo workspace seed and reset

- Demo workspace id: 22222222-2222-2222-2222-222222222222
- To seed demo data manually (service role required):
  - Run the SQL migration 012_workspaces.sql (adds workspaces and workspace_id columns).
  - Run the SQL in supabase/seed_demo.sql using your favorite psql client or Supabase SQL editor.

Demo reset API

- There's a POST endpoint at `/api/demo/reset` that will delete demo workspace rows and insert a minimal demo lead and assign the calling user as a workspace member.
- The reset route requires authentication and relies on SUPABASE_SERVICE_ROLE_KEY available to the server.

Local dev notes

- If you run into RLS permission issues, ensure your current user is added to `workspace_members` for the demo workspace. The reset endpoint will upsert your user into that table.
