-- =========================================================
-- 002_user_clinics
-- Afiliación user <-> clinic + función join_clinic_by_code
-- =========================================================

create table if not exists public.user_clinics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, clinic_id)
);

create index if not exists idx_user_clinics_user on public.user_clinics(user_id);
create index if not exists idx_user_clinics_clinic on public.user_clinics(clinic_id);

-- RLS
alter table public.user_clinics enable row level security;

-- Policies básicas: el usuario solo ve/crea/edita lo suyo
create policy "User can read own clinic memberships"
on public.user_clinics
for select
to authenticated
using (user_id = auth.uid());

create policy "User can insert own clinic memberships"
on public.user_clinics
for insert
to authenticated
with check (user_id = auth.uid());

create policy "User can update own clinic memberships"
on public.user_clinics
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "User can delete own clinic memberships"
on public.user_clinics
for delete
to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------
-- Función: afiliarse por código (1 solo call desde la app)
-- Ventajas:
-- - reduce errores (no necesitas 2 pasos)
-- - permite hacer "primary" y desmarcar otras
-- ---------------------------------------------------------

create or replace function public.join_clinic_by_code(
  p_code text,
  p_make_primary boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_clinic_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select c.id into v_clinic_id
  from public.clinics c
  where c.code = p_code;

  if v_clinic_id is null then
    raise exception 'Invalid clinic code';
  end if;

  -- Si va a ser primaria, desmarcamos otras afiliaciones del usuario
  if p_make_primary then
    update public.user_clinics
    set is_primary = false
    where user_id = v_user;
  end if;

  insert into public.user_clinics (user_id, clinic_id, is_primary)
  values (v_user, v_clinic_id, p_make_primary)
  on conflict (user_id, clinic_id)
  do update set is_primary = excluded.is_primary;

  return v_clinic_id;
end;
$$;

-- Permitir ejecutar la función a usuarios autenticados
grant execute on function public.join_clinic_by_code(text, boolean) to authenticated;
