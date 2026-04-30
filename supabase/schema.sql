-- ═══════════════════════════════════════════════════════════
-- SCHEMA DE LA BASE DE DATOS — corre esto en Supabase SQL Editor
-- supabase.com → tu proyecto → SQL Editor → New query → pega y corre
-- Seguro de re-ejecutar: usa IF NOT EXISTS / DROP IF EXISTS en todos los objetos.
-- ═══════════════════════════════════════════════════════════

-- 1. PERFILES DE USUARIO
create table if not exists public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null default '',
  ingreso_quincenal numeric not null default 1600000,
  updated_at timestamptz default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "usuarios ven su propio perfil" on public.perfiles;
create policy "usuarios ven su propio perfil"
  on public.perfiles for select using (auth.uid() = id);

drop policy if exists "usuarios actualizan su propio perfil" on public.perfiles;
create policy "usuarios actualizan su propio perfil"
  on public.perfiles for update using (auth.uid() = id);

-- 2. GASTOS FIJOS
create table if not exists public.gastos_fijos (
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

drop policy if exists "usuarios ven sus gastos fijos" on public.gastos_fijos;
create policy "usuarios ven sus gastos fijos"
  on public.gastos_fijos for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus gastos fijos" on public.gastos_fijos;
create policy "usuarios insertan sus gastos fijos"
  on public.gastos_fijos for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios actualizan sus gastos fijos" on public.gastos_fijos;
create policy "usuarios actualizan sus gastos fijos"
  on public.gastos_fijos for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus gastos fijos" on public.gastos_fijos;
create policy "usuarios borran sus gastos fijos"
  on public.gastos_fijos for delete using (auth.uid() = user_id);

-- 3. GASTOS VARIABLES
create table if not exists public.gastos_variables (
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

drop policy if exists "usuarios ven sus gastos variables" on public.gastos_variables;
create policy "usuarios ven sus gastos variables"
  on public.gastos_variables for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus gastos variables" on public.gastos_variables;
create policy "usuarios insertan sus gastos variables"
  on public.gastos_variables for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios actualizan sus gastos variables" on public.gastos_variables;
create policy "usuarios actualizan sus gastos variables"
  on public.gastos_variables for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus gastos variables" on public.gastos_variables;
create policy "usuarios borran sus gastos variables"
  on public.gastos_variables for delete using (auth.uid() = user_id);

-- 4. INGRESOS
create table if not exists public.ingresos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  monto numeric not null,
  descripcion text default 'Pago',
  fecha date default current_date,
  periodo text not null,  -- formato "2026-04"
  created_at timestamptz default now()
);

alter table public.ingresos enable row level security;

drop policy if exists "usuarios ven sus ingresos" on public.ingresos;
create policy "usuarios ven sus ingresos"
  on public.ingresos for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus ingresos" on public.ingresos;
create policy "usuarios insertan sus ingresos"
  on public.ingresos for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios borran sus ingresos" on public.ingresos;
create policy "usuarios borran sus ingresos"
  on public.ingresos for delete using (auth.uid() = user_id);

-- 5. DEUDAS
create table if not exists public.deudas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  monto_total numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.deudas enable row level security;

drop policy if exists "usuarios ven sus deudas" on public.deudas;
create policy "usuarios ven sus deudas"
  on public.deudas for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus deudas" on public.deudas;
create policy "usuarios insertan sus deudas"
  on public.deudas for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios actualizan sus deudas" on public.deudas;
create policy "usuarios actualizan sus deudas"
  on public.deudas for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus deudas" on public.deudas;
create policy "usuarios borran sus deudas"
  on public.deudas for delete using (auth.uid() = user_id);

-- 6. ABONOS A DEUDAS
create table if not exists public.abonos (
  id uuid default gen_random_uuid() primary key,
  deuda_id uuid references public.deudas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  monto numeric not null,
  nota text not null default '',
  fecha date not null default current_date,
  created_at timestamptz default now()
);

alter table public.abonos enable row level security;

drop policy if exists "usuarios ven sus abonos" on public.abonos;
create policy "usuarios ven sus abonos"
  on public.abonos for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus abonos" on public.abonos;
create policy "usuarios insertan sus abonos"
  on public.abonos for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.deudas where id = deuda_id and user_id = auth.uid())
  );

drop policy if exists "usuarios actualizan sus abonos" on public.abonos;
create policy "usuarios actualizan sus abonos"
  on public.abonos for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus abonos" on public.abonos;
create policy "usuarios borran sus abonos"
  on public.abonos for delete using (auth.uid() = user_id);

-- 7. METAS DE AHORRO
create table if not exists public.metas_ahorro (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  monto_meta numeric not null check (monto_meta > 0),
  monto_actual numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.metas_ahorro enable row level security;

drop policy if exists "usuarios ven sus metas" on public.metas_ahorro;
create policy "usuarios ven sus metas"
  on public.metas_ahorro for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus metas" on public.metas_ahorro;
create policy "usuarios insertan sus metas"
  on public.metas_ahorro for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios actualizan sus metas" on public.metas_ahorro;
create policy "usuarios actualizan sus metas"
  on public.metas_ahorro for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus metas" on public.metas_ahorro;
create policy "usuarios borran sus metas"
  on public.metas_ahorro for delete using (auth.uid() = user_id);

-- 8. ABONOS A METAS DE AHORRO
create table if not exists public.abonos_meta (
  id uuid default gen_random_uuid() primary key,
  meta_id uuid references public.metas_ahorro(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  monto numeric not null check (monto > 0),
  nota text not null default '',
  fecha date not null default current_date,
  created_at timestamptz default now()
);

alter table public.abonos_meta enable row level security;

drop policy if exists "usuarios ven sus abonos de metas" on public.abonos_meta;
create policy "usuarios ven sus abonos de metas"
  on public.abonos_meta for select using (auth.uid() = user_id);

drop policy if exists "usuarios insertan sus abonos de metas" on public.abonos_meta;
create policy "usuarios insertan sus abonos de metas"
  on public.abonos_meta for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.metas_ahorro where id = meta_id and user_id = auth.uid())
  );

drop policy if exists "usuarios actualizan sus abonos de metas" on public.abonos_meta;
create policy "usuarios actualizan sus abonos de metas"
  on public.abonos_meta for update using (auth.uid() = user_id);

drop policy if exists "usuarios borran sus abonos de metas" on public.abonos_meta;
create policy "usuarios borran sus abonos de metas"
  on public.abonos_meta for delete using (auth.uid() = user_id);

-- 9. ÍNDICES
create index if not exists idx_gastos_fijos_user_periodo    on public.gastos_fijos    (user_id, periodo);
create index if not exists idx_gastos_variables_user_periodo on public.gastos_variables (user_id, periodo);
create index if not exists idx_ingresos_user_periodo        on public.ingresos         (user_id, periodo);
create index if not exists idx_deudas_user                  on public.deudas           (user_id);
create index if not exists idx_abonos_user                  on public.abonos           (user_id);
create index if not exists idx_abonos_deuda                 on public.abonos           (deuda_id);
create index if not exists idx_metas_ahorro_user            on public.metas_ahorro     (user_id);
create index if not exists idx_abonos_meta_user             on public.abonos_meta      (user_id);
create index if not exists idx_abonos_meta_meta             on public.abonos_meta      (meta_id);

-- 10. FUNCIÓN AUTOMÁTICA: crear perfil al hacer signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
