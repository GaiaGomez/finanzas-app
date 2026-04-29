import { fmtCOP } from "@/lib/utils";
import { ALERTA_ROJA, ALERTA_AMBER } from "@/lib/finance/constants";
import Bar from "@/components/ui/Bar";
import type { GastoFijo, GastoVariable, Ingreso, Abono } from "@/types";

interface Props {
  periodo: string;
  totalIngresos: number;
  gastado: number;
  disponible: number;
  pct: number;
  ingresos: Ingreso[];
  fijos: GastoFijo[];
  vars: GastoVariable[];
  abonos: Abono[];
}

export default function MonthSummary({
  periodo, totalIngresos, gastado, disponible, pct,
  ingresos, fijos, vars, abonos,
}: Props) {
  const abonosMes = abonos.filter(a => a.fecha?.startsWith(periodo)).length;

  return (
    <>
      {/* Barra de gasto vs ingresos */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-brand-muted">Gastado del mes</span>
          <span className={`font-bold ${pct >= ALERTA_ROJA ? "text-brand-red" : pct >= ALERTA_AMBER ? "text-brand-yellow" : "text-brand-green"}`}>
            {totalIngresos > 0 ? `${pct.toFixed(1)}%` : "Sin ingresos"}
          </span>
        </div>
        <Bar val={gastado} total={Math.max(totalIngresos, 1)} color="#a78bfa" />
      </div>

      {/* Stats: ingresos / gastado / disponible */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Ingresos",
            val: totalIngresos,
            color: "text-brand-green",
            sub: `${ingresos.length} registros`,
          },
          {
            label: "Gastado",
            val: gastado,
            color: "text-brand-red",
            sub: `${fijos.filter(g => g.pagado).length} fijos · ${vars.length} var · ${abonosMes} abonos`,
          },
          {
            label: "Disponible",
            val: disponible,
            color: disponible >= 0 ? "text-brand-purple" : "text-brand-red",
            sub: disponible < 0 ? "⚠️ déficit" : "libre",
          },
        ].map((s, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-[9px] text-brand-muted uppercase tracking-wider">{s.label}</span>
            <span className={`text-sm font-extrabold font-mono ${s.color}`}>{fmtCOP(s.val)}</span>
            <span className="text-[9px] text-brand-muted">{s.sub}</span>
          </div>
        ))}
      </div>
    </>
  );
}
