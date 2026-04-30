-- ═══════════════════════════════════════════════════════════
-- DEMO SEED DATA — fictional data only, safe to run in SQL Editor
-- DEMO_USER_ID: aafa4170-1088-4343-a5b2-740aa480ae81
-- DEMO_EMAIL:   demo@fynt.app
-- DEMO_PASSWORD: fynt2026*
--
-- Prerequisites: the demo auth user must already exist in auth.users.
-- Rerunnable: deletes all existing rows for DEMO_USER_ID before inserting.
-- Run after supabase/schema.sql.
--
-- Note:
-- Production Supabase currently has public.ingresos.user_id as text.
-- The repo schema uses uuid. For compatibility, this seed uses demo_uid_text
-- only for public.ingresos and demo_uid uuid for all other tables.
-- ═══════════════════════════════════════════════════════════

do $$
declare
  demo_uid      uuid := 'aafa4170-1088-4343-a5b2-740aa480ae81';
  demo_uid_text text := 'aafa4170-1088-4343-a5b2-740aa480ae81';

  deuda1_id uuid := 'dd000001-0000-4000-a000-000000000001';
  deuda2_id uuid := 'dd000002-0000-4000-a000-000000000002';

  meta1_id  uuid := 'aa000001-0000-4000-a000-000000000001';
  meta2_id  uuid := 'aa000002-0000-4000-a000-000000000002';
  meta3_id  uuid := 'aa000003-0000-4000-a000-000000000003';
begin

-- ── CLEANUP (child tables first to respect FK constraints) ─────────────────
delete from public.abonos_meta      where user_id = demo_uid;
delete from public.abonos           where user_id = demo_uid;
delete from public.gastos_variables where user_id = demo_uid;
delete from public.gastos_fijos     where user_id = demo_uid;
delete from public.ingresos         where user_id = demo_uid_text;
delete from public.metas_ahorro     where user_id = demo_uid;
delete from public.deudas           where user_id = demo_uid;

-- ── PERFILES ──────────────────────────────────────────────────────────────
insert into public.perfiles (id, nombre, ingreso_quincenal, updated_at)
values (demo_uid, 'Valentina Ríos', 2500000, now())
on conflict (id) do update
  set nombre            = excluded.nombre,
      ingreso_quincenal = excluded.ingreso_quincenal,
      updated_at        = now();

-- ── INGRESOS ──────────────────────────────────────────────────────────────
insert into public.ingresos (user_id, monto, descripcion, fecha, periodo) values
  (demo_uid_text, 2500000, 'Quincena 1 — Agencia Digital',  '2026-03-01', '2026-03'),
  (demo_uid_text, 2500000, 'Quincena 2 — Agencia Digital',  '2026-03-16', '2026-03'),
  (demo_uid_text,  400000, 'Clase particular de diseño',    '2026-03-20', '2026-03'),
  (demo_uid_text, 2500000, 'Quincena 1 — Agencia Digital',  '2026-04-01', '2026-04'),
  (demo_uid_text, 2500000, 'Quincena 2 — Agencia Digital',  '2026-04-16', '2026-04'),
  (demo_uid_text,  350000, 'Comisión proyecto freelance',   '2026-04-10', '2026-04');

-- ── GASTOS FIJOS ──────────────────────────────────────────────────────────
insert into public.gastos_fijos (user_id, nombre, categoria, monto, pagado, periodo) values
  -- Marzo 2026
  (demo_uid, 'Arriendo',            'Vivienda',        800000, true,  '2026-03'),
  (demo_uid, 'Servicios públicos',  'Vivienda',        115000, true,  '2026-03'),
  (demo_uid, 'Internet hogar',      'Servicios',        65000, true,  '2026-03'),
  (demo_uid, 'Netflix',             'Entretenimiento',  24900, true,  '2026-03'),
  (demo_uid, 'Gimnasio',            'Salud',            70000, true,  '2026-03'),
  (demo_uid, 'Seguro de salud',     'Salud',           150000, true,  '2026-03'),
  (demo_uid, 'Transporte mensual',  'Transporte',      180000, true,  '2026-03'),
  (demo_uid, 'Spotify',             'Entretenimiento',  17900, true,  '2026-03'),
  -- Abril 2026
  (demo_uid, 'Arriendo',            'Vivienda',        800000, true,  '2026-04'),
  (demo_uid, 'Servicios públicos',  'Vivienda',        122000, false, '2026-04'),
  (demo_uid, 'Internet hogar',      'Servicios',        65000, true,  '2026-04'),
  (demo_uid, 'Netflix',             'Entretenimiento',  24900, true,  '2026-04'),
  (demo_uid, 'Gimnasio',            'Salud',            70000, false, '2026-04'),
  (demo_uid, 'Seguro de salud',     'Salud',           150000, true,  '2026-04'),
  (demo_uid, 'Transporte mensual',  'Transporte',      180000, true,  '2026-04'),
  (demo_uid, 'Spotify',             'Entretenimiento',  17900, true,  '2026-04');

