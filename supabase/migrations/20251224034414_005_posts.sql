-- =========================================================
-- 005_posts
-- Posts (imagen/video) publicados por mascotas
-- Publico = visible para cualquier usuario autenticado
-- =========================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),

  owner_user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,

  media_type text not null,
  storage_bucket text not null default 'pet_media',
  storage_path text not null, -- debe coincidir con storage.objects.name

  visibility text not null default 'public', -- 'public' | 'private'
  caption text,

  created_at timestamptz not null default now()
);

alter table public.posts
  add constraint posts_media_type_chk
  check (media_type in ('image','video'));

alter table public.posts
  add constraint posts_visibility_chk
  check (visibility in ('public','private'));

create index if not exists idx_posts_pet_created on public.posts(pet_id, created_at desc);
create index if not exists idx_posts_owner_created on public.posts(owner_user_id, created_at desc);
create index if not exists idx_posts_visibility_created on public.posts(visibility, created_at desc);

-- RLS
alter table public.posts enable row level security;

-- Leer: cualquier autenticado puede ver posts públicos
-- y el dueño puede ver los suyos aunque sean private
create policy "Posts readable (public or owner)"
on public.posts
for select
to authenticated
using (
  visibility = 'public'
  or owner_user_id = auth.uid()
);

-- Insert: solo si el post lo crea su dueño y la mascota le pertenece
create policy "Users can create posts for own pets"
on public.posts
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.pets p
    where p.id = pet_id
      and p.primary_owner_id = auth.uid()
  )
);

-- Update/Delete: solo dueño
create policy "Users can update own posts"
on public.posts
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "Users can delete own posts"
on public.posts
for delete
to authenticated
using (owner_user_id = auth.uid());
