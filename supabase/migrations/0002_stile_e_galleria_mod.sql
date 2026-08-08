-- =========================================================
-- Stile (stance) per armi melee + galleria multi-immagine mod
-- =========================================================

-- ---------- STILE (solo armi melee) ----------
alter table builds add column if not exists stile text;

-- ---------- GALLERIA IMMAGINI CONFIGURAZIONE MOD ----------
-- Sostituisce il singolo "mods_image_url": più screenshot, ognuno con la sua didascalia.
create table build_mod_images (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  image_url text not null,
  caption text,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);

create index build_mod_images_build_idx on build_mod_images(build_id);

alter table build_mod_images enable row level security;

-- Stesse regole di visibilità/scrittura di build_mods
create policy "build_mod_images_select" on build_mod_images
  for select using (
    exists (
      select 1 from builds b
      where b.id = build_mod_images.build_id
        and (b.status = 'pubblicata' or b.author_id = auth.uid() or is_editor_or_admin())
    ) and is_approved()
  );

create policy "build_mod_images_write" on build_mod_images
  for all using (is_editor_or_admin() and is_approved())
  with check (is_editor_or_admin() and is_approved());
