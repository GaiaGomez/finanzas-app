-- ═══════════════════════════════════════════════════════════
-- SCHEMA DE LA BASE DE DATOS — corre esto en Supabase SQL Editor
-- supabase.com → tu proyecto → SQL Editor → New query → pega y corre
-- ═══════════════════════════════════════════════════════════

-- 1. PERFILES DE USUARIO
-- Se crea automáticamente cuando alguien hace signup
create table public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null default '',
  ingreso_quincenal numeric not null default 1600000,
  updated_at timestamptz default now()
);

-- Habilitar Row Level Security: cada usuario solo ve sus datos
alter table public.perfiles enable row level security;

create policy "usuarios ven su propio perfil"
  on public.perfiles for select
  using (auth.uid() = id);

create policy "usuarios actualizan su propio perfil"
  on public.perfiles for update
  using (auth.uid() = id);

-- 2. GASTOS FIJOS
create table public.gastos_fijos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  categoria text not null default 'Otro',
  monto numeric not null default 0,
  pagado boolean not null default false,
  quincena text not null,  -- formato "2024-04-Q1"
  created_at timestamptz default now()
);

alter table public.gastos_fijos enable row level security;

create policy "usuarios ven sus gastos fijos"
  on public.gastos_fijos for select
  using (auth.uid() = user_id);

create policy "usuarios insertan sus gastos fijos"
  on public.gastos_fijos for insert
  with check (auth.uid() = user_id);

create policy "usuarios actualizan sus gastos fijos"
  on public.gastos_fijos for update
  using (auth.uid() = user_id);

create policy "usuarios borran sus gastos fijos"
  on public.gastos_fijos for delete
  using (auth.uid() = user_id);

-- 3. GASTOS VARIABLES
create table public.gastos_variables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  descripcion text not null,
  categoria text not null default 'Otro',
  monto numeric not null,
  fecha date not null default current_date,
  quincena text not null,
  created_at timestamptz default now()
);

alter table public.gastos_variables enable row level security;

create policy "usuarios ven sus gastos variables"
  on public.gastos_variables for select
  using (auth.uid() = user_id);

create policy "usuarios insertan sus gastos variables"
  on public.gastos_variables for insert
  with check (auth.uid() = user_id);

create policy "usuarios actualizan sus gastos variables"
  on public.gastos_variables for update
  using (auth.uid() = user_id);

create policy "usuarios borran sus gastos variables"
  on public.gastos_variables for delete
  using (auth.uid() = user_id);

-- 4. DEUDAS
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

-- 5. ABONOS A DEUDAS
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

-- 6. FUNCIÓN AUTOMÁTICA: crear perfil al hacer signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Este trigger se dispara cada vez que alguien se registra
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
