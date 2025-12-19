-- =========================================================
-- 003_products
-- Catálogo (productos/servicios) por clínica
-- =========================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,

  -- 'product' o 'service'
  type text not null,
  name text not null,
  description text,
  price_cents integer,
  currency text not null default 'COP',
  image_url text,
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

alter table public.products
  add constraint products_type_chk
  check (type in ('product', 'service'));

create index if not exists idx_products_clinic on public.products(clinic_id);
create index if not exists idx_products_active on public.products(is_active);

-- RLS
alter table public.products enable row level security;

-- Usuarios autenticados pueden leer productos SOLO de clínicas a las que pertenecen
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

-- Por ahora NO permitimos insert/update/delete desde app User
-- (lo hará Pettii Vet o un proceso admin)
