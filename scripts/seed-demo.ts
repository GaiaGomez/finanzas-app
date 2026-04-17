/**
 * Seed script — creates the demo user and 3 months of realistic data.
 *
 * Prerequisites:
 *   1. Set env vars (copy from .env.local + add service role key):
 *        export NEXT_PUBLIC_SUPABASE_URL=...
 *        export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 *        export SUPABASE_SERVICE_ROLE_KEY=...
 *   2. Run:
 *        npx tsx scripts/seed-demo.ts
 *
 * The script is idempotent — running it twice clears old demo data first.
 */

import { createClient } from "@supabase/supabase-js";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/demo";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── helpers ──────────────────────────────────────────────────────────────────

function ok(label: string, error: unknown) {
  if (error) { console.error(`✗ ${label}`, error); process.exit(1); }
  console.log(`✓ ${label}`);
}

// ── fijos template (same items repeated for each period) ──────────────────

const FIJOS_TEMPLATE = [
  { nombre: "Arriendo",        categoria: "Casa",              monto: 900_000 },
  { nombre: "Psicología",      categoria: "Apoyo profesional", monto: 200_000 },
  { nombre: "Transporte",      categoria: "Transporte",        monto: 260_000 },
  { nombre: "WiFi",            categoria: "Suscripciones",     monto: 65_000  },
  { nombre: "Servicios",       categoria: "Casa",              monto: 150_000 },
  { nombre: "Netflix",         categoria: "Suscripciones",     monto: 22_900  },
  { nombre: "Spotify",         categoria: "Suscripciones",     monto: 17_900  },
  { nombre: "Gym",             categoria: "Educación",         monto: 95_000  },
  { nombre: "Cuota celular",   categoria: "Deuda",             monto: 150_000 },
  { nombre: "Ahorro digital",  categoria: "Ahorro",            monto: 250_000 },
];

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Create or reuse demo user
  let userId: string;
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users.find(u => u.email === DEMO_EMAIL);

  if (found) {
    userId = found.id;
    console.log("→ Demo user exists, resetting data…");
    // wipe old demo data
    await supabase.from("abonos").delete().eq("user_id", userId);
    await supabase.from("deudas").delete().eq("user_id", userId);
    await supabase.from("gastos_variables").delete().eq("user_id", userId);
    await supabase.from("gastos_fijos").delete().eq("user_id", userId);
    await supabase.from("ingresos").delete().eq("user_id", userId);
    ok("Datos anteriores eliminados", null);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    ok("Usuario demo creado", error);
    userId = data.user!.id;
  }

  // 2. Ingresos — 2 quincenas por mes
  const ingresos = [
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 1", fecha: "2026-02-01", periodo: "2026-02" },
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 2", fecha: "2026-02-16", periodo: "2026-02" },
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 1", fecha: "2026-03-01", periodo: "2026-03" },
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 2", fecha: "2026-03-16", periodo: "2026-03" },
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 1", fecha: "2026-04-01", periodo: "2026-04" },
    { user_id: userId, monto: 1_600_000, descripcion: "Quincena 2", fecha: "2026-04-16", periodo: "2026-04" },
  ];
  const { error: errI } = await supabase.from("ingresos").insert(ingresos);
  ok("Ingresos (6)", errI);

  // 3. Gastos fijos — feb: gym sin pagar; mar+abr: todos pagados
  const fijos = [
    ...FIJOS_TEMPLATE.map(f => ({
      ...f, user_id: userId, periodo: "2026-02",
      pagado: f.nombre !== "Gym",
    })),
    ...FIJOS_TEMPLATE.map(f => ({
      ...f, user_id: userId, periodo: "2026-03", pagado: true,
    })),
    ...FIJOS_TEMPLATE.map(f => ({
      ...f, user_id: userId, periodo: "2026-04", pagado: true,
    })),
  ];
  const { error: errF } = await supabase.from("gastos_fijos").insert(fijos);
  ok(`Gastos fijos (${fijos.length})`, errF);

  // 4. Gastos variables
  const variables = [
    // Febrero — mes caótico
    { user_id: userId, descripcion: "Domicilio sushi",   categoria: "Comida fuera",    monto: 38_000, fecha: "2026-02-04", periodo: "2026-02" },
    { user_id: userId, descripcion: "Café Juan Valdez",  categoria: "Comida fuera",    monto: 22_500, fecha: "2026-02-06", periodo: "2026-02" },
    { user_id: userId, descripcion: "Uber noche",        categoria: "Transporte extra", monto: 45_000, fecha: "2026-02-08", periodo: "2026-02" },
    { user_id: userId, descripcion: "Almuerzo coworking",categoria: "Comida fuera",    monto: 28_000, fecha: "2026-02-11", periodo: "2026-02" },
    { user_id: userId, descripcion: "Blusa ZARA",        categoria: "Ropa",            monto: 65_000, fecha: "2026-02-14", periodo: "2026-02" },
    { user_id: userId, descripcion: "Pizza viernes",     categoria: "Comida fuera",    monto: 35_000, fecha: "2026-02-17", periodo: "2026-02" },
    { user_id: userId, descripcion: "Medicamentos",      categoria: "Salud",           monto: 25_000, fecha: "2026-02-20", periodo: "2026-02" },
    { user_id: userId, descripcion: "Antojo helado",     categoria: "Otro",            monto: 18_000, fecha: "2026-02-22", periodo: "2026-02" },
    { user_id: userId, descripcion: "Rappi comida",      categoria: "Comida fuera",    monto: 32_000, fecha: "2026-02-25", periodo: "2026-02" },

    // Marzo — mejorando
    { user_id: userId, descripcion: "Café",              categoria: "Comida fuera",    monto: 18_000, fecha: "2026-03-03", periodo: "2026-03" },
    { user_id: userId, descripcion: "Almuerzo trabajo",  categoria: "Comida fuera",    monto: 26_000, fecha: "2026-03-07", periodo: "2026-03" },
    { user_id: userId, descripcion: "Uber",              categoria: "Transporte extra", monto: 32_000, fecha: "2026-03-10", periodo: "2026-03" },
    { user_id: userId, descripcion: "Domicilio",         categoria: "Comida fuera",    monto: 29_000, fecha: "2026-03-14", periodo: "2026-03" },
    { user_id: userId, descripcion: "Cine",              categoria: "Entretenimiento", monto: 28_000, fecha: "2026-03-16", periodo: "2026-03" },
    { user_id: userId, descripcion: "Antojo",            categoria: "Otro",            monto: 22_000, fecha: "2026-03-19", periodo: "2026-03" },
    { user_id: userId, descripcion: "Farmacia",          categoria: "Salud",           monto: 35_000, fecha: "2026-03-24", periodo: "2026-03" },

    // Abril — mejor mes
    { user_id: userId, descripcion: "Café",              categoria: "Comida fuera",    monto: 15_000, fecha: "2026-04-02", periodo: "2026-04" },
    { user_id: userId, descripcion: "Almuerzo",          categoria: "Comida fuera",    monto: 22_000, fecha: "2026-04-08", periodo: "2026-04" },
    { user_id: userId, descripcion: "Uber",              categoria: "Transporte extra", monto: 20_000, fecha: "2026-04-11", periodo: "2026-04" },
    { user_id: userId, descripcion: "Domicilio",         categoria: "Comida fuera",    monto: 18_000, fecha: "2026-04-15", periodo: "2026-04" },
    { user_id: userId, descripcion: "Antojo",            categoria: "Otro",            monto: 18_000, fecha: "2026-04-17", periodo: "2026-04" },
  ];
  const { error: errV } = await supabase.from("gastos_variables").insert(variables);
  ok(`Gastos variables (${variables.length})`, errV);

  // 5. Deudas
  const { data: deudaRows, error: errD } = await supabase
    .from("deudas")
    .insert([
      { user_id: userId, nombre: "Tarjeta de crédito", monto_total: 2_500_000 },
      { user_id: userId, nombre: "Préstamo familiar",  monto_total: 800_000  },
    ])
    .select();
  ok("Deudas (2)", errD);

  const [tarjeta, familiar] = deudaRows!;

  // 6. Abonos — tendencia de mejora mes a mes
  const abonos = [
    { deuda_id: tarjeta.id, user_id: userId, monto: 250_000, nota: "Pago mínimo",  fecha: "2026-02-28" },
    { deuda_id: tarjeta.id, user_id: userId, monto: 300_000, nota: "",             fecha: "2026-03-31" },
    { deuda_id: tarjeta.id, user_id: userId, monto: 350_000, nota: "Buen mes 💪",  fecha: "2026-04-15" },
    { deuda_id: familiar.id, user_id: userId, monto: 80_000,  nota: "",            fecha: "2026-02-28" },
    { deuda_id: familiar.id, user_id: userId, monto: 100_000, nota: "",            fecha: "2026-03-28" },
    { deuda_id: familiar.id, user_id: userId, monto: 120_000, nota: "Casi listo!", fecha: "2026-04-10" },
  ];
  const { error: errA } = await supabase.from("abonos").insert(abonos);
  ok(`Abonos (${abonos.length})`, errA);

  console.log("\n✅ Demo seeded successfully!");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
}

main().catch(e => { console.error(e); process.exit(1); });
