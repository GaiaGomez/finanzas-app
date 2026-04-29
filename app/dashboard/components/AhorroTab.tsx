import { fmtCOP } from "@/lib/utils";
import { INPUT_CLS } from "@/lib/ui/classes";
import Bar from "@/components/ui/Bar";
import Editable from "@/components/ui/Editable";
import type { MetaAhorro, AbonoMeta } from "@/types";

interface Props {
  metas: MetaAhorro[];
  abonosMeta: AbonoMeta[];
  saving: boolean;
  formMeta: boolean;
  setFormMeta: (v: boolean) => void;
  nMeta: { nombre: string; monto_meta: string };
  setNMeta: (v: { nombre: string; monto_meta: string }) => void;
  abonoMeta: string | null;
  setAbonoMeta: (v: string | null) => void;
  nAbonoMeta: { monto: string; nota: string };
  setNAbonoMeta: (v: { monto: string; nota: string }) => void;
  expandidaMeta: string | null;
  setExpandidaMeta: (v: string | null) => void;
  onAdd: () => void;
  onEdit: (id: string, campo: keyof MetaAhorro, valor: string | number) => void;
  onDelete: (id: string) => void;
  onAddAbono: (metaId: string) => void;
  onDelAbono: (id: string) => void;
}

const SKY = "#38bdf8";

