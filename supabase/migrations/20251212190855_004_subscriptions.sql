-- =========================================================
-- 004_subscriptions
-- Planes de suscripción por clínica + suscripciones por user/pet + eventos
-- =========================================================

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,

  name text not null,
  description text,

  interval_unit text not null,
  interval_count integer not null default 1,

  price_cents integer not null,
  currency text not null default 'COP',

  -- Opcional: relacionar plan a un producto específico del catálogo
  product_id uuid references public.products(id) on delete set null,

  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans
  add constraint plans_interval_unit_chk
  check (interval_unit in ('day','week','month','year'));

alter table public.subscription_plans
  add constraint plans_interval_count_chk
  check (interval_count >= 1);

create index if not exists idx_plans_clinic on public.subscription_plans(clinic_id);
create index if not exists idx_plans_active on public.subscription_plans(is_active);

-- ---------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,

  clinic_id uuid not null references public.clinics(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,

  status text not null default 'active',
  start_date date not null default current_date,
  next_billing_date date,
  end_date date,

  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add constraint subs_status_chk
  check (status in ('active','paused','canceled','expired'));

create index if not exists idx_subs_user on public.subscriptions(user_id);
create index if not exists idx_subs_pet on public.subscriptions(pet_id);
create index if not exists idx_subs_clinic on public.subscriptions(clinic_id);
create index if not exists idx_subs_status on public.subscriptions(status);

-- ---------------------------------------------------------

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,

  event_type text not null,
  event_at timestamptz not null default now(),
  notes text
);

alter table public.subscription_events
  add constraint sub_events_type_chk
  check (event_type in ('created','billed','fulfilled','skipped','paused','canceled'));

create index if not exists idx_sub_events_sub on public.subscription_events(subscription_id);
create index if not exists idx_sub_events_type on public.subscription_events(event_type);

-- =========================================================
-- RLS
-- =========================================================

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

-- Planes: usuario autenticado puede leer planes SOLO de sus clínicas
create policy "Users can read plans for their clinics"
on public.subscription_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.user_clinics uc
    where uc.user_id = auth.uid()
      and uc.clinic_id = public.subscription_plans.clinic_id
  )
);

-- Suscripciones: usuario solo ve las suyas
create policy "Users can read own subscriptions"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid());

-- Suscripciones: usuario solo puede crear suscripciones propias,
-- y solo si:
-- 1) la mascota le pertenece
-- 2) la clínica está en sus user_clinics
-- 3) el plan pertenece a esa clínica
create policy "Users can create subscriptions for own pets and clinics"
on public.subscriptions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.pets p
    where p.id = pet_id
      and p.primary_owner_id = auth.uid()
  )
  and exists (
    select 1 from public.user_clinics uc
    where uc.user_id = auth.uid()
      and uc.clinic_id = clinic_id
  )
  and exists (
    select 1 from public.subscription_plans sp
    where sp.id = plan_id
      and sp.clinic_id = clinic_id
  )
);

-- Actualizar: solo suscripciones propias (limitamos a status/fechas desde app si quieres luego)
create policy "Users can update own subscriptions"
on public.subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Eventos: solo lectura de eventos de sus suscripciones
create policy "Users can read events for own subscriptions"
on public.subscription_events
for select
to authenticated
using (
  exists (
    select 1
    from public.subscriptions s
    where s.id = subscription_id
      and s.user_id = auth.uid()
  )
);

-- Insertar eventos desde app User lo dejamos cerrado por ahora.
