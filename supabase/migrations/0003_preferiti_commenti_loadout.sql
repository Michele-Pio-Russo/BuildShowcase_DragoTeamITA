-- =========================================================
-- Preferiti e commenti anche per i loadout
-- =========================================================

alter table loadouts add column if not exists saves_count int not null default 0;

-- ---------- FAVORITES: build O loadout ----------
alter table favorites drop constraint favorites_pkey;
alter table favorites add column id uuid primary key default gen_random_uuid();
alter table favorites alter column build_id drop not null;
alter table favorites add column loadout_id uuid references loadouts(id) on delete cascade;

alter table favorites add constraint favorites_target_check check (
  (build_id is not null and loadout_id is null) or (build_id is null and loadout_id is not null)
);

create unique index favorites_user_build_uniq on favorites(user_id, build_id) where build_id is not null;
create unique index favorites_user_loadout_uniq on favorites(user_id, loadout_id) where loadout_id is not null;

-- ---------- COMMENTS: build O loadout ----------
alter table comments alter column build_id drop not null;
alter table comments add column loadout_id uuid references loadouts(id) on delete cascade;

alter table comments add constraint comments_target_check check (
  (build_id is not null and loadout_id is null) or (build_id is null and loadout_id is not null)
);

create index comments_loadout_idx on comments(loadout_id);

-- Le policy RLS esistenti (favorites_owner, comments_select/insert/update/delete)
-- sono già generiche (basate su user_id/author_id, non sul target), quindi
-- funzionano automaticamente anche per i loadout senza bisogno di nuove policy.
