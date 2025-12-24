-- =========================================================
-- 013_products_staff_policies
-- Permitir insert/update/delete de productos a staff/admin
-- =========================================================

create policy "Clinic staff can create products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.clinic_users cu
    where cu.user_id = auth.uid()
      and cu.clinic_id = clinic_id
  )
);

create policy "Clinic staff can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.clinic_users cu
    where cu.user_id = auth.uid()
      and cu.clinic_id = clinic_id
  )
)
with check (
  exists (
    select 1
    from public.clinic_users cu
    where cu.user_id = auth.uid()
      and cu.clinic_id = clinic_id
  )
);

create policy "Clinic staff can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.clinic_users cu
    where cu.user_id = auth.uid()
      and cu.clinic_id = clinic_id
  )
);
