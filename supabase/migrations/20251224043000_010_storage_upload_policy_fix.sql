-- =========================================================
-- 010_storage_upload_policy_fix
-- Ajuste de policy para uploads (fallback por owner)
-- =========================================================

drop policy if exists "Users can upload pet media for own pets"
on storage.objects;

create policy "Users can upload pet media for own pets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet_media'
  and (
    owner = auth.uid()
    or exists (
      select 1
      from public.pets p
      where p.id::text = split_part(name, '/', 1)
        and p.primary_owner_id = auth.uid()
    )
  )
);
