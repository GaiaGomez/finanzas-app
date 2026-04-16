// lib/utils.ts — funciones de utilidad reutilizables

// Formatea un número como pesos colombianos: 1500000 → "$1.500.000"
export function fmtCOP(n: number): string {
  if (isNaN(n) || n == null) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}

// Devuelve la clave de quincena actual: "2024-04-Q1" o "2024-04-Q2"
export function getQuincenaKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const q = d.getDate() <= 15 ? "Q1" : "Q2";
  return `${year}-${month}-${q}`;
}

// Etiqueta legible: "Quincena del 1 al 15 de Abril 2024"
export function getQuincenaLabel(): string {
  const d = new Date();
  const mes = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const q = d.getDate() <= 15 ? "1 al 15" : "16 al fin";
  return `Quincena del ${q} de ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
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
