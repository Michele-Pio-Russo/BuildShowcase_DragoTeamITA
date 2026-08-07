-- =========================================================
-- Warframe Clan Builds — schema iniziale + RLS
-- =========================================================

-- ---------- ENUM ----------
create type user_role as enum ('admin', 'editor', 'membro');
create type user_status as enum ('pending', 'approvato', 'rifiutato');
create type build_status as enum ('bozza', 'pubblicata');

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role user_role not null default 'membro',
  status user_status not null default 'pending',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- CATEGORIES (seed fisso) ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  ordine int not null default 0
);

insert into categories (slug, label, ordine) values
  ('warframe', 'Warframe', 1),
  ('arma_primaria', 'Armi primarie', 2),
  ('arma_secondaria', 'Armi secondarie', 3),
  ('arma_melee', 'Armi melee', 4),
  ('companion', 'Companion', 5),
  ('arma_companion', 'Armi dei companion', 6);

-- ---------- TAGS ----------
create table tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

-- ---------- BUILDS ----------
create table builds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references categories(id),
  item_name text not null,
  image_url text,
  author_id uuid not null references profiles(id),
  status build_status not null default 'bozza',
  description_md text default '',
  playstyle_md text default '',
  forma text,          -- es. "3x V, 1x -"
  polarity text,
  reattore boolean default false,
  aura text,
  exilus text,
  arcane text,
  focus_school text,
  stats jsonb not null default '{}'::jsonb,   -- {"critica": "alta", "status": "media", ...}
  views_count int not null default 0,
  saves_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index builds_category_idx on builds(category_id);
create index builds_status_idx on builds(status);
create index builds_author_idx on builds(author_id);
create index builds_updated_idx on builds(updated_at desc);

-- ---------- BUILD MODS ----------
create table build_mods (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  mod_name text not null,
  rank int,
  slot text,
  note text,
  ordine int not null default 0
);

create index build_mods_build_idx on build_mods(build_id);

-- ---------- BUILD TAGS (n:n) ----------
create table build_tags (
  build_id uuid not null references builds(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (build_id, tag_id)
);

-- ---------- FAVORITES ----------
create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  build_id uuid not null references builds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

-- ---------- COMMENTS ----------
create table comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  author_id uuid not null references profiles(id),
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index comments_build_idx on comments(build_id);

-- ---------- BUILD HISTORY ----------
create table build_history (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  editor_id uuid not null references profiles(id),
  changed_at timestamptz not null default now(),
  diff_summary text
);

create index build_history_build_idx on build_history(build_id);

-- =========================================================
-- FUNZIONI DI SUPPORTO (SECURITY DEFINER per evitare ricorsione RLS)
-- =========================================================

create or replace function current_role_is(target_role user_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_editor_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

create or replace function is_approved()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'approvato'
  );
$$;

-- trigger: aggiorna updated_at e registra storico ad ogni update di builds
create or replace function handle_build_update()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  insert into build_history (build_id, editor_id, diff_summary)
  values (new.id, auth.uid(), 'Build aggiornata');
  return new;
end;
$$;

create trigger trg_build_update
  before update on builds
  for each row
  execute function handle_build_update();

-- trigger: crea automaticamente il profilo alla registrazione (stato pending)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'membro',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table builds enable row level security;
alter table build_mods enable row level security;
alter table build_tags enable row level security;
alter table favorites enable row level security;
alter table comments enable row level security;
alter table build_history enable row level security;

-- ---- PROFILES ----
create policy "profiles_select_own_or_approved" on profiles
  for select using (
    id = auth.uid() or is_admin() or status = 'approvato'
  );

create policy "profiles_update_own_basic_fields" on profiles
  for update using (id = auth.uid() or is_admin());

create policy "profiles_admin_manage" on profiles
  for all using (is_admin()) with check (is_admin());

-- ---- CATEGORIES / TAGS: lettura pubblica per approvati, scrittura editor/admin ----
create policy "categories_select" on categories
  for select using (is_approved() or is_admin());

create policy "tags_select" on tags
  for select using (is_approved() or is_admin());

create policy "tags_write" on tags
  for insert with check (is_editor_or_admin());

-- ---- BUILDS ----
create policy "builds_select_published_or_own" on builds
  for select using (
    is_approved() and (
      status = 'pubblicata'
      or author_id = auth.uid()
      or is_editor_or_admin()
    )
  );

create policy "builds_insert_editor_admin" on builds
  for insert with check (is_editor_or_admin() and is_approved());

create policy "builds_update_editor_admin" on builds
  for update using (is_editor_or_admin() and is_approved());

create policy "builds_delete_admin_or_author" on builds
  for delete using (is_admin() or (is_editor_or_admin() and author_id = auth.uid()));

-- ---- BUILD MODS ----
create policy "build_mods_select" on build_mods
  for select using (
    exists (
      select 1 from builds b
      where b.id = build_mods.build_id
        and (b.status = 'pubblicata' or b.author_id = auth.uid() or is_editor_or_admin())
    ) and is_approved()
  );

create policy "build_mods_write" on build_mods
  for all using (is_editor_or_admin() and is_approved())
  with check (is_editor_or_admin() and is_approved());

-- ---- BUILD TAGS ----
create policy "build_tags_select" on build_tags
  for select using (is_approved());

create policy "build_tags_write" on build_tags
  for all using (is_editor_or_admin()) with check (is_editor_or_admin());

-- ---- FAVORITES ----
create policy "favorites_owner" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- COMMENTS ----
create policy "comments_select" on comments
  for select using (is_approved());

create policy "comments_insert_own" on comments
  for insert with check (author_id = auth.uid() and is_approved());

create policy "comments_update_delete_own_or_admin" on comments
  for update using (author_id = auth.uid() or is_admin());

create policy "comments_delete_own_or_admin" on comments
  for delete using (author_id = auth.uid() or is_admin());

-- ---- BUILD HISTORY ----
create policy "build_history_select" on build_history
  for select using (is_approved());

-- Nota: l'insert su build_history avviene solo tramite trigger (SECURITY DEFINER),
-- quindi non serve una policy insert per gli utenti.
