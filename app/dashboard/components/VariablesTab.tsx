import { fmtCOP, COLOR_CAT } from "@/lib/utils";
import { CATS_VARIABLES, INPUT_CLS, LIMITE_VARIABLES_PCT } from "@/lib/constants";
import Bar from "@/components/ui/Bar";
import Dot from "@/components/ui/Dot";
import Editable from "@/components/ui/Editable";
import type { GastoVariable } from "@/types";

interface Props {
  vars: GastoVariable[];
  totalVars: number;
  totalIngresos: number;
  disponible: number;
  saving: boolean;
  formVar: boolean;
  setFormVar: (v: boolean) => void;
  nVar: { descripcion: string; categoria: string; monto: string };
  setNVar: (v: { descripcion: string; categoria: string; monto: string }) => void;
  onEdit: (id: string, campo: keyof GastoVariable, valor: string | number) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function VariablesTab({
  vars, totalVars, totalIngresos, disponible, saving,
  formVar, setFormVar, nVar, setNVar,
  onEdit, onDelete, onAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Card de disponible */}
      <div
        className={`border rounded-2xl p-4 ${disponible >= 0 ? "border-brand-purple/30 bg-[#110e1f]" : "border-brand-red/30 bg-[#1a0d0d]"}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-brand-muted uppercase tracking-wider">Disponible ahora</p>
            <p className="text-[11px] text-brand-muted mt-0.5">Ingresos − fijos pagados − variables</p>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${disponible >= 0 ? "text-brand-purple" : "text-brand-red"}`}>
            {fmtCOP(disponible)}
          </span>
        </div>
      </div>

      {/* Barra de variables vs límite */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#94a3b8]">Total variables</span>
          <span className="text-lg font-extrabold font-mono text-brand-yellow">{fmtCOP(totalVars)}</span>
        </div>
        <Bar val={totalVars} total={Math.max(totalIngresos * LIMITE_VARIABLES_PCT, 1)} color="#fbbf24" />
        <p className="text-[11px] text-brand-muted mt-1.5">
          Ref. {LIMITE_VARIABLES_PCT * 100}% ingresos: {fmtCOP(totalIngresos * LIMITE_VARIABLES_PCT)} · {vars.length} gastos
        </p>
      </div>

      {/* Formulario / botón agregar */}
      {formVar ? (
        <div className="bg-brand-card border border-brand-yellow/30 rounded-2xl p-4">
          <p className="text-xs text-brand-yellow font-bold mb-3">Registrar gasto</p>
          <div className="flex flex-col gap-2">
            <input value={nVar.descripcion}
              onChange={e => setNVar({ ...nVar, descripcion: e.target.value })}
              placeholder="¿En qué gastaste?" className={INPUT_CLS}
              onKeyDown={e => e.key === "Enter" && onAdd()} />
            <div className="flex gap-2">
              <select value={nVar.categoria}
                onChange={e => setNVar({ ...nVar, categoria: e.target.value })}
                className={`${INPUT_CLS} flex-1`}>
                {CATS_VARIABLES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={nVar.monto}
                onChange={e => setNVar({ ...nVar, monto: e.target.value })}
                placeholder="Monto" className={`${INPUT_CLS} w-32 text-right font-mono`}
                onKeyDown={e => e.key === "Enter" && onAdd()} />
            </div>
            <div className="flex gap-2">
              <button onClick={onAdd} disabled={saving}
                className="flex-1 bg-brand-yellow text-brand-bg font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "Guardando…" : "Registrar"}
              </button>
              <button onClick={() => setFormVar(false)}
                className="bg-[#1e1b2e] text-brand-muted font-semibold px-4 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormVar(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-[#2a2440] text-brand-muted text-sm font-semibold hover:border-brand-yellow hover:text-brand-yellow transition-colors">
          + Registrar gasto variable
        </button>
      )}

      {/* Lista de variables */}
      {vars.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center text-brand-muted text-sm">
          Sin gastos registrados este mes 🎉
        </div>
      ) : vars.map(g => (
        <div key={g.id} className="bg-brand-card border border-brand-border rounded-2xl p-3.5 flex items-center gap-3">
          <Dot cat={g.categoria} />
          <div className="flex-1 min-w-0">
            <Editable value={g.descripcion} tipo="text"
              onSave={v => onEdit(g.id, "descripcion", v)}
              className="text-sm font-medium block" />
            <div className="flex gap-2 mt-1 items-center">
              <Editable value={g.categoria} tipo="select" opciones={[...CATS_VARIABLES]}
                onSave={v => onEdit(g.id, "categoria", v)}
                className="text-[10px]"
                style={{ color: COLOR_CAT[g.categoria] ?? "#64748b" }} />
              <span className="text-[10px] text-brand-muted">
                {new Date(g.fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
          <Editable value={g.monto} tipo="number"
            onSave={v => onEdit(g.id, "monto", v as number)}
            className="text-sm font-bold font-mono text-brand-yellow" />
          <button onClick={() => onDelete(g.id)}
            className="text-[#2a2440] hover:text-brand-red text-lg leading-none transition-colors ml-1">×</button>
        </div>
      ))}
    </div>
  );
}
