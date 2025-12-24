-- =========================================================
-- 006_post_likes
-- Likes por usuario (1 like por post por usuario)
-- =========================================================

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_user on public.post_likes(user_id);
create index if not exists idx_post_likes_post on public.post_likes(post_id);

alter table public.post_likes enable row level security;

-- Leer likes: cualquier autenticado puede leer likes de posts que puede ver
create policy "Likes readable for visible posts"
on public.post_likes
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (p.visibility = 'public' or p.owner_user_id = auth.uid())
  )
);

-- Like: solo el propio usuario, y solo si el post es visible para él
create policy "Users can like visible posts"
on public.post_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (p.visibility = 'public' or p.owner_user_id = auth.uid())
  )
);

-- Unlike: solo el propio usuario
create policy "Users can unlike their likes"
on public.post_likes
for delete
to authenticated
using (user_id = auth.uid());