-- ── GASTOS VARIABLES ──────────────────────────────────────────────────────
insert into public.gastos_variables (user_id, descripcion, categoria, monto, fecha, periodo) values
  -- Marzo 2026
  (demo_uid, 'Mercado semanal',       'Alimentación',    85000, '2026-03-02', '2026-03'),
  (demo_uid, 'Almuerzo restaurante',  'Alimentación',    22000, '2026-03-05', '2026-03'),
  (demo_uid, 'Taxi al aeropuerto',    'Transporte',      38000, '2026-03-07', '2026-03'),
  (demo_uid, 'Farmacia',              'Salud',           32000, '2026-03-10', '2026-03'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    79000, '2026-03-09', '2026-03'),
  (demo_uid, 'Salida cine',           'Entretenimiento', 28000, '2026-03-14', '2026-03'),
  (demo_uid, 'Ropa — blusa + jean',   'Ropa',           145000, '2026-03-15', '2026-03'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    91000, '2026-03-16', '2026-03'),
  (demo_uid, 'Café y snacks trabajo', 'Alimentación',    18000, '2026-03-18', '2026-03'),
  (demo_uid, 'Papelería',             'Otro',            12000, '2026-03-20', '2026-03'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    88000, '2026-03-23', '2026-03'),
  (demo_uid, 'Almuerzo con amigos',   'Alimentación',    35000, '2026-03-26', '2026-03'),
  (demo_uid, 'Recarga transporte',    'Transporte',      50000, '2026-03-28', '2026-03'),
  -- Abril 2026
  (demo_uid, 'Mercado semanal',       'Alimentación',    92000, '2026-04-01', '2026-04'),
  (demo_uid, 'Almuerzo ejecutivo',    'Alimentación',    19000, '2026-04-03', '2026-04'),
  (demo_uid, 'Uber al centro',        'Transporte',      14000, '2026-04-04', '2026-04'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    86000, '2026-04-07', '2026-04'),
  (demo_uid, 'Cena cumpleaños',       'Alimentación',    65000, '2026-04-08', '2026-04'),
  (demo_uid, 'Farmacia vitaminas',    'Salud',           47000, '2026-04-10', '2026-04'),
  (demo_uid, 'Recarga transporte',    'Transporte',      50000, '2026-04-11', '2026-04'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    94000, '2026-04-14', '2026-04'),
  (demo_uid, 'Libro diseño UX',       'Educación',       62000, '2026-04-16', '2026-04'),
  (demo_uid, 'Café coworking',        'Trabajo',         24000, '2026-04-17', '2026-04'),
  (demo_uid, 'Mercado semanal',       'Alimentación',    88000, '2026-04-21', '2026-04'),
  (demo_uid, 'Almuerzo restaurante',  'Alimentación',    26000, '2026-04-23', '2026-04'),
  (demo_uid, 'Regalo día de la madre','Otro',            80000, '2026-04-25', '2026-04');

-- ── DEUDAS ────────────────────────────────────────────────────────────────
insert into public.deudas (id, user_id, nombre, monto_total) values
  (deuda1_id, demo_uid, 'Tarjeta Bancolombia Visa', 3200000),
  (deuda2_id, demo_uid, 'Crédito libre inversión',  8500000);

-- ── ABONOS A DEUDAS ───────────────────────────────────────────────────────
insert into public.abonos (deuda_id, user_id, monto, nota, fecha) values
  (deuda1_id, demo_uid, 300000, 'Pago mínimo marzo',    '2026-03-20'),
  (deuda1_id, demo_uid, 500000, 'Abono extra quincena', '2026-04-01'),
  (deuda1_id, demo_uid, 300000, 'Pago mínimo abril',    '2026-04-20'),
  (deuda2_id, demo_uid, 450000, 'Cuota fija marzo',     '2026-03-05'),
  (deuda2_id, demo_uid, 450000, 'Cuota fija abril',     '2026-04-05'),
  (deuda2_id, demo_uid, 200000, 'Abono adicional',      '2026-04-18');

-- ── METAS DE AHORRO ───────────────────────────────────────────────────────
-- monto_actual must equal the sum of the corresponding abonos_meta rows below
insert into public.metas_ahorro (id, user_id, nombre, monto_meta, monto_actual) values
  (meta1_id, demo_uid, 'Viaje a Cartagena',   2000000,  850000),  -- 250k+300k+300k
  (meta2_id, demo_uid, 'Fondo de emergencia', 5000000, 1200000),  -- 400k+400k+400k
  (meta3_id, demo_uid, 'Laptop nueva',        3500000,  500000);  -- 200k+300k

-- ── ABONOS A METAS ────────────────────────────────────────────────────────
insert into public.abonos_meta (meta_id, user_id, monto, nota, fecha) values
  (meta1_id, demo_uid, 250000, 'Ahorro quincena enero', '2026-01-15'),
  (meta1_id, demo_uid, 300000, 'Bono trabajo',          '2026-02-10'),
  (meta1_id, demo_uid, 300000, 'Ahorro quincena marzo', '2026-03-15'),
  (meta2_id, demo_uid, 400000, 'Ahorro mes enero',      '2026-01-31'),
  (meta2_id, demo_uid, 400000, 'Ahorro mes febrero',    '2026-02-28'),
  (meta2_id, demo_uid, 400000, 'Ahorro mes marzo',      '2026-03-31'),
  (meta3_id, demo_uid, 200000, 'Freelance febrero',     '2026-02-20'),
  (meta3_id, demo_uid, 300000, 'Comisión marzo',        '2026-03-25');

end $$;