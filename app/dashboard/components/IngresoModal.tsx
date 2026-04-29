import { fmtCOP, getPeriodoLabel } from "@/lib/utils";
import { INPUT_CLS } from "@/lib/ui/classes";
import type { Ingreso } from "@/types";

interface Props {
  periodo: string;
  ingresos: Ingreso[];
  draft: { monto: string; descripcion: string };
  saving: boolean;
  onClose: () => void;
  onChange: (v: { monto: string; descripcion: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function IngresoModal({
  periodo, ingresos, draft, saving,
  onClose, onChange, onAdd, onDelete,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-sm">
        <p className="text-sm font-bold text-brand-green mb-4">Registrar ingreso</p>
        <div className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="ingreso-monto">Monto del ingreso</label>
          <input
            id="ingreso-monto"
            type="number"
            value={draft.monto}
            onChange={e => onChange({ ...draft, monto: e.target.value })}
            placeholder="Monto"
            className={`${INPUT_CLS} text-right font-mono text-lg`}
            autoFocus
            onKeyDown={e => e.key === "Enter" && onAdd()}
          />
          <label className="sr-only" htmlFor="ingreso-descripcion">Descripción del ingreso</label>
          <input
            id="ingreso-descripcion"
            value={draft.descripcion}
            onChange={e => onChange({ ...draft, descripcion: e.target.value })}
            placeholder="Descripción (ej: Pago mensual)"
            className={INPUT_CLS}
            onKeyDown={e => e.key === "Enter" && onAdd()}
          />
          <div className="flex gap-2">
            <button
              onClick={onAdd}
              disabled={saving || !draft.monto}
              className="flex-1 bg-brand-green text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar ingreso"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-brand-border text-brand-muted text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>

        {ingresos.length > 0 && (
          <div className="mt-4 border-t border-brand-border pt-4">
            <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-2">
              Ingresos de {getPeriodoLabel(periodo)}
            </p>
            {ingresos.map(i => (
              <div key={i.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-xs font-semibold text-brand-green font-mono">+ {fmtCOP(i.monto)}</p>
                  <p className="text-[10px] text-brand-muted">{i.descripcion}</p>
                </div>
                <button
                  onClick={() => onDelete(i.id)}
                  className="text-brand-overlay hover:text-brand-red text-lg leading-none ml-3"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
