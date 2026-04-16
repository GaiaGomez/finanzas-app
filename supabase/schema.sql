-- ═══════════════════════════════════════════════════════════
-- SCHEMA DE LA BASE DE DATOS — corre esto en Supabase SQL Editor
-- supabase.com → tu proyecto → SQL Editor → New query → pega y corre
-- ═══════════════════════════════════════════════════════════

-- ── MIGRACIÓN: si ya tienes las tablas con "quincena", corre primero esto:
-- alter table public.gastos_fijos rename column quincena to periodo;
-- alter table public.gastos_variables rename column quincena to periodo;
-- ────────────────────────────────────────────────────────────────────────

-- 1. PERFILES DE USUARIO
create table public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null default '',
  ingreso_quincenal numeric not null default 1600000,
  updated_at timestamptz default now()
);

alter table public.perfiles enable row level security;

create policy "usuarios ven su propio perfil"
  on public.perfiles for select using (auth.uid() = id);

create policy "usuarios actualizan su propio perfil"
  on public.perfiles for update using (auth.uid() = id);

-- 2. GASTOS FIJOS
create table public.gastos_fijos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  categoria text not null default 'Otro',
  monto numeric not null default 0,
  pagado boolean not null default false,
  periodo text not null,  -- formato "2026-04"
  created_at timestamptz default now()
);

alter table public.gastos_fijos enable row level security;

create policy "usuarios ven sus gastos fijos"
  on public.gastos_fijos for select using (auth.uid() = user_id);

create policy "usuarios insertan sus gastos fijos"
  on public.gastos_fijos for insert with check (auth.uid() = user_id);

create policy "usuarios actualizan sus gastos fijos"
  on public.gastos_fijos for update using (auth.uid() = user_id);

create policy "usuarios borran sus gastos fijos"
  on public.gastos_fijos for delete using (auth.uid() = user_id);

-- 3. GASTOS VARIABLES
create table public.gastos_variables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  descripcion text not null,
  categoria text not null default 'Otro',
  monto numeric not null,
  fecha date not null default current_date,
  periodo text not null,  -- formato "2026-04"
  created_at timestamptz default now()
);

alter table public.gastos_variables enable row level security;

create policy "usuarios ven sus gastos variables"
  on public.gastos_variables for select using (auth.uid() = user_id);

create policy "usuarios insertan sus gastos variables"
  on public.gastos_variables for insert with check (auth.uid() = user_id);

create policy "usuarios actualizan sus gastos variables"
  on public.gastos_variables for update using (auth.uid() = user_id);

create policy "usuarios borran sus gastos variables"
  on public.gastos_variables for delete using (auth.uid() = user_id);

-- 4. INGRESOS
create table public.ingresos (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  monto numeric not null,
  descripcion text default 'Pago',
  fecha date default current_date,
  periodo text not null,  -- formato "2026-04"
  created_at timestamptz default now()
);

alter table public.ingresos enable row level security;

create policy "usuarios ven sus ingresos"
  on public.ingresos for select using (auth.uid()::text = user_id);

create policy "usuarios insertan sus ingresos"
  on public.ingresos for insert with check (auth.uid()::text = user_id);

create policy "usuarios borran sus ingresos"
  on public.ingresos for delete using (auth.uid()::text = user_id);

-- 5. DEUDAS
create table public.deudas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  monto_total numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.deudas enable row level security;

create policy "usuarios ven sus deudas"
  on public.deudas for select using (auth.uid() = user_id);

create policy "usuarios insertan sus deudas"
  on public.deudas for insert with check (auth.uid() = user_id);

create policy "usuarios actualizan sus deudas"
  on public.deudas for update using (auth.uid() = user_id);

create policy "usuarios borran sus deudas"
  on public.deudas for delete using (auth.uid() = user_id);

-- 6. ABONOS A DEUDAS
create table public.abonos (
  id uuid default gen_random_uuid() primary key,
  deuda_id uuid references public.deudas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  monto numeric not null,
  nota text not null default '',
  fecha date not null default current_date,
  created_at timestamptz default now()
);

alter table public.abonos enable row level security;

create policy "usuarios ven sus abonos"
  on public.abonos for select using (auth.uid() = user_id);

create policy "usuarios insertan sus abonos"
  on public.abonos for insert with check (auth.uid() = user_id);

create policy "usuarios borran sus abonos"
  on public.abonos for delete using (auth.uid() = user_id);

-- 7. FUNCIÓN AUTOMÁTICA: crear perfil al hacer signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
