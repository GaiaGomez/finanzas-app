import { fmtCOP } from "@/lib/utils";
import { INPUT_CLS } from "@/lib/ui/classes";
import Bar from "@/components/ui/Bar";
import Editable from "@/components/ui/Editable";
import type { Deuda, Abono } from "@/types";

interface Props {
  deudas: Deuda[];
  abonos: Abono[];
  saving: boolean;
  formDeuda: boolean;
  setFormDeuda: (v: boolean) => void;
  nDeuda: { nombre: string; monto_total: string };
  setNDeuda: (v: { nombre: string; monto_total: string }) => void;
  abonoAbierto: string | null;
  setAbonoAbierto: (v: string | null) => void;
  aumentoAbierto: string | null;
  setAumentoAbierto: (v: string | null) => void;
  expandida: string | null;
  setExpandida: (v: string | null) => void;
  nAbono: { monto: string; nota: string };
  setNAbono: (v: { monto: string; nota: string }) => void;
  nAumento: { monto: string; nota: string };
  setNAumento: (v: { monto: string; nota: string }) => void;
  pagadoPor: (deudaId: string) => number;
  onAdd: () => void;
  onEdit: (id: string, campo: keyof Deuda, valor: string | number) => void;
  onDelete: (id: string) => void;
  onAddAbono: (deudaId: string) => void;
  onDelAbono: (id: string) => void;
  onAddAumento: (deuda: Deuda) => void;
}

