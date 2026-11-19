-- =========================================================
-- 0014 — handle_build_update: non fallire se manca l'utente
-- Una modifica fatta dal Table Editor di Supabase (auth.uid() nullo)
-- falliva nello storico perché build_history.editor_id è NOT NULL.
-- Ora aggiorna comunque updated_at e salta solo la riga di storico.
-- Idempotente (create or replace).
-- =========================================================

create or replace function public.handle_build_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  old_json jsonb;
  new_json jsonb;
begin
  old_json := to_jsonb(old) - 'views_count' - 'updated_at' - 'saves_count';
  new_json := to_jsonb(new) - 'views_count' - 'updated_at' - 'saves_count';

  if old_json is distinct from new_json then
    new.updated_at = now();
    if auth.uid() is not null then
      insert into build_history (build_id, editor_id, diff_summary)
      values (new.id, auth.uid(), 'Build aggiornata');
    end if;
  else
    new.updated_at = old.updated_at;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------
-- ROLLBACK (versione precedente, da incollare se serve)
-- ---------------------------------------------------------
-- create or replace function public.handle_build_update()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path to 'public'
-- as $function$
-- declare
--   old_json jsonb;
--   new_json jsonb;
-- begin
--   old_json := to_jsonb(old) - 'views_count' - 'updated_at' - 'saves_count';
--   new_json := to_jsonb(new) - 'views_count' - 'updated_at' - 'saves_count';
--   if old_json is distinct from new_json then
--     new.updated_at = now();
--     insert into build_history (build_id, editor_id, diff_summary)
--     values (new.id, auth.uid(), 'Build aggiornata');
--   else
--     new.updated_at = old.updated_at;
--   end if;
--   return new;
-- end;
-- $function$;