export default function AhorroTab({
  metas, abonosMeta, saving,
  formMeta, setFormMeta, nMeta, setNMeta,
  abonoMeta, setAbonoMeta, nAbonoMeta, setNAbonoMeta,
  expandidaMeta, setExpandidaMeta,
  onAdd, onEdit, onDelete, onAddAbono, onDelAbono,
}: Props) {
  const totalMeta   = metas.reduce((s, m) => s + m.monto_meta, 0);
  const totalActual = metas.reduce((s, m) => s + m.monto_actual, 0);
  const totalPend   = Math.max(totalMeta - totalActual, 0);

  return (
    <div className="flex flex-col gap-3">

      {/* ── RESUMEN GLOBAL ── */}
      {metas.length > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-brand-subtle">Progreso total</span>
            <span className="text-lg font-extrabold font-mono" style={{ color: SKY }}>
              {fmtCOP(totalActual)}
            </span>
          </div>
          <Bar val={totalActual} total={totalMeta} color={SKY} />
          <div className="flex justify-between mt-2 text-[11px] text-brand-muted">
            <span>Meta: <b className="text-white">{fmtCOP(totalMeta)}</b></span>
            <span>Pendiente: <b className="text-brand-red">{fmtCOP(totalPend)}</b></span>
          </div>
        </div>
      )}

      {/* ── ESTADO VACÍO ── */}
      {metas.length === 0 && !formMeta && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🎯</span>
          <p className="font-bold text-sm">Aún no tienes metas de ahorro</p>
          <p className="text-brand-muted text-xs max-w-[220px]">
            Define una meta, registra tus abonos y visualiza tu progreso mes a mes.
          </p>
          <button
            onClick={() => setFormMeta(true)}
            className="mt-1 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background: SKY, color: "#080611" }}>
            + Nueva meta
          </button>
        </div>
      )}

      {/* ── LISTA DE METAS ── */}
      {metas.map(meta => {
        const pct       = meta.monto_meta > 0 ? Math.min((meta.monto_actual / meta.monto_meta) * 100, 100) : 0;
        const alcanzada = meta.monto_actual >= meta.monto_meta && meta.monto_meta > 0;
        const isOpen    = abonoMeta === meta.id;
        const historial = abonosMeta.filter(a => a.meta_id === meta.id);
        const expanded  = expandidaMeta === meta.id;

        return (
          <div key={meta.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Editable
                  value={meta.nombre}
                  tipo="text"
                  onSave={v => onEdit(meta.id, "nombre", v)}
                  className="text-sm font-bold text-white block"
                />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] font-mono" style={{ color: SKY }}>
                    {fmtCOP(meta.monto_actual)}
                  </span>
                  <span className="text-[11px] text-brand-muted">de</span>
                  <Editable
                    value={meta.monto_meta}
                    tipo="number"
                    onSave={v => onEdit(meta.id, "monto_meta", v as number)}
                    className="text-[11px] font-mono text-brand-muted"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-bold" style={{ color: pct >= 100 ? "#4ade80" : SKY }}>
                  {Math.round(pct)}%
                </span>
                <button
                  onClick={() => onDelete(meta.id)}
                  className="text-brand-overlay hover:text-brand-red text-lg leading-none transition-colors">
                  ×
                </button>
              </div>
            </div>

            {/* Barra de progreso */}
            <Bar val={meta.monto_actual} total={meta.monto_meta} color={alcanzada ? "#4ade80" : SKY} />

            {/* Abonar / completada */}
            {alcanzada ? (
              <div className="flex items-center gap-1.5 text-brand-green text-xs font-bold">
                <span>✓</span>
                <span>Meta alcanzada</span>
              </div>
            ) : (
              <>
                {isOpen ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={nAbonoMeta.monto}
                        onChange={e => setNAbonoMeta({ ...nAbonoMeta, monto: e.target.value })}
                        placeholder="Monto a abonar"
                        className={`${INPUT_CLS} text-right font-mono flex-1`}
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && onAddAbono(meta.id)}
                      />
                      <button
                        onClick={() => onAddAbono(meta.id)}
                        disabled={saving || !nAbonoMeta.monto}
                        className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex-shrink-0"
                        style={{ background: SKY, color: "#080611" }}>
                        {saving ? "…" : "Abonar"}
                      </button>
                      <button
                        onClick={() => { setAbonoMeta(null); setNAbonoMeta({ monto: "", nota: "" }); }}
                        className="px-3 py-2 rounded-xl bg-brand-border text-brand-muted text-xs flex-shrink-0">
                        ×
                      </button>
                    </div>
                    <input
                      value={nAbonoMeta.nota}
                      onChange={e => setNAbonoMeta({ ...nAbonoMeta, nota: e.target.value })}
                      placeholder="Nota (opcional)"
                      className={INPUT_CLS}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setAbonoMeta(meta.id); setNAbonoMeta({ monto: "", nota: "" }); }}
                    className="self-start text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: SKY + "40", color: SKY }}>
                    + Abonar
                  </button>
                )}
              </>
            )}

            {/* Historial de abonos */}
            {historial.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandidaMeta(expanded ? null : meta.id)}
                  className="text-[11px] text-brand-muted hover:text-white transition-colors flex items-center gap-1">
                  <span>{expanded ? "▾" : "▸"}</span>
                  <span>{historial.length} abono{historial.length !== 1 ? "s" : ""}</span>
                </button>
                {expanded && (
                  <div className="mt-2 flex flex-col gap-1.5 border-t border-brand-border pt-2">
                    {historial.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-[11px] gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-semibold" style={{ color: SKY }}>
                            +{fmtCOP(a.monto)}
                          </span>
                          {a.nota && (
                            <span className="text-brand-muted truncate">{a.nota}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-brand-muted">{a.fecha}</span>
                          <button
                            onClick={() => onDelAbono(a.id)}
                            className="text-brand-overlay hover:text-brand-red text-base leading-none transition-colors">
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── FORMULARIO NUEVA META ── */}
      {formMeta ? (
        <div className="bg-brand-card border border-dashed rounded-2xl p-4" style={{ borderColor: SKY + "50" }}>
          <p className="text-xs font-bold mb-3" style={{ color: SKY }}>Nueva meta de ahorro</p>
          <div className="flex flex-col gap-2">
            <input
              value={nMeta.nombre}
              onChange={e => setNMeta({ ...nMeta, nombre: e.target.value })}
              placeholder="Nombre de la meta (ej: Fondo de emergencia)"
              className={INPUT_CLS}
              onKeyDown={e => e.key === "Enter" && onAdd()}
            />
            <input
              type="number"
              value={nMeta.monto_meta}
              onChange={e => setNMeta({ ...nMeta, monto_meta: e.target.value })}
              placeholder="Monto objetivo"
              className={`${INPUT_CLS} text-right font-mono`}
              onKeyDown={e => e.key === "Enter" && onAdd()}
            />
            <div className="flex gap-2">
              <button
                onClick={onAdd}
                disabled={saving || !nMeta.nombre.trim() || !nMeta.monto_meta}
                className="flex-1 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
                style={{ background: SKY, color: "#080611" }}>
                {saving ? "Guardando…" : "Guardar meta"}
              </button>
              <button
                onClick={() => setFormMeta(false)}
                className="bg-brand-border text-brand-muted font-semibold px-4 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        metas.length > 0 && (
          <button
            onClick={() => setFormMeta(true)}
            className="w-full py-3 rounded-2xl border border-dashed text-sm font-semibold transition-colors"
            style={{ borderColor: "#2a2440", color: "#64748b" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = SKY + "60";
              (e.currentTarget as HTMLButtonElement).style.color = SKY;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2440";
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            }}>
            + Nueva meta
          </button>
        )
      )}
    </div>
  );
}
