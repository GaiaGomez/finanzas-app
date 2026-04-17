// lib/env.ts — variables de entorno validadas
// Lanza un error descriptivo en arranque si falta alguna variable crítica

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable de entorno faltante: ${name}`);
  return value;
}

export const env = {
  supabaseUrl:  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseKey:  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};
