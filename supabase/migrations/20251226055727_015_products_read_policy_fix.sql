-- =========================================================
-- 015_products_read_policy_fix
-- Ensure authenticated users can read products for their clinics
-- =========================================================

drop policy if exists "Users can read products for their clinics" on public.products;

create policy "Users can read products for their clinics"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.user_clinics uc
    where uc.user_id = auth.uid()
      and uc.clinic_id = public.products.clinic_id
  )
);
