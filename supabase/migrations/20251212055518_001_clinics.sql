-- =========================================================
-- 001_clinics
-- Tabla clinics (vets) + RLS lectura
-- =========================================================

-- Necesario para gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Código único (recomendación: guardar en mayúsculas desde la app)
create unique index if not exists clinics_code_unique on public.clinics(code);

-- Validación básica del código (ajusta si quieres)
alter table public.clinics
  add constraint clinics_code_len_chk
  check (char_length(code) between 3 and 32);

-- RLS
alter table public.clinics enable row level security;

-- Lectura para usuarios autenticados (necesitan ver la clínica al ingresar el código)
create policy "Clinics are readable for authenticated"
on public.clinics
for select
to authenticated
using (true);
