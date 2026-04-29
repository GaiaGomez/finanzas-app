import type { GastoFijo, GastoVariable, Ingreso, Abono } from "@/types";

export function calcTotalIngresos(ingresos: Ingreso[]): number {
  return ingresos.reduce((s, i) => s + i.monto, 0);
}

export function calcGastadoFijos(fijos: GastoFijo[]): number {
  return fijos.filter(g => g.pagado).reduce((s, g) => s + g.monto, 0);
}

export function calcTotalFijos(fijos: GastoFijo[]): number {
  return fijos.reduce((s, g) => s + g.monto, 0);
}

export function calcTotalVars(vars: GastoVariable[]): number {
  return vars.reduce((s, g) => s + g.monto, 0);
}

export function calcTotalAbonos(abonos: Abono[], periodo: string): number {
  return abonos.filter(a => a.fecha?.startsWith(periodo)).reduce((s, a) => s + a.monto, 0);
}

export function calcGastado(gastadoFijos: number, totalVars: number, totalAbonos: number): number {
  return gastadoFijos + totalVars + totalAbonos;
}

export function calcDisponible(totalIngresos: number, gastado: number): number {
  return totalIngresos - gastado;
}

export function calcPct(gastado: number, totalIngresos: number): number {
  return totalIngresos > 0 ? Math.min((gastado / totalIngresos) * 100, 100) : 0;
}

export function calcCats(fijos: GastoFijo[]): string[] {
  return [...new Set(fijos.map(g => g.categoria))];
}
