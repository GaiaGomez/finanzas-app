import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboard } from "@/app/dashboard/hooks/useDashboard";
import type {
  GastoFijo,
  GastoVariable,
  Ingreso,
  Deuda,
  Abono,
  MetaAhorro,
  AbonoMeta,
} from "@/types";

// ── Supabase mock ─────────────────────────────────────────────────────────────
//
// We need a chainable builder that is itself awaitable, so patterns like:
//   await supabase.from("t").update({}).eq("id", x)      → { error }
//   await supabase.from("t").insert({}).select().single() → { data, error }
// both resolve with `mockResult`.

let mockResult: { data: unknown; error: unknown } = { data: null, error: null };

function createBuilder() {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "filter", "match"]) {
    (b as any)[m] = vi.fn().mockReturnValue(b);
  }
  // .single() → explicit Promise
  (b as any).single = vi.fn().mockImplementation(() => Promise.resolve(mockResult));
  // Make the builder itself awaitable (Supabase v2 QueryBuilder is PromiseLike)
  (b as any).then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(mockResult).then(resolve, reject);
  return b;
}

const mockBuilder = createBuilder();
const mockFrom = vi.fn().mockReturnValue(mockBuilder);

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { signOut: vi.fn() },
  }),
}));

// ── Test data factories ───────────────────────────────────────────────────────

const makeFijo = (overrides: Partial<GastoFijo> = {}): GastoFijo => ({
  id: "fijo-1",
  user_id: "user-1",
  nombre: "Arriendo",
  categoria: "Casa",
  monto: 1_000_000,
  pagado: false,
  periodo: "2026-04",
  created_at: "2026-04-01T00:00:00Z",
  ...overrides,
});

const makeVar = (overrides: Partial<GastoVariable> = {}): GastoVariable => ({
  id: "var-1",
  user_id: "user-1",
  descripcion: "Almuerzo",
  categoria: "Comida fuera",
  monto: 50_000,
  fecha: "2026-04-10",
  periodo: "2026-04",
  created_at: "2026-04-10T00:00:00Z",
  ...overrides,
});

const makeIngreso = (overrides: Partial<Ingreso> = {}): Ingreso => ({
  id: "ing-1",
  user_id: "user-1",
  monto: 3_000_000,
  descripcion: "Salario",
  fecha: "2026-04-01",
  periodo: "2026-04",
  created_at: "2026-04-01T00:00:00Z",
  ...overrides,
});

const makeAbono = (overrides: Partial<Abono> = {}): Abono => ({
  id: "abono-1",
  deuda_id: "deuda-1",
  user_id: "user-1",
  monto: 100_000,
  nota: "",
  fecha: "2026-04-05",
  created_at: "2026-04-05T00:00:00Z",
  ...overrides,
});

const emptyProps = {
  userId: "user-1",
  periodoInicial: "2026-04",
  fijosIniciales: [] as GastoFijo[],
  variablesIniciales: [] as GastoVariable[],
  ingresosIniciales: [] as Ingreso[],
  deudasIniciales: [] as Deuda[],
  abonosIniciales: [] as Abono[],
  metasAhorroIniciales: [] as MetaAhorro[],
  abonosMetaIniciales: [] as AbonoMeta[],
};

// ── Tests: derived calculations ───────────────────────────────────────────────

