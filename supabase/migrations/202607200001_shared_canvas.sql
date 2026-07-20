begin;

create table if not exists public.challenges (
  id text primary key,
  artwork_key text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.canvas_pixels (
  challenge_id text not null references public.challenges(id) on delete cascade,
  cell_id integer not null check (cell_id >= 0),
  status text not null default 'available' check (status in ('available', 'pending', 'locked')),
  updated_at timestamptz not null default now(),
  primary key (challenge_id, cell_id)
);

create table if not exists public.pixel_reservations (
  challenge_id text not null,
  cell_id integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (challenge_id, cell_id),
  unique (challenge_id, user_id),
  foreign key (challenge_id, cell_id) references public.canvas_pixels(challenge_id, cell_id) on delete cascade
);

create table if not exists public.canvas_completions (
  id bigint generated always as identity primary key,
  challenge_id text not null,
  cell_id integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_method text not null check (completion_method in ('camera', 'honor')),
  completed_at timestamptz not null default now(),
  unique (challenge_id, cell_id),
  unique (challenge_id, user_id),
  foreign key (challenge_id, cell_id) references public.canvas_pixels(challenge_id, cell_id) on delete cascade
);

alter table public.challenges enable row level security;
alter table public.canvas_pixels enable row level security;
alter table public.pixel_reservations enable row level security;
alter table public.canvas_completions enable row level security;

grant select on public.challenges, public.canvas_pixels to anon, authenticated;
revoke all on public.pixel_reservations, public.canvas_completions from anon, authenticated;

drop policy if exists "public challenge read" on public.challenges;
create policy "public challenge read" on public.challenges for select to anon, authenticated using (true);

drop policy if exists "public canvas read" on public.canvas_pixels;
create policy "public canvas read" on public.canvas_pixels for select to anon, authenticated using (true);

insert into public.challenges (id, artwork_key, title)
values ('openai-build-week-2026', 'openai-build-week', 'OPENAI BUILD WEEK')
on conflict (id) do update set artwork_key = excluded.artwork_key, title = excluded.title;

with target_cells as (
  select cell_id, ordinal
  from unnest(array[
    1,2,3,6,7,8,9,12,13,14,15,16,18,22,25,26,27,30,31,32,33,34,35,39,41,45,47,53,54,57,59,63,67,70,74,76,80,82,88,89,92,94,98,102,105,109,111,112,113,114,117,118,119,120,123,125,127,129,130,131,132,133,137,140,144,146,152,158,161,162,164,168,172,175,179,181,187,193,196,197,199,203,207,211,212,213,216,222,223,224,225,226,228,232,234,238,240,241,242,243,244,283,284,285,286,289,293,295,296,297,298,299,301,307,308,309,310,318,322,324,328,332,336,342,346,353,357,359,363,367,371,377,381,388,389,390,391,394,398,402,406,412,416,423,427,429,433,437,441,447,451,458,462,464,468,472,476,482,486,493,494,495,496,500,501,502,505,506,507,508,509,511,512,513,514,515,517,518,519,520,566,570,572,573,574,575,576,578,579,580,581,582,584,588,601,605,607,613,619,622,636,640,642,648,654,656,671,673,675,677,678,679,680,683,684,685,686,689,690,706,708,710,712,718,724,726,741,743,745,747,753,759,762,777,779,782,783,784,785,786,788,789,790,791,792,794,798
  ]::integer[]) with ordinality as seeded(cell_id, ordinal)
)
insert into public.canvas_pixels (challenge_id, cell_id, status)
select 'openai-build-week-2026', cell_id, case when ordinal <= 18 then 'locked' else 'available' end
from target_cells
on conflict (challenge_id, cell_id) do nothing;

create or replace function public.release_deleted_canvas_reservation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.canvas_pixels
  set status = 'available', updated_at = now()
  where challenge_id = old.challenge_id and cell_id = old.cell_id and status = 'pending';
  return old;
end;
$$;

drop trigger if exists release_deleted_canvas_reservation on public.pixel_reservations;
create trigger release_deleted_canvas_reservation
after delete on public.pixel_reservations
for each row execute function public.release_deleted_canvas_reservation();

create or replace function public.expire_canvas_reservations()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.pixel_reservations where expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.reserve_canvas_pixel(p_challenge_id text, p_cell_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  pixel_status text;
  existing_cell integer;
  inserted_count integer;
begin
  if current_user_id is null then return jsonb_build_object('ok', false, 'reason', 'authentication-required'); end if;
  perform public.expire_canvas_reservations();

  if exists (select 1 from public.canvas_completions where challenge_id = p_challenge_id and user_id = current_user_id) then
    return jsonb_build_object('ok', false, 'reason', 'already-completed');
  end if;

  select cell_id into existing_cell from public.pixel_reservations
  where challenge_id = p_challenge_id and user_id = current_user_id;
  if existing_cell is not null then
    return jsonb_build_object('ok', existing_cell = p_cell_id, 'reason', case when existing_cell = p_cell_id then null else 'active-reservation' end, 'cell_id', existing_cell);
  end if;

  select status into pixel_status from public.canvas_pixels
  where challenge_id = p_challenge_id and cell_id = p_cell_id
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid-cell'); end if;
  if pixel_status <> 'available' then return jsonb_build_object('ok', false, 'reason', 'cell-unavailable'); end if;

  insert into public.pixel_reservations (challenge_id, cell_id, user_id, expires_at)
  values (p_challenge_id, p_cell_id, current_user_id, now() + interval '5 minutes')
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return jsonb_build_object('ok', false, 'reason', 'reservation-conflict'); end if;

  update public.canvas_pixels set status = 'pending', updated_at = now()
  where challenge_id = p_challenge_id and cell_id = p_cell_id;
  return jsonb_build_object('ok', true, 'cell_id', p_cell_id);
end;
$$;

create or replace function public.renew_canvas_reservation(p_challenge_id text, p_cell_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  renewed_count integer;
begin
  update public.pixel_reservations
  set expires_at = now() + interval '5 minutes'
  where challenge_id = p_challenge_id and cell_id = p_cell_id and user_id = auth.uid() and expires_at > now();
  get diagnostics renewed_count = row_count;
  return jsonb_build_object('ok', renewed_count = 1, 'reason', case when renewed_count = 1 then null else 'reservation-lost' end);
end;
$$;

create or replace function public.release_canvas_pixel(p_challenge_id text, p_cell_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  released_count integer;
begin
  delete from public.pixel_reservations
  where challenge_id = p_challenge_id and cell_id = p_cell_id and user_id = auth.uid();
  get diagnostics released_count = row_count;
  return jsonb_build_object('ok', released_count = 1, 'reason', case when released_count = 1 then null else 'reservation-not-found' end);
end;
$$;

create or replace function public.commit_canvas_pixel(p_challenge_id text, p_cell_id integer, p_completion_method text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if p_completion_method not in ('camera', 'honor') then return jsonb_build_object('ok', false, 'reason', 'invalid-completion-method'); end if;
  perform public.expire_canvas_reservations();
  perform 1 from public.pixel_reservations
  where challenge_id = p_challenge_id and cell_id = p_cell_id and user_id = current_user_id and expires_at > now()
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'reservation-lost'); end if;

  insert into public.canvas_completions (challenge_id, cell_id, user_id, completion_method)
  values (p_challenge_id, p_cell_id, current_user_id, p_completion_method)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return jsonb_build_object('ok', false, 'reason', 'completion-conflict'); end if;

  update public.canvas_pixels set status = 'locked', updated_at = now()
  where challenge_id = p_challenge_id and cell_id = p_cell_id;
  delete from public.pixel_reservations
  where challenge_id = p_challenge_id and cell_id = p_cell_id and user_id = current_user_id;
  return jsonb_build_object('ok', true, 'cell_id', p_cell_id);
end;
$$;

revoke all on function public.expire_canvas_reservations() from public, anon;
revoke all on function public.reserve_canvas_pixel(text, integer) from public, anon;
revoke all on function public.renew_canvas_reservation(text, integer) from public, anon;
revoke all on function public.release_canvas_pixel(text, integer) from public, anon;
revoke all on function public.commit_canvas_pixel(text, integer, text) from public, anon;
grant execute on function public.expire_canvas_reservations() to authenticated;
grant execute on function public.reserve_canvas_pixel(text, integer) to authenticated;
grant execute on function public.renew_canvas_reservation(text, integer) to authenticated;
grant execute on function public.release_canvas_pixel(text, integer) to authenticated;
grant execute on function public.commit_canvas_pixel(text, integer, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'canvas_pixels'
  ) then
    alter publication supabase_realtime add table public.canvas_pixels;
  end if;
end;
$$;

commit;
