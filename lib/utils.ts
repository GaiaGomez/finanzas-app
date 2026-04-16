// lib/utils.ts — funciones de utilidad reutilizables

// Formatea un número como pesos colombianos: 1500000 → "$1.500.000"
export function fmtCOP(n: number): string {
  if (isNaN(n) || n == null) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}

// Devuelve el periodo actual como "2026-04"
export function getPeriodo(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Etiqueta legible: "Abril 2026"
export function getPeriodoLabel(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const mes = d.toLocaleDateString("es-CO", { month: "long" });
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${y}`;
}

// Avanza al periodo siguiente: "2026-04" → "2026-05"
export function nextPeriodo(p: string): string {
  const [y, m] = p.split("-").map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

// Retrocede al periodo anterior: "2026-04" → "2026-03"
export function prevPeriodo(p: string): string {
  const [y, m] = p.split("-").map(Number);
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

// Colores por categoría
export const COLOR_CAT: Record<string, string> = {
  "Apoyo profesional": "#a78bfa",
  "Casa":              "#34d399",
  "Transporte":        "#fbbf24",
  "Educación":         "#60a5fa",
  "Suscripciones":     "#f472b6",
  "Deuda":             "#f87171",
  "Ahorro":            "#4ade80",
  "Nicotina":          "#fb923c",
  "Cuidado personal":  "#e879f9",
  "Comida fuera":      "#facc15",
  "Entretenimiento":   "#38bdf8",
  "Ropa":              "#a3e635",
  "Salud":             "#2dd4bf",
  "Transporte extra":  "#fcd34d",
  "Otro":              "#94a3b8",
};
