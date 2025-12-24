-- =========================================================
-- 014_storage_clinic_products
-- Storage bucket + policies para imágenes de productos
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('clinic_products', 'clinic_products', false, 52428800)
on conflict (id) do nothing;

-- Lectura: usuarios autenticados pueden leer archivos del bucket
create policy "Authenticated can read clinic product media"
on storage.objects
for select
to authenticated
using (bucket_id = 'clinic_products');

-- Upload: solo staff/admin, path esperado: clinic_id/filename
create policy "Clinic staff can upload product media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'clinic_products'
  and exists (
    select 1
    from public.clinic_users cu
    where cu.user_id = auth.uid()
      and cu.clinic_id::text = split_part(name, '/', 1)
  )
);