describe("useDashboard — derived calculations", () => {
  const props = {
    ...emptyProps,
    ingresosIniciales: [makeIngreso({ monto: 3_000_000 })],
    fijosIniciales: [
      makeFijo({ id: "f1", monto: 1_000_000, pagado: true }),
      makeFijo({ id: "f2", monto: 500_000, pagado: false }),
    ],
    variablesIniciales: [
      makeVar({ id: "v1", monto: 200_000 }),
      makeVar({ id: "v2", monto: 100_000 }),
    ],
    abonosIniciales: [
      // Abono in current period — should count toward gastado
      makeAbono({ id: "a1", monto: 150_000, fecha: "2026-04-05" }),
      // Abono in a different period — should NOT count
      makeAbono({ id: "a2", monto: 999_000, fecha: "2026-03-28" }),
    ],
  };

  it("totalIngresos sums all incomes", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.totalIngresos).toBe(3_000_000);
  });

  it("gastadoFijos sums only pagado fijos", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.gastadoFijos).toBe(1_000_000);
  });

  it("totalFijos sums all fijos regardless of payment", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.totalFijos).toBe(1_500_000);
  });

  it("totalVars sums all variable expenses", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.totalVars).toBe(300_000);
  });

  it("totalAbonos only counts abonos whose fecha starts with the current periodo", () => {
    const { result } = renderHook(() => useDashboard(props));
    // Only a1 (2026-04-05) matches periodo "2026-04"
    expect(result.current.totalAbonos).toBe(150_000);
  });

  it("gastado = gastadoFijos + totalVars + totalAbonos", () => {
    const { result } = renderHook(() => useDashboard(props));
    // 1_000_000 + 300_000 + 150_000 = 1_450_000
    expect(result.current.gastado).toBe(1_450_000);
  });

  it("disponible = totalIngresos - gastado", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.disponible).toBe(3_000_000 - 1_450_000);
  });

  it("pct = gastado / totalIngresos × 100, capped at 100", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.pct).toBeCloseTo((1_450_000 / 3_000_000) * 100, 1);
  });

  it("pct is capped at 100 when overspent", () => {
    const overspentProps = {
      ...emptyProps,
      ingresosIniciales: [makeIngreso({ monto: 100_000 })],
      fijosIniciales: [makeFijo({ monto: 500_000, pagado: true })],
    };
    const { result } = renderHook(() => useDashboard(overspentProps));
    expect(result.current.pct).toBe(100);
  });

  it("pct is 0 when there are no incomes", () => {
    const { result } = renderHook(() => useDashboard(emptyProps));
    expect(result.current.pct).toBe(0);
  });

  it("cats lists unique categories from fijos", () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.cats).toContain("Casa");
    expect(new Set(result.current.cats).size).toBe(result.current.cats.length);
  });
});

// ── Tests: toggleFijo optimistic update ──────────────────────────────────────

describe("useDashboard — toggleFijo", () => {
  const props = {
    ...emptyProps,
    fijosIniciales: [makeFijo({ id: "f1", pagado: false })],
    ingresosIniciales: [makeIngreso({ monto: 3_000_000 })],
  };

  beforeEach(() => {
    mockResult = { data: null, error: null };
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockBuilder);
  });

  it("applies optimistic toggle immediately before DB call resolves", async () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.fijos[0].pagado).toBe(false);

    await act(async () => {
      await result.current.toggleFijo("f1", false);
    });

    expect(result.current.fijos[0].pagado).toBe(true);
  });

  it("marking paid updates gastadoFijos", async () => {
    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.gastadoFijos).toBe(0);

    await act(async () => {
      await result.current.toggleFijo("f1", false);
    });

    expect(result.current.gastadoFijos).toBe(1_000_000);
  });

  it("rolls back and sets error on DB failure", async () => {
    mockResult = { data: null, error: { message: "Connection lost" } };

    const { result } = renderHook(() => useDashboard(props));
    expect(result.current.fijos[0].pagado).toBe(false);

    await act(async () => {
      await result.current.toggleFijo("f1", false);
    });

    // State reverted
    expect(result.current.fijos[0].pagado).toBe(false);
    // Error surfaced to UI
    expect(result.current.error).toContain("Connection lost");
  });

  it("does nothing when userId is null", async () => {
    const guestProps = { ...props, userId: null };
    const { result } = renderHook(() => useDashboard(guestProps));

    await act(async () => {
      await result.current.toggleFijo("f1", false);
    });

    expect(result.current.fijos[0].pagado).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── Tests: initial UI state ───────────────────────────────────────────────────

describe("useDashboard — initial UI state", () => {
  it('starts on "fijos" tab', () => {
    const { result } = renderHook(() => useDashboard(emptyProps));
    expect(result.current.tab).toBe("fijos");
  });

  it("setTab changes the active tab", () => {
    const { result } = renderHook(() => useDashboard(emptyProps));
    act(() => result.current.setTab("resumen"));
    expect(result.current.tab).toBe("resumen");
  });

  it("periodo initialises from periodoInicial", () => {
    const { result } = renderHook(() => useDashboard({ ...emptyProps, periodoInicial: "2025-11" }));
    expect(result.current.periodo).toBe("2025-11");
  });

  it("modalIngreso starts closed", () => {
    const { result } = renderHook(() => useDashboard(emptyProps));
    expect(result.current.modalIngreso).toBe(false);
  });
});