export default function DeudasTab({
  deudas, abonos, saving,
  formDeuda, setFormDeuda, nDeuda, setNDeuda,
  abonoAbierto, setAbonoAbierto, aumentoAbierto, setAumentoAbierto,
  expandida, setExpandida, nAbono, setNAbono, nAumento, setNAumento,
  pagadoPor, onAdd, onEdit, onDelete, onAddAbono, onDelAbono, onAddAumento,
}: Props) {
  const totalDeuda     = deudas.reduce((s, d) => s + d.monto_total, 0);
  const totalPagado    = deudas.reduce((s, d) => s + pagadoPor(d.id), 0);
  const totalPendiente = totalDeuda - totalPagado;

  return (
    <div className="flex flex-col gap-3">
      {/* Resumen global de deudas */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Resumen de deudas</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Total deuda",  val: totalDeuda,    color: "text-brand-red" },
            { label: "Pagado",       val: totalPagado,   color: "text-brand-green" },
            { label: "Pendiente",    val: totalPendiente, color: "text-brand-yellow" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-brand-muted uppercase tracking-wider">{s.label}</span>
              <span className={`text-sm font-extrabold font-mono ${s.color}`}>{fmtCOP(s.val)}</span>
            </div>
          ))}
        </div>
        {totalDeuda > 0 && <Bar val={totalPagado} total={totalDeuda} color="#4ade80" />}
      </div>

      {/* Cards de deudas */}
      {deudas.map(d => {
        const pagado    = pagadoPor(d.id);
        const pendiente = d.monto_total - pagado;
        const pctD      = d.monto_total > 0 ? Math.min((pagado / d.monto_total) * 100, 100) : 0;
        const saldada   = pendiente <= 0;
        const misAbonos = abonos.filter(a => a.deuda_id === d.id);

        return (
          <div key={d.id} className={`bg-brand-card border rounded-2xl overflow-hidden transition-all ${saldada ? "border-brand-green/40" : "border-brand-border"}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Editable value={d.nombre} tipo="text"
                      onSave={v => onEdit(d.id, "nombre", v)}
                      className="text-sm font-bold text-white block" />
                    {saldada && (
                      <span className="text-[10px] bg-brand-green/20 text-brand-green font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        Saldada ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-brand-muted">Total:</span>
                    <Editable value={d.monto_total} tipo="number"
                      onSave={v => onEdit(d.id, "monto_total", v as number)}
                      className="text-[10px] text-brand-muted font-mono" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-brand-muted">Pendiente</p>
                  <p className={`text-base font-extrabold font-mono ${saldada ? "text-brand-green" : "text-brand-red"}`}>
                    {fmtCOP(Math.max(pendiente, 0))}
                  </p>
                  <p className="text-[10px] text-brand-muted">{pctD.toFixed(1)}% pagado</p>
                </div>
              </div>

              <Bar val={pagado} total={d.monto_total} color={saldada ? "#4ade80" : "#a78bfa"} />

              <div className="flex gap-2 mt-3">
                {!saldada && (
                  <button
                    onClick={() => { setAbonoAbierto(abonoAbierto === d.id ? null : d.id); setAumentoAbierto(null); setNAbono({ monto: "", nota: "" }); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${abonoAbierto === d.id ? "bg-brand-purple text-brand-bg" : "bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30"}`}>
                    + Abonar
                  </button>
                )}
                <button
                  onClick={() => { setAumentoAbierto(aumentoAbierto === d.id ? null : d.id); setAbonoAbierto(null); setNAumento({ monto: "", nota: "" }); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${aumentoAbierto === d.id ? "bg-brand-yellow text-brand-bg" : "bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/30"}`}>
                  ↑ Aumentar
                </button>
                <button onClick={() => setExpandida(expandida === d.id ? null : d.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-surface text-brand-muted hover:text-white transition-colors">
                  {expandida === d.id ? "Ocultar" : `Abonos (${misAbonos.length})`}
                </button>
                <button onClick={() => onDelete(d.id)}
                  className="px-3 py-2 rounded-xl text-brand-muted hover:text-brand-red transition-colors text-lg leading-none">×</button>
              </div>

              {/* Form aumentar */}
              {aumentoAbierto === d.id && (
                <div className="mt-3 p-3 bg-brand-surface rounded-xl border border-brand-yellow/20">
                  <p className="text-[10px] text-brand-yellow font-bold mb-2">Aumentar deuda</p>
                  <div className="flex gap-2 mb-2">
                    <input type="number" value={nAumento.monto}
                      onChange={e => setNAumento({ ...nAumento, monto: e.target.value })}
                      placeholder="Monto a agregar" className={`${INPUT_CLS} flex-1 text-right font-mono`}
                      onKeyDown={e => e.key === "Enter" && onAddAumento(d)} />
                    <input value={nAumento.nota}
                      onChange={e => setNAumento({ ...nAumento, nota: e.target.value })}
                      placeholder="Motivo (opcional)" className={`${INPUT_CLS} flex-1`}
                      onKeyDown={e => e.key === "Enter" && onAddAumento(d)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAddAumento(d)} disabled={saving || !nAumento.monto}
                      className="flex-1 bg-brand-yellow text-brand-bg font-bold py-2 rounded-xl text-xs disabled:opacity-50">
                      {saving ? "Guardando…" : "Confirmar aumento"}
                    </button>
                    <button onClick={() => setAumentoAbierto(null)}
                      className="px-4 py-2 rounded-xl bg-brand-card text-brand-muted text-xs">Cancelar</button>
                  </div>
                </div>
              )}

              {/* Form abonar */}
              {abonoAbierto === d.id && (
                <div className="mt-3 p-3 bg-brand-surface rounded-xl border border-brand-purple/20">
                  <p className="text-[10px] text-brand-purple font-bold mb-2">Registrar abono</p>
                  <div className="flex gap-2 mb-2">
                    <input type="number" value={nAbono.monto}
                      onChange={e => setNAbono({ ...nAbono, monto: e.target.value })}
                      placeholder="Monto" className={`${INPUT_CLS} flex-1 text-right font-mono`}
                      onKeyDown={e => e.key === "Enter" && onAddAbono(d.id)} />
                    <input value={nAbono.nota}
                      onChange={e => setNAbono({ ...nAbono, nota: e.target.value })}
                      placeholder="Nota (opcional)" className={`${INPUT_CLS} flex-1`}
                      onKeyDown={e => e.key === "Enter" && onAddAbono(d.id)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAddAbono(d.id)} disabled={saving || !nAbono.monto}
                      className="flex-1 bg-brand-purple text-brand-bg font-bold py-2 rounded-xl text-xs disabled:opacity-50">
                      {saving ? "Guardando…" : "Guardar abono"}
                    </button>
                    <button onClick={() => setAbonoAbierto(null)}
                      className="px-4 py-2 rounded-xl bg-brand-card text-brand-muted text-xs">Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de abonos */}
            {expandida === d.id && (
              <div className="border-t border-brand-border">
                {misAbonos.length === 0 ? (
                  <p className="text-brand-muted text-xs text-center py-4">Sin abonos registrados</p>
                ) : misAbonos.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < misAbonos.length - 1 ? "border-b border-brand-border" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-brand-green font-mono">+ {fmtCOP(a.monto)}</p>
                      <p className="text-[10px] text-brand-muted">
                        {new Date(a.fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        {a.nota && <span className="ml-2 italic">· {a.nota}</span>}
                      </p>
                    </div>
                    <button onClick={() => onDelAbono(a.id)}
                      className="text-brand-overlay hover:text-brand-red text-lg leading-none transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Formulario nueva deuda */}
      {formDeuda ? (
        <div className="bg-brand-card border border-brand-red/30 rounded-2xl p-4">
          <p className="text-xs text-brand-red font-bold mb-3">Nueva deuda</p>
          <div className="flex flex-col gap-2">
            <input value={nDeuda.nombre}
              onChange={e => setNDeuda({ ...nDeuda, nombre: e.target.value })}
              placeholder="Nombre de la deuda" className={INPUT_CLS}
              onKeyDown={e => e.key === "Enter" && onAdd()} />
            <input type="number" value={nDeuda.monto_total}
              onChange={e => setNDeuda({ ...nDeuda, monto_total: e.target.value })}
              placeholder="Monto total de la deuda" className={`${INPUT_CLS} text-right font-mono`}
              onKeyDown={e => e.key === "Enter" && onAdd()} />
            <div className="flex gap-2">
              <button onClick={onAdd} disabled={saving || !nDeuda.nombre || !nDeuda.monto_total}
                className="flex-1 bg-brand-red text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "Guardando…" : "Agregar deuda"}
              </button>
              <button onClick={() => setFormDeuda(false)}
                className="bg-brand-border text-brand-muted font-semibold px-4 py-2.5 rounded-xl text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormDeuda(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-brand-overlay text-brand-muted text-sm font-semibold hover:border-brand-red hover:text-brand-red transition-colors">
          + Agregar deuda
        </button>
      )}
    </div>
  );
}
