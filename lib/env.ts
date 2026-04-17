// lib/env.ts — variables de entorno validadas
// Usa dot-notation estática para que Next.js pueda inlinear NEXT_PUBLIC_* en el bundle del cliente

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("Variable de entorno faltante: NEXT_PUBLIC_SUPABASE_URL");
if (!key) throw new Error("Variable de entorno faltante: NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const env = {
  supabaseUrl: url,
  supabaseKey: key,
};
