import { describe, it, expect } from "vitest";
import {
  fmtCOP,
  getPeriodo,
  getPeriodoLabel,
  nextPeriodo,
  prevPeriodo,
} from "@/lib/utils";

// ── fmtCOP ───────────────────────────────────────────────────────────────────

describe("fmtCOP", () => {
  it("returns $0 for 0", () => {
    expect(fmtCOP(0)).toBe("$0");
  });

  it("returns $0 for NaN", () => {
    expect(fmtCOP(NaN)).toBe("$0");
  });

  it("rounds decimals up", () => {
    // 1500.7 → rounds to 1501
    const result = fmtCOP(1500.7);
    expect(result.startsWith("$")).toBe(true);
    expect(result.replace(/[^0-9]/g, "")).toBe("1501");
  });

  it("rounds decimals down", () => {
    const result = fmtCOP(1500.2);
    expect(result.replace(/[^0-9]/g, "")).toBe("1500");
  });

  it("formats a large number with the correct digits", () => {
    const result = fmtCOP(1_500_000);
    expect(result.startsWith("$")).toBe(true);
    // Strip everything except digits and check the numeric value
    expect(result.replace(/[^0-9]/g, "")).toBe("1500000");
  });

  it("handles small positive amount", () => {
    const result = fmtCOP(5000);
    expect(result.startsWith("$")).toBe(true);
    expect(result.replace(/[^0-9]/g, "")).toBe("5000");
  });
});

// ── getPeriodo ────────────────────────────────────────────────────────────────

describe("getPeriodo", () => {
  it("returns a string in YYYY-MM format", () => {
    expect(getPeriodo()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("reflects the current year and month", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(getPeriodo()).toBe(expected);
  });
});

// ── getPeriodoLabel ───────────────────────────────────────────────────────────

describe("getPeriodoLabel", () => {
  it("includes the year", () => {
    expect(getPeriodoLabel("2026-04")).toContain("2026");
  });

  it("starts with an uppercase letter", () => {
    const label = getPeriodoLabel("2026-04");
    expect(label[0]).toMatch(/[A-ZÁÉÍÓÚ]/);
  });

  it("matches the pattern «Month Year»", () => {
    // e.g. "Abril 2026"
    expect(getPeriodoLabel("2026-04")).toMatch(/^\S+ 2026$/);
  });

  it("differs across months", () => {
    expect(getPeriodoLabel("2026-01")).not.toBe(getPeriodoLabel("2026-07"));
  });
});

// ── nextPeriodo ───────────────────────────────────────────────────────────────

describe("nextPeriodo", () => {
  it("advances month by one", () => {
    expect(nextPeriodo("2026-04")).toBe("2026-05");
  });

  it("wraps December to January and increments year", () => {
    expect(nextPeriodo("2026-12")).toBe("2027-01");
  });

  it("pads single-digit months with leading zero", () => {
    expect(nextPeriodo("2026-08")).toBe("2026-09");
  });

  it("handles January correctly", () => {
    expect(nextPeriodo("2026-01")).toBe("2026-02");
  });
});

// ── prevPeriodo ───────────────────────────────────────────────────────────────

describe("prevPeriodo", () => {
  it("retreats month by one", () => {
    expect(prevPeriodo("2026-04")).toBe("2026-03");
  });

  it("wraps January to December and decrements year", () => {
    expect(prevPeriodo("2026-01")).toBe("2025-12");
  });

  it("pads single-digit months with leading zero", () => {
    expect(prevPeriodo("2026-10")).toBe("2026-09");
  });

  it("handles December correctly", () => {
    expect(prevPeriodo("2026-12")).toBe("2026-11");
  });
});

// ── nextPeriodo / prevPeriodo are inverse operations ─────────────────────────

describe("nextPeriodo and prevPeriodo are inverses", () => {
  const cases = ["2026-04", "2026-01", "2026-12", "2025-06"];

  for (const p of cases) {
    it(`round-trip for ${p}`, () => {
      expect(prevPeriodo(nextPeriodo(p))).toBe(p);
      expect(nextPeriodo(prevPeriodo(p))).toBe(p);
    });
  }
});
