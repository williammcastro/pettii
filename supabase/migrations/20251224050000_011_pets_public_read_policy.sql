-- =========================================================
-- 011_pets_public_read_policy
-- Permitir leer pets con posts públicos (para feed social)
-- =========================================================

create policy "Authenticated can read pets with public posts"
on public.pets
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.pet_id = pets.id
      and p.visibility = 'public'
  )
);
