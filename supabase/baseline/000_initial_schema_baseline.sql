-- BASELINE: estado inicial de la base de datos Pettii
-- Fecha: 2025-12-11
-- Nota: este archivo NO debe ejecutarse. Solo referencia histórica.


-- 1. Crear tabla pets
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  primary_owner_id uuid not null,
  name text not null,
  species text,
  breed text,
  birthdate date,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- 2. Relación FK con la tabla de usuarios (auth.users)
alter table public.pets
  add constraint fk_primary_owner
  foreign key (primary_owner_id)
  references auth.users (id)
  on delete cascade;


-- 3. Habilitar Row Level Security (RLS) en la tabla pets
alter table public.pets enable row level security;


-- 4. Crear política RLS para permitir a los usuarios seleccionar solo sus propias mascotas
create policy "User can select own pets"
on public.pets
for select
using ( primary_owner_id = auth.uid() );



-- 5. Crear política RLS para permitir a los usuarios insertar solo sus propias mascotas
create policy "User can insert own pets"
on public.pets
for insert
with check ( primary_owner_id = auth.uid() );



-- 6. Crear política RLS para permitir a los usuarios actualizar solo sus propias mascotas
create policy "User can update own pets"
on public.pets
for update
using ( primary_owner_id = auth.uid() );
