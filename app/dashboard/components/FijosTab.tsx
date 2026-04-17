import { fmtCOP } from "@/lib/utils";
import { CATS_FIJOS, INPUT_CLS } from "@/lib/constants";
import { COLOR_CAT } from "@/lib/utils";
import Bar from "@/components/ui/Bar";
import Dot from "@/components/ui/Dot";
import Editable from "@/components/ui/Editable";
import type { GastoFijo } from "@/types";

interface Props {
  fijos: GastoFijo[];
  gastadoFijos: number;
  totalFijos: number;
  cats: string[];
  saving: boolean;
  formFijo: boolean;
  setFormFijo: (v: boolean) => void;
  nFijo: { nombre: string; categoria: string; monto: string };
  setNFijo: (v: { nombre: string; categoria: string; monto: string }) => void;
  onToggle: (id: string, pagado: boolean) => void;
  onEdit: (id: string, campo: keyof GastoFijo, valor: string | number | boolean) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function FijosTab({
  fijos, gastadoFijos, totalFijos, cats, saving,
  formFijo, setFormFijo, nFijo, setNFijo,
  onToggle, onEdit, onDelete, onAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Resumen de pago */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[#94a3b8]">Fijos pagados</span>
          <span className="font-mono text-brand-green">{fijos.filter(g => g.pagado).length}/{fijos.length}</span>
        </div>
        <Bar val={gastadoFijos} total={totalFijos} color="#4ade80" />
        <div className="flex justify-between mt-2 text-[11px] text-brand-muted">
          <span>Pagado: <b className="text-brand-green">{fmtCOP(gastadoFijos)}</b></span>
          <span>Pendiente: <b className="text-brand-red">{fmtCOP(totalFijos - gastadoFijos)}</b></span>
        </div>
        <p className="text-[11px] text-brand-muted mt-2">✏️ Toca nombre, categoría o monto para editar.</p>
      </div>

      {/* Lista agrupada por categoría */}
      {cats.map(cat => (
        <div key={cat}>
          <div className="flex items-center gap-2 mt-1 mb-1">
            <Dot cat={cat} />
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{cat}</span>
            <span className="text-[10px] text-[#2a2440] ml-auto">
              {fmtCOP(fijos.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0))}
            </span>
          </div>
          {fijos.filter(g => g.categoria === cat).map(g => (
            <div key={g.id}
              className={`bg-brand-card border rounded-2xl p-3.5 mb-2 flex items-center gap-3 transition-all ${
                g.pagado ? "opacity-50 border-brand-border" : "border-[#2a2440]"
              }`}>
              <button onClick={() => onToggle(g.id, g.pagado)}
                className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                  g.pagado ? "bg-brand-green border-brand-green" : "border-[#2a2440] bg-transparent"
                }`}>
                {g.pagado && <span className="text-brand-bg text-xs font-black">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <Editable value={g.nombre} tipo="text"
                  onSave={v => onEdit(g.id, "nombre", v)}
                  className={`text-sm font-medium block ${g.pagado ? "text-brand-muted line-through" : "text-white"}`} />
                <Editable value={g.categoria} tipo="select" opciones={[...CATS_FIJOS]}
                  onSave={v => onEdit(g.id, "categoria", v)}
                  className="text-[10px] mt-0.5 block"
                  style={{ color: COLOR_CAT[g.categoria] ?? "#64748b" }} />
              </div>
              <Editable value={g.monto} tipo="number"
                onSave={v => onEdit(g.id, "monto", v as number)}
                className="text-sm font-bold font-mono text-white" />
              <button onClick={() => onDelete(g.id)}
                className="text-[#2a2440] hover:text-brand-red text-lg leading-none transition-colors ml-1">×</button>
            </div>
          ))}
        </div>
      ))}

      {/* Formulario / botón agregar */}
      {formFijo ? (
        <div className="bg-brand-card border border-brand-purple/30 rounded-2xl p-4">
          <p className="text-xs text-brand-purple font-bold mb-3">Nuevo gasto fijo</p>
          <div className="flex flex-col gap-2">
            <input value={nFijo.nombre}
              onChange={e => setNFijo({ ...nFijo, nombre: e.target.value })}
              placeholder="Nombre" className={INPUT_CLS}
              onKeyDown={e => e.key === "Enter" && onAdd()} />
            <div className="flex gap-2">
              <select value={nFijo.categoria}
                onChange={e => setNFijo({ ...nFijo, categoria: e.target.value })}
                className={`${INPUT_CLS} flex-1`}>
                {CATS_FIJOS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={nFijo.monto}
                onChange={e => setNFijo({ ...nFijo, monto: e.target.value })}
                placeholder="Monto" className={`${INPUT_CLS} w-32 text-right font-mono`}
                onKeyDown={e => e.key === "Enter" && onAdd()} />
            </div>
            <div className="flex gap-2">
              <button onClick={onAdd} disabled={saving}
                className="flex-1 bg-brand-purple text-brand-bg font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "Guardando…" : "Agregar"}
              </button>
              <button onClick={() => setFormFijo(false)}
                className="bg-[#1e1b2e] text-brand-muted font-semibold px-4 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormFijo(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-[#2a2440] text-brand-muted text-sm font-semibold hover:border-brand-purple hover:text-brand-purple transition-colors">
          + Agregar gasto fijo
        </button>
      )}
    </div>
  );
}
