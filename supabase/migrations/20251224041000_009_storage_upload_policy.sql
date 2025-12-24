-- =========================================================
-- 009_storage_upload_policy
-- Permitir subir media a pet_media para mascotas propias
-- =========================================================

create policy "Users can upload pet media for own pets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet_media'
  and exists (
    select 1
    from public.pets p
    where p.id::text = split_part(name, '/', 1)
      and p.primary_owner_id = auth.uid()
  )
);
