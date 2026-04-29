import { describe, it, expect } from "vitest";
import {
  calcTotalIngresos,
  calcGastadoFijos,
  calcTotalFijos,
  calcTotalVars,
  calcTotalAbonos,
  calcGastado,
  calcDisponible,
  calcPct,
  calcCats,
} from "@/lib/finance/calculations";
import type { GastoFijo, GastoVariable, Ingreso, Abono, Categoria } from "@/types";

// ── Factories ─────────────────────────────────────────────────────────────────

const fijo = (monto: number, pagado: boolean, categoria: Categoria = "Casa"): GastoFijo => ({
  id: String(Math.random()), user_id: "u", nombre: "x", categoria,
  monto, pagado, periodo: "2026-04", created_at: "",
});

const variable = (monto: number): GastoVariable => ({
  id: String(Math.random()), user_id: "u", descripcion: "y",
  categoria: "Otro", monto, fecha: "2026-04-10",
  periodo: "2026-04", created_at: "",
});

const ingreso = (monto: number): Ingreso => ({
  id: String(Math.random()), user_id: "u", monto, descripcion: "Pago",
  fecha: "2026-04-01", periodo: "2026-04", created_at: "",
});

const abono = (monto: number, fecha: string): Abono => ({
  id: String(Math.random()), user_id: "u", deuda_id: "d",
  monto, nota: "", fecha, created_at: "",
});

// ── calcTotalIngresos ─────────────────────────────────────────────────────────

describe("calcTotalIngresos", () => {
  it("sums all incomes", () => {
    expect(calcTotalIngresos([ingreso(1_000_000), ingreso(500_000)])).toBe(1_500_000);
  });
  it("returns 0 for empty array", () => {
    expect(calcTotalIngresos([])).toBe(0);
  });
});

// ── calcGastadoFijos ──────────────────────────────────────────────────────────

describe("calcGastadoFijos", () => {
  it("sums only paid fijos", () => {
    expect(calcGastadoFijos([
      fijo(800_000, true),
      fijo(200_000, false),
    ])).toBe(800_000);
  });
  it("returns 0 when none are paid", () => {
    expect(calcGastadoFijos([fijo(500_000, false)])).toBe(0);
  });
  it("returns 0 for empty array", () => {
    expect(calcGastadoFijos([])).toBe(0);
  });
});

// ── calcTotalFijos ────────────────────────────────────────────────────────────

describe("calcTotalFijos", () => {
  it("sums all fijos regardless of pagado", () => {
    expect(calcTotalFijos([fijo(1_000_000, true), fijo(500_000, false)])).toBe(1_500_000);
  });
  it("returns 0 for empty array", () => {
    expect(calcTotalFijos([])).toBe(0);
  });
});

// ── calcTotalVars ─────────────────────────────────────────────────────────────

describe("calcTotalVars", () => {
  it("sums all variable expenses", () => {
    expect(calcTotalVars([variable(100_000), variable(50_000)])).toBe(150_000);
  });
  it("returns 0 for empty array", () => {
    expect(calcTotalVars([])).toBe(0);
  });
});

// ── calcTotalAbonos ───────────────────────────────────────────────────────────

describe("calcTotalAbonos", () => {
  it("only counts abonos whose fecha starts with the given periodo", () => {
    expect(calcTotalAbonos([
      abono(100_000, "2026-04-05"),
      abono(999_000, "2026-03-28"),
    ], "2026-04")).toBe(100_000);
  });
  it("counts multiple abonos in the same period", () => {
    expect(calcTotalAbonos([
      abono(50_000, "2026-04-01"),
      abono(75_000, "2026-04-15"),
    ], "2026-04")).toBe(125_000);
  });
  it("returns 0 when no abonos match the period", () => {
    expect(calcTotalAbonos([abono(500_000, "2026-03-10")], "2026-04")).toBe(0);
  });
  it("returns 0 for empty array", () => {
    expect(calcTotalAbonos([], "2026-04")).toBe(0);
  });
});

// ── calcGastado ───────────────────────────────────────────────────────────────

describe("calcGastado", () => {
  it("sums gastadoFijos + totalVars + totalAbonos", () => {
    expect(calcGastado(500_000, 200_000, 100_000)).toBe(800_000);
  });
  it("returns 0 when all inputs are 0", () => {
    expect(calcGastado(0, 0, 0)).toBe(0);
  });
});

// ── calcDisponible ────────────────────────────────────────────────────────────

describe("calcDisponible", () => {
  it("subtracts gastado from totalIngresos", () => {
    expect(calcDisponible(3_000_000, 1_000_000)).toBe(2_000_000);
  });
  it("returns a negative value when overspent", () => {
    expect(calcDisponible(100_000, 500_000)).toBe(-400_000);
  });
});

// ── calcPct ───────────────────────────────────────────────────────────────────

describe("calcPct", () => {
  it("returns correct percentage", () => {
    expect(calcPct(1_500_000, 3_000_000)).toBeCloseTo(50, 1);
  });
  it("is capped at 100 when overspent", () => {
    expect(calcPct(500_000, 100_000)).toBe(100);
  });
  it("returns 0 when totalIngresos is 0", () => {
    expect(calcPct(0, 0)).toBe(0);
  });
  it("returns 0 when gastado is 0", () => {
    expect(calcPct(0, 3_000_000)).toBe(0);
  });
});

// ── calcCats ──────────────────────────────────────────────────────────────────

describe("calcCats", () => {
  it("returns unique categories from fijos", () => {
    const result = calcCats([fijo(100, true, "Casa"), fijo(200, false, "Ahorro"), fijo(300, true, "Casa")]);
    expect(result).toEqual(["Casa", "Ahorro"]);
    expect(new Set(result).size).toBe(result.length);
  });
  it("returns empty array for no fijos", () => {
    expect(calcCats([])).toEqual([]);
  });
});
