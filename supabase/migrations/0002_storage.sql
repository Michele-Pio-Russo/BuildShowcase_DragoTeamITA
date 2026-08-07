-- Bucket per le immagini delle build
insert into storage.buckets (id, name, public)
values ('build-images', 'build-images', true)
on conflict (id) do nothing;

-- Lettura pubblica delle immagini (bucket pubblico, ok per un clan privato con URL non indicizzati)
create policy "build_images_public_read"
  on storage.objects for select
  using (bucket_id = 'build-images');

-- Solo editor/admin approvati possono caricare
create policy "build_images_editor_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );

create policy "build_images_editor_update_delete"
  on storage.objects for update
  using (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );

create policy "build_images_editor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'build-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor','admin') and status = 'approvato'
    )
  );
