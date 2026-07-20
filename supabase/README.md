# Shared canvas setup

The web app automatically enables its persistent, realtime canvas when both public Supabase variables are present. Without them it remains in the explicitly labelled local-mock mode.

1. Create a Supabase project.
2. In **Authentication → Sign In / Providers**, enable anonymous sign-ins.
3. Apply [`migrations/202607200001_shared_canvas.sql`](./migrations/202607200001_shared_canvas.sql) with the Supabase SQL Editor or CLI.
4. Copy `apps/web/.env.example` to `apps/web/.env` and add the project URL and publishable key from the project's Connect panel.
5. Restart the app and confirm the canvas label changes from `LOCAL MOCK DATA` to `SHARED CANVAS LIVE`.
6. Open the app in two separate browser profiles. Reserve a pixel in one profile and verify that it appears as an anonymous active pixel in the other; release or complete it and verify both clients converge.

Only the project URL and publishable key belong in the web environment. Never expose a secret key or service-role credential. The migration enables row-level security, allows public reads of owner-free canvas state, and confines writes to authenticated security-definer functions. Reservation owners and completion records are not publicly selectable.

The migration seeds 18 locked pixels so a new judging deployment starts with a partially revealed artwork. It does not seed fake active participants. Anonymous reservations expire after five minutes and are renewed every ten seconds while an attempt is active.
