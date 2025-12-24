-- =========================================================
-- 012_clinic_users
-- Usuarios staff/admin de clínicas (app Pettii Vet)
-- =========================================================

create table if not exists public.clinic_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  unique (user_id, clinic_id)
);

alter table public.clinic_users
  add constraint clinic_users_role_chk
  check (role in ('admin', 'staff'));

create index if not exists idx_clinic_users_user on public.clinic_users(user_id);
create index if not exists idx_clinic_users_clinic on public.clinic_users(clinic_id);

-- RLS
alter table public.clinic_users enable row level security;

-- Usuarios pueden leer sus propias afiliaciones staff
create policy "Users can read own clinic staff memberships"
on public.clinic_users
for select
to authenticated
using (user_id = auth.uid());
