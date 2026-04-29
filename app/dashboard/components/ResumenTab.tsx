import { fmtCOP, getPeriodoLabel, COLOR_CAT } from "@/lib/utils";
import { LIMITE_VARIABLES_PCT } from "@/lib/finance/constants";
import Bar from "@/components/ui/Bar";
import Dot from "@/components/ui/Dot";
import type { GastoFijo, GastoVariable } from "@/types";

interface Props {
  periodo: string;
  totalIngresos: number;
  gastadoFijos: number;
  totalVars: number;
  totalAbonos: number;
  totalFijos: number;
  disponible: number;
  fijos: GastoFijo[];
  vars: GastoVariable[];
}

export default function ResumenTab({
  periodo, totalIngresos, gastadoFijos, totalVars, totalAbonos,
  totalFijos, disponible, fijos, vars,
}: Props) {
  const catMap: Record<string, number> = {};
  fijos.filter(g => g.pagado).forEach(g => { catMap[g.categoria] = (catMap[g.categoria] || 0) + g.monto; });
  vars.forEach(g => { catMap[g.categoria] = (catMap[g.categoria] || 0) + g.monto; });
  const totGastado = Object.values(catMap).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Flujo del mes */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">
          Flujo de {getPeriodoLabel(periodo)}
        </p>
        {[
          { label: "Total ingresos",  val: totalIngresos,             color: "text-brand-green",  signo: "+",   border: true },
          { label: "Fijos pagados",   val: gastadoFijos,              color: "text-brand-red",    signo: "−",   border: true },
          { label: "Gastos variables",val: totalVars,                 color: "text-brand-yellow", signo: "−",   border: true },
          { label: "Abonos a deudas", val: totalAbonos,               color: "text-brand-red",    signo: "−",   border: true },
          { label: "Fijos pendientes",val: totalFijos - gastadoFijos, color: "text-[#94a3b8]",    signo: "(−)", border: false, dim: true },
          { label: "Disponible real", val: disponible,                color: disponible >= 0 ? "text-brand-purple" : "text-brand-red", signo: "=", border: false, bold: true },
        ].map((r, i) => (
          <div key={i} className={`flex justify-between items-center py-2.5 ${r.border ? "border-b border-brand-border" : ""} ${r.dim ? "opacity-40" : ""}`}>
            <span className={`text-sm text-[#94a3b8] ${r.bold ? "font-bold" : ""} ${r.dim ? "italic" : ""}`}>{r.label}</span>
            <span className={`font-mono text-sm font-extrabold ${r.color}`}>{r.signo} {fmtCOP(r.val)}</span>
          </div>
        ))}
      </div>

      {/* Lo que ya salió por categoría */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Lo que ya salió</p>
        {totGastado === 0 ? (
          <p className="text-brand-muted text-sm">Nada gastado todavía.</p>
        ) : (
          Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, m]) => (
            <div key={cat} className="mb-3">
              <div className="flex justify-between mb-1">
                <div className="flex items-center gap-2"><Dot cat={cat} /><span className="text-sm">{cat}</span></div>
                <div className="flex gap-3 items-center">
                  <span className="text-[11px] text-brand-muted">{((m / totGastado) * 100).toFixed(1)}%</span>
                  <span className="font-mono text-sm font-bold">{fmtCOP(m)}</span>
                </div>
              </div>
              <Bar val={m} total={totGastado} color={COLOR_CAT[cat] ?? ""} />
            </div>
          ))
        )}
      </div>

      {/* Diagnóstico */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Diagnóstico</p>
        {[
          {
            ok: disponible >= 0,
            label: "Dentro del presupuesto",
            msg: disponible >= 0 ? `Te quedan ${fmtCOP(disponible)}` : `Déficit ${fmtCOP(Math.abs(disponible))}`,
            border: true,
          },
          {
            ok: totalVars <= totalIngresos * LIMITE_VARIABLES_PCT,
            label: `Variables ≤ ${LIMITE_VARIABLES_PCT * 100}% ingresos`,
            msg: `${fmtCOP(totalVars)} de ${fmtCOP(totalIngresos * LIMITE_VARIABLES_PCT)}`,
            border: true,
          },
          {
            ok: fijos.filter(g => g.pagado).length === fijos.length && fijos.length > 0,
            label: "Todos los fijos pagados",
            msg: `${fijos.filter(g => g.pagado).length}/${fijos.length} marcados`,
            border: true,
          },
          {
            ok: totalIngresos >= totalFijos,
            label: "Ingresos cubren todos los fijos",
            msg: totalIngresos >= totalFijos
              ? `Sobran ${fmtCOP(totalIngresos - totalFijos)}`
              : `Déficit ${fmtCOP(totalFijos - totalIngresos)}`,
            border: false,
          },
        ].map((item, i) => (
          <div key={i} className={`flex justify-between items-center py-2.5 ${item.border ? "border-b border-brand-border" : ""}`}>
            <div className="flex items-center gap-2.5">
              <span>{item.ok ? "✅" : "⚠️"}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className={`text-xs text-right max-w-40 ${item.ok ? "text-brand-green" : "text-brand-yellow"}`}>{item.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
