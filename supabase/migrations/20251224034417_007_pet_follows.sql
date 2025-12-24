-- =========================================================
-- 007_pet_follows
-- Seguir mascotas (desde una de mis mascotas a otra mascota)
-- =========================================================

create table if not exists public.pet_follows (
  follower_pet_id uuid not null references public.pets(id) on delete cascade,
  followed_pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_pet_id, followed_pet_id)
);

create index if not exists idx_pet_follows_follower on public.pet_follows(follower_pet_id);
create index if not exists idx_pet_follows_followed on public.pet_follows(followed_pet_id);

alter table public.pet_follows enable row level security;

-- Leer follows: por MVP, solo puedo leer los follows de mis mascotas
create policy "Users can read follows of their pets"
on public.pet_follows
for select
to authenticated
using (
  exists (
    select 1
    from public.pets p
    where p.id = follower_pet_id
      and p.primary_owner_id = auth.uid()
  )
);

-- Seguir: solo si la mascota follower es mía
create policy "Users can follow from their pets"
on public.pet_follows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pets p
    where p.id = follower_pet_id
      and p.primary_owner_id = auth.uid()
  )
  and follower_pet_id <> followed_pet_id
);

-- Dejar de seguir: solo si follower es mía
create policy "Users can unfollow from their pets"
on public.pet_follows
for delete
to authenticated
using (
  exists (
    select 1
    from public.pets p
    where p.id = follower_pet_id
      and p.primary_owner_id = auth.uid()
  )
);
