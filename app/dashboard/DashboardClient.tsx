// app/dashboard/DashboardClient.tsx
// Toda la lógica interactiva del dashboard — equivalente al Artifact pero conectado a Supabase
"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { fmtCOP, getQuincenaLabel, COLOR_CAT } from "@/lib/utils";
import type { GastoFijo, GastoVariable, Perfil, Deuda, Abono } from "@/types";
import Bar from "@/components/ui/Bar";
import Dot from "@/components/ui/Dot";
import Editable from "@/components/ui/Editable";

const CATS_FIJOS     = ["Suscripciones","Casa","Nicotina","Educación","Transporte","Deuda","Apoyo profesional","Ahorro","Otro"];
const CATS_VARIABLES = ["Cuidado personal","Comida fuera","Entretenimiento","Ropa","Salud","Transporte extra","Nicotina","Otro"];

interface Props {
  userId: string;
  perfil: Perfil | null;
  fijosIniciales: GastoFijo[];
  variablesIniciales: GastoVariable[];
  deudasIniciales: Deuda[];
  abonosIniciales: Abono[];
  quincena: string;
}

export default function DashboardClient({ userId, perfil, fijosIniciales, variablesIniciales, deudasIniciales, abonosIniciales, quincena }: Props) {
  const supabase = createClient();

  const [tab, setTab]       = useState<"fijos"|"variables"|"resumen"|"deudas">("fijos");
  const [ingreso, setIngreso] = useState(perfil?.ingreso_quincenal ?? 1600000);
  const [fijos, setFijos]   = useState<GastoFijo[]>(fijosIniciales);
  const [vars, setVars]     = useState<GastoVariable[]>(variablesIniciales);
  const [deudas, setDeudas] = useState<Deuda[]>(deudasIniciales);
  const [abonos, setAbonos] = useState<Abono[]>(abonosIniciales);
  const [formFijo, setFormFijo] = useState(false);
  const [formVar, setFormVar]   = useState(false);
  const [formDeuda, setFormDeuda] = useState(false);
  const [nFijo, setNFijo]   = useState({ nombre: "", categoria: "Casa", monto: "" });
  const [nVar, setNVar]     = useState({ descripcion: "", categoria: "Otro", monto: "" });
  const [nDeuda, setNDeuda] = useState({ nombre: "", monto_total: "" });
  const [abonoAbierto, setAbonoAbierto]   = useState<string | null>(null);
  const [nAbono, setNAbono] = useState({ monto: "", nota: "" });
  const [expandida, setExpandida] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── CÁLCULOS ──
  const gastadoFijos  = fijos.filter(g => g.pagado).reduce((s, g) => s + g.monto, 0);
  const totalFijosMes = fijos.reduce((s, g) => s + g.monto, 0);
  const totalVars     = vars.reduce((s, g) => s + g.monto, 0);
  const gastadoTotal  = gastadoFijos + totalVars;
  const disponible    = ingreso - gastadoTotal;
  const pct           = ingreso > 0 ? Math.min((gastadoTotal / ingreso) * 100, 100) : 0;

  // ── ACTUALIZAR INGRESO ──
  async function actualizarIngreso(v: number) {
    setIngreso(v);
    await supabase.from("perfiles").upsert({ id: userId, ingreso_quincenal: v });
  }

  // ── HANDLERS FIJOS ──
  async function toggleFijo(id: string, pagado: boolean) {
    setFijos(prev => prev.map(g => g.id === id ? { ...g, pagado: !pagado } : g));
    await supabase.from("gastos_fijos").update({ pagado: !pagado }).eq("id", id);
  }

  async function editFijo(id: string, campo: keyof GastoFijo, valor: string | number | boolean) {
    setFijos(prev => prev.map(g => g.id === id ? { ...g, [campo]: valor } : g));
    await supabase.from("gastos_fijos").update({ [campo]: valor }).eq("id", id);
  }

  async function delFijo(id: string) {
    setFijos(prev => prev.filter(g => g.id !== id));
    await supabase.from("gastos_fijos").delete().eq("id", id);
  }

  async function addFijo() {
    const monto = parseFloat(nFijo.monto);
    if (!nFijo.nombre.trim() || isNaN(monto)) return;
    setSaving(true);
    const { data } = await supabase.from("gastos_fijos").insert({
      user_id: userId,
      nombre: nFijo.nombre,
      categoria: nFijo.categoria,
      monto,
      pagado: false,
      quincena,
    }).select().single();
    if (data) setFijos(prev => [...prev, data]);
    setNFijo({ nombre: "", categoria: "Casa", monto: "" });
    setFormFijo(false);
    setSaving(false);
  }

  // ── HANDLERS VARIABLES ──
  async function addVar() {
    const monto = parseFloat(nVar.monto);
    if (!nVar.descripcion.trim() || isNaN(monto) || monto <= 0) return;
    setSaving(true);
    const { data } = await supabase.from("gastos_variables").insert({
      user_id: userId,
      descripcion: nVar.descripcion,
      categoria: nVar.categoria,
      monto,
      fecha: new Date().toISOString().split("T")[0],
      quincena,
    }).select().single();
    if (data) setVars(prev => [data, ...prev]);
    setNVar({ descripcion: "", categoria: "Otro", monto: "" });
    setFormVar(false);
    setSaving(false);
  }

  async function editVar(id: string, campo: keyof GastoVariable, valor: string | number) {
    setVars(prev => prev.map(g => g.id === id ? { ...g, [campo]: valor } : g));
    await supabase.from("gastos_variables").update({ [campo]: valor }).eq("id", id);
  }

  async function delVar(id: string) {
    setVars(prev => prev.filter(g => g.id !== id));
    await supabase.from("gastos_variables").delete().eq("id", id);
  }

  // ── HELPERS DEUDAS ──
  const pagadoPor = useCallback((deudaId: string) =>
    abonos.filter(a => a.deuda_id === deudaId).reduce((s, a) => s + a.monto, 0), [abonos]);

  async function addDeuda() {
    const monto = parseFloat(nDeuda.monto_total);
    if (!nDeuda.nombre.trim() || isNaN(monto) || monto <= 0) return;
    setSaving(true);
    const { data } = await supabase.from("deudas").insert({
      user_id: userId, nombre: nDeuda.nombre, monto_total: monto,
    }).select().single();
    if (data) setDeudas(prev => [...prev, data]);
    setNDeuda({ nombre: "", monto_total: "" });
    setFormDeuda(false);
    setSaving(false);
  }

  async function editDeuda(id: string, campo: keyof Deuda, valor: string | number) {
    setDeudas(prev => prev.map(d => d.id === id ? { ...d, [campo]: valor } : d));
    await supabase.from("deudas").update({ [campo]: valor }).eq("id", id);
  }

  async function delDeuda(id: string) {
    setDeudas(prev => prev.filter(d => d.id !== id));
    setAbonos(prev => prev.filter(a => a.deuda_id !== id));
    await supabase.from("deudas").delete().eq("id", id);
  }

  async function addAbono(deudaId: string) {
    const monto = parseFloat(nAbono.monto);
    if (isNaN(monto) || monto <= 0) return;
    setSaving(true);
    const { data } = await supabase.from("abonos").insert({
      deuda_id: deudaId, user_id: userId, monto,
      nota: nAbono.nota.trim(),
      fecha: new Date().toISOString().split("T")[0],
    }).select().single();
    if (data) setAbonos(prev => [data, ...prev]);
    setNAbono({ monto: "", nota: "" });
    setAbonoAbierto(null);
    setSaving(false);
  }

  async function delAbono(id: string) {
    setAbonos(prev => prev.filter(a => a.id !== id));
    await supabase.from("abonos").delete().eq("id", id);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  // ── ESTILOS BASE ──
  const inputCls = "bg-[#1a1730] border border-[#2a2440] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-purple transition-colors w-full";
  const cats = [...new Set(fijos.map(g => g.categoria))];

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans pb-16">

      {/* ══ HEADER ══ */}
      <div className="sticky top-0 z-10 border-b border-brand-border px-4 py-4"
        style={{ background: "linear-gradient(160deg,#13101f,#1a0f2e)" }}>
        <div className="max-w-xl mx-auto">

          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <p className="text-[10px] text-brand-purple uppercase tracking-widest mb-0.5">Dashboard · COP</p>
              <h1 className="text-base font-extrabold tracking-tight leading-tight">{getQuincenaLabel()}</h1>
              <p className="text-[11px] text-brand-muted mt-0.5">Mensual estimado: {fmtCOP(ingreso * 2)}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className="text-[10px] text-brand-muted uppercase tracking-wider">Ingreso quincenal</p>
              <Editable
                value={ingreso} tipo="number"
                onSave={v => actualizarIngreso(v as number)}
                className="text-lg font-extrabold text-brand-green font-mono"
              />
              <button onClick={logout} className="text-[10px] text-brand-muted hover:text-brand-red transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Barra disponible */}
          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-brand-muted">Gastado de la quincena</span>
              <span className={`font-bold ${pct >= 90 ? "text-brand-red" : pct >= 70 ? "text-brand-yellow" : "text-brand-green"}`}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <Bar val={gastadoTotal} total={ingreso} color="#a78bfa" />
          </div>

          {/* Stats x3 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Gastado",      val: gastadoTotal, color: "text-brand-red",    sub: `${fijos.filter(g=>g.pagado).length} fijos + ${vars.length} var` },
              { label: "Comprometido", val: totalFijosMes, color: "text-brand-yellow", sub: "total fijos" },
              { label: "Disponible",   val: disponible,   color: disponible >= 0 ? "text-brand-purple" : "text-brand-red", sub: disponible < 0 ? "⚠️ déficit" : "libre ahora" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-brand-muted uppercase tracking-wider">{s.label}</span>
                <span className={`text-sm font-extrabold font-mono ${s.color}`}>{fmtCOP(s.val)}</span>
                <span className="text-[9px] text-brand-muted">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {([["fijos","💳 Fijos"],["variables","🛒 Variables"],["deudas","💸 Deudas"],["resumen","📊 Resumen"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`py-2 rounded-xl text-[11px] font-bold transition-all ${
                tab === k
                  ? "bg-brand-purple text-brand-bg shadow-lg shadow-brand-purple/30"
                  : "bg-brand-card text-brand-muted"
              }`}>
              {l}
            </button>
          ))}
        </div>

        {/* ════ TAB: FIJOS ════ */}
        {tab === "fijos" && (
          <div className="flex flex-col gap-3">

            {/* Progreso fijos */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#94a3b8]">Fijos pagados</span>
                <span className="font-mono text-brand-green">{fijos.filter(g=>g.pagado).length}/{fijos.length}</span>
              </div>
              <Bar val={gastadoFijos} total={totalFijosMes} color="#4ade80" />
              <div className="flex justify-between mt-2 text-[11px] text-brand-muted">
                <span>Pagado: <b className="text-brand-green">{fmtCOP(gastadoFijos)}</b></span>
                <span>Pendiente: <b className="text-brand-red">{fmtCOP(totalFijosMes - gastadoFijos)}</b></span>
              </div>
              <p className="text-[11px] text-brand-muted mt-2 leading-relaxed">
                ✏️ Toca nombre, categoría o monto para editar. El disponible se actualiza al instante.
              </p>
            </div>

            {/* Lista por categoría */}
            {cats.map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <Dot cat={cat} />
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{cat}</span>
                  <span className="text-[10px] text-[#2a2440] ml-auto">
                    {fmtCOP(fijos.filter(g=>g.categoria===cat).reduce((s,g)=>s+g.monto,0))}
                  </span>
                </div>

                {fijos.filter(g => g.categoria === cat).map(g => (
                  <div key={g.id}
                    className={`bg-brand-card border rounded-2xl p-3.5 mb-2 flex items-center gap-3 transition-all ${
                      g.pagado ? "opacity-50 border-brand-border" : "border-[#2a2440]"
                    }`}>

                    {/* Checkbox */}
                    <button onClick={() => toggleFijo(g.id, g.pagado)}
                      className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                        g.pagado ? "bg-brand-green border-brand-green" : "border-[#2a2440] bg-transparent"
                      }`}>
                      {g.pagado && <span className="text-brand-bg text-xs font-black">✓</span>}
                    </button>

                    {/* Nombre + categoría */}
                    <div className="flex-1 min-w-0">
                      <Editable value={g.nombre} tipo="text"
                        onSave={v => editFijo(g.id, "nombre", v)}
                        className={`text-sm font-medium block ${g.pagado ? "text-brand-muted line-through" : "text-white"}`} />
                      <Editable value={g.categoria} tipo="select" opciones={CATS_FIJOS}
                        onSave={v => editFijo(g.id, "categoria", v)}
                        className="text-[10px] mt-0.5 block"
                        style={{ color: COLOR_CAT[g.categoria] ?? "#64748b" } as any} />
                    </div>

                    {/* Monto */}
                    <Editable value={g.monto} tipo="number"
                      onSave={v => editFijo(g.id, "monto", v as number)}
                      className="text-sm font-bold font-mono text-white" />

                    {/* Eliminar */}
                    <button onClick={() => delFijo(g.id)}
                      className="text-[#2a2440] hover:text-brand-red text-lg leading-none transition-colors ml-1">×</button>
                  </div>
                ))}
              </div>
            ))}

            {/* Form nuevo fijo */}
            {formFijo ? (
              <div className="bg-brand-card border border-brand-purple/30 rounded-2xl p-4">
                <p className="text-xs text-brand-purple font-bold mb-3">Nuevo gasto fijo</p>
                <div className="flex flex-col gap-2">
                  <input value={nFijo.nombre} onChange={e => setNFijo(p => ({...p, nombre: e.target.value}))}
                    placeholder="Nombre" className={inputCls} onKeyDown={e => e.key==="Enter"&&addFijo()} />
                  <div className="flex gap-2">
                    <select value={nFijo.categoria} onChange={e => setNFijo(p => ({...p, categoria: e.target.value}))}
                      className={`${inputCls} flex-1`}>
                      {CATS_FIJOS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" value={nFijo.monto} onChange={e => setNFijo(p => ({...p, monto: e.target.value}))}
                      placeholder="Monto" className={`${inputCls} w-32 text-right font-mono`}
                      onKeyDown={e => e.key==="Enter"&&addFijo()} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addFijo} disabled={saving}
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
        )}

        {/* ════ TAB: VARIABLES ════ */}
        {tab === "variables" && (
          <div className="flex flex-col gap-3">

            {/* Disponible destacado */}
            <div className={`bg-brand-card border rounded-2xl p-4 ${disponible >= 0 ? "border-brand-purple/30" : "border-brand-red/30"}`}
              style={{ background: disponible >= 0 ? "#110e1f" : "#1a0d0d" }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider">Disponible ahora</p>
                  <p className="text-[11px] text-brand-muted mt-0.5">Ingreso − fijos pagados − variables</p>
                </div>
                <span className={`text-2xl font-extrabold font-mono ${disponible >= 0 ? "text-brand-purple" : "text-brand-red"}`}>
                  {fmtCOP(disponible)}
                </span>
              </div>
            </div>

            {/* Resumen variables */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#94a3b8]">Total variables</span>
                <span className="text-lg font-extrabold font-mono text-brand-yellow">{fmtCOP(totalVars)}</span>
              </div>
              <Bar val={totalVars} total={ingreso * 0.20} color="#fbbf24" />
              <p className="text-[11px] text-brand-muted mt-1.5">
                Referencia 20%: {fmtCOP(ingreso * 0.20)} · {vars.length} gastos
              </p>
            </div>

            {/* Form nuevo variable */}
            {formVar ? (
              <div className="bg-brand-card border border-brand-yellow/30 rounded-2xl p-4">
                <p className="text-xs text-brand-yellow font-bold mb-3">Registrar gasto</p>
                <div className="flex flex-col gap-2">
                  <input value={nVar.descripcion} onChange={e => setNVar(p => ({...p, descripcion: e.target.value}))}
                    placeholder="¿En qué gastaste?" className={inputCls}
                    onKeyDown={e => e.key==="Enter"&&addVar()} />
                  <div className="flex gap-2">
                    <select value={nVar.categoria} onChange={e => setNVar(p => ({...p, categoria: e.target.value}))}
                      className={`${inputCls} flex-1`}>
                      {CATS_VARIABLES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" value={nVar.monto} onChange={e => setNVar(p => ({...p, monto: e.target.value}))}
                      placeholder="Monto" className={`${inputCls} w-32 text-right font-mono`}
                      onKeyDown={e => e.key==="Enter"&&addVar()} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addVar} disabled={saving}
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

            {/* Lista variables */}
            {vars.length === 0 ? (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center text-brand-muted text-sm">
                Sin gastos registrados esta quincena 🎉
              </div>
            ) : vars.map(g => (
              <div key={g.id} className="bg-brand-card border border-brand-border rounded-2xl p-3.5 flex items-center gap-3">
                <Dot cat={g.categoria} />
                <div className="flex-1 min-w-0">
                  <Editable value={g.descripcion} tipo="text"
                    onSave={v => editVar(g.id, "descripcion", v)}
                    className="text-sm font-medium block" />
                  <div className="flex gap-2 mt-1 items-center">
                    <Editable value={g.categoria} tipo="select" opciones={CATS_VARIABLES}
                      onSave={v => editVar(g.id, "categoria", v)}
                      className="text-[10px]"
                      style={{ color: COLOR_CAT[g.categoria] ?? "#64748b" } as any} />
                    <span className="text-[10px] text-brand-muted">
                      {new Date(g.fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <Editable value={g.monto} tipo="number"
                  onSave={v => editVar(g.id, "monto", v as number)}
                  className="text-sm font-bold font-mono text-brand-yellow" />
                <button onClick={() => delVar(g.id)}
                  className="text-[#2a2440] hover:text-brand-red text-lg leading-none transition-colors ml-1">×</button>
              </div>
            ))}
          </div>
        )}

        {/* ════ TAB: DEUDAS ════ */}
        {tab === "deudas" && (() => {
          const totalDeuda    = deudas.reduce((s, d) => s + d.monto_total, 0);
          const totalPagado   = deudas.reduce((s, d) => s + pagadoPor(d.id), 0);
          const totalPendiente = totalDeuda - totalPagado;

          return (
            <div className="flex flex-col gap-3">

              {/* Resumen global */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
                <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Resumen de deudas</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Total deuda",   val: totalDeuda,    color: "text-brand-red" },
                    { label: "Pagado",         val: totalPagado,   color: "text-brand-green" },
                    { label: "Pendiente",      val: totalPendiente, color: "text-brand-yellow" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-brand-muted uppercase tracking-wider">{s.label}</span>
                      <span className={`text-sm font-extrabold font-mono ${s.color}`}>{fmtCOP(s.val)}</span>
                    </div>
                  ))}
                </div>
                {totalDeuda > 0 && (
                  <Bar val={totalPagado} total={totalDeuda} color="#4ade80" />
                )}
              </div>

              {/* Lista de deudas */}
              {deudas.map(d => {
                const pagado    = pagadoPor(d.id);
                const pendiente = d.monto_total - pagado;
                const pctD      = d.monto_total > 0 ? Math.min((pagado / d.monto_total) * 100, 100) : 0;
                const saldada   = pendiente <= 0;
                const misAbonos = abonos.filter(a => a.deuda_id === d.id);

                return (
                  <div key={d.id} className={`bg-brand-card border rounded-2xl overflow-hidden transition-all ${saldada ? "border-brand-green/40" : "border-brand-border"}`}>
                    {/* Cabecera deuda */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Editable value={d.nombre} tipo="text"
                              onSave={v => editDeuda(d.id, "nombre", v)}
                              className="text-sm font-bold text-white block" />
                            {saldada && <span className="text-[10px] bg-brand-green/20 text-brand-green font-bold px-2 py-0.5 rounded-full flex-shrink-0">Saldada ✓</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-brand-muted">Total:</span>
                            <Editable value={d.monto_total} tipo="number"
                              onSave={v => editDeuda(d.id, "monto_total", v as number)}
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

                      {/* Acciones */}
                      <div className="flex gap-2 mt-3">
                        {!saldada && (
                          <button
                            onClick={() => { setAbonoAbierto(abonoAbierto === d.id ? null : d.id); setNAbono({ monto: "", nota: "" }); }}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 transition-colors">
                            + Abonar
                          </button>
                        )}
                        <button
                          onClick={() => setExpandida(expandida === d.id ? null : d.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1a1730] text-brand-muted hover:text-white transition-colors">
                          {expandida === d.id ? "Ocultar" : `Ver abonos (${misAbonos.length})`}
                        </button>
                        <button onClick={() => delDeuda(d.id)}
                          className="px-3 py-2 rounded-xl text-brand-muted hover:text-brand-red transition-colors text-lg leading-none">×</button>
                      </div>

                      {/* Form abono */}
                      {abonoAbierto === d.id && (
                        <div className="mt-3 p-3 bg-[#1a1730] rounded-xl border border-brand-purple/20">
                          <p className="text-[10px] text-brand-purple font-bold mb-2">Registrar abono</p>
                          <div className="flex gap-2 mb-2">
                            <input type="number" value={nAbono.monto}
                              onChange={e => setNAbono(p => ({ ...p, monto: e.target.value }))}
                              placeholder="Monto" className={`${inputCls} flex-1 text-right font-mono`}
                              onKeyDown={e => e.key === "Enter" && addAbono(d.id)} />
                            <input value={nAbono.nota}
                              onChange={e => setNAbono(p => ({ ...p, nota: e.target.value }))}
                              placeholder="Nota (opcional)" className={`${inputCls} flex-1`}
                              onKeyDown={e => e.key === "Enter" && addAbono(d.id)} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addAbono(d.id)} disabled={saving || !nAbono.monto}
                              className="flex-1 bg-brand-purple text-brand-bg font-bold py-2 rounded-xl text-xs disabled:opacity-50">
                              {saving ? "Guardando…" : "Guardar abono"}
                            </button>
                            <button onClick={() => setAbonoAbierto(null)}
                              className="px-4 py-2 rounded-xl bg-[#13101f] text-brand-muted text-xs">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historial abonos */}
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
                            <button onClick={() => delAbono(a.id)}
                              className="text-[#2a2440] hover:text-brand-red text-lg leading-none transition-colors">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Form nueva deuda */}
              {formDeuda ? (
                <div className="bg-brand-card border border-brand-red/30 rounded-2xl p-4">
                  <p className="text-xs text-brand-red font-bold mb-3">Nueva deuda</p>
                  <div className="flex flex-col gap-2">
                    <input value={nDeuda.nombre} onChange={e => setNDeuda(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Nombre de la deuda" className={inputCls}
                      onKeyDown={e => e.key === "Enter" && addDeuda()} />
                    <input type="number" value={nDeuda.monto_total} onChange={e => setNDeuda(p => ({ ...p, monto_total: e.target.value }))}
                      placeholder="Monto total de la deuda" className={`${inputCls} text-right font-mono`}
                      onKeyDown={e => e.key === "Enter" && addDeuda()} />
                    <div className="flex gap-2">
                      <button onClick={addDeuda} disabled={saving || !nDeuda.nombre || !nDeuda.monto_total}
                        className="flex-1 bg-brand-red text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? "Guardando…" : "Agregar deuda"}
                      </button>
                      <button onClick={() => setFormDeuda(false)}
                        className="bg-[#1e1b2e] text-brand-muted font-semibold px-4 py-2.5 rounded-xl text-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setFormDeuda(true)}
                  className="w-full py-3 rounded-2xl border border-dashed border-[#2a2440] text-brand-muted text-sm font-semibold hover:border-brand-red hover:text-brand-red transition-colors">
                  + Agregar deuda
                </button>
              )}
            </div>
          );
        })()}

        {/* ════ TAB: RESUMEN ════ */}
        {tab === "resumen" && (
          <div className="flex flex-col gap-3">

            {/* Flujo */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Flujo quincenal</p>
              {[
                { label: "Ingreso quincenal",  val: ingreso,                    color: "text-brand-green",  signo: "+" },
                { label: "Fijos pagados",       val: gastadoFijos,               color: "text-brand-red",    signo: "−" },
                { label: "Gastos variables",    val: totalVars,                  color: "text-brand-yellow", signo: "−" },
                { label: "Fijos pendientes",    val: totalFijosMes-gastadoFijos, color: "text-[#94a3b8]",    signo: "(−)", dim: true },
                { label: "Disponible real",     val: disponible,                 color: disponible>=0?"text-brand-purple":"text-brand-red", signo: "=", bold: true },
              ].map((r, i) => (
                <div key={i} className={`flex justify-between items-center py-2.5 ${i<4?"border-b border-brand-border":""} ${r.dim?"opacity-40":""}`}>
                  <span className={`text-sm text-[#94a3b8] ${r.bold?"font-bold":""} ${r.dim?"italic":""}`}>{r.label}</span>
                  <span className={`font-mono text-sm font-extrabold ${r.color}`}>{r.signo} {fmtCOP(r.val)}</span>
                </div>
              ))}
            </div>

            {/* Por categoría */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Lo que ya salió</p>
              {(() => {
                const catMap: Record<string, number> = {};
                fijos.filter(g=>g.pagado).forEach(g => { catMap[g.categoria] = (catMap[g.categoria]||0) + g.monto; });
                vars.forEach(g => { catMap[g.categoria] = (catMap[g.categoria]||0) + g.monto; });
                const tot = Object.values(catMap).reduce((a,b)=>a+b,0);
                if (tot === 0) return <p className="text-brand-muted text-sm">Nada gastado todavía.</p>;
                return Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([cat, m]) => (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2"><Dot cat={cat}/><span className="text-sm">{cat}</span></div>
                      <div className="flex gap-3 items-center">
                        <span className="text-[11px] text-brand-muted">{((m/tot)*100).toFixed(1)}%</span>
                        <span className="font-mono text-sm font-bold">{fmtCOP(m)}</span>
                      </div>
                    </div>
                    <Bar val={m} total={tot} color={COLOR_CAT[cat]??""} />
                  </div>
                ));
              })()}
            </div>

            {/* Diagnóstico */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-[10px] text-brand-purple font-bold uppercase tracking-widest mb-3">Diagnóstico</p>
              {[
                { ok: disponible >= 0, label: "Dentro del presupuesto",
                  msg: disponible >= 0 ? `Te quedan ${fmtCOP(disponible)}` : `Déficit ${fmtCOP(Math.abs(disponible))}` },
                { ok: totalVars <= ingreso*0.20, label: "Variables ≤ 20%",
                  msg: `${fmtCOP(totalVars)} de ${fmtCOP(ingreso*0.20)}` },
                { ok: fijos.filter(g=>g.pagado).length === fijos.length, label: "Todos los fijos pagados",
                  msg: `${fijos.filter(g=>g.pagado).length}/${fijos.length} marcados` },
                { ok: ingreso >= totalFijosMes, label: "Ingreso cubre todos los fijos",
                  msg: ingreso >= totalFijosMes ? `Sobran ${fmtCOP(ingreso-totalFijosMes)}` : `Déficit estructural ${fmtCOP(totalFijosMes-ingreso)}` },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-2.5 ${i<3?"border-b border-brand-border":""}`}>
                  <div className="flex items-center gap-2.5">
                    <span>{item.ok?"✅":"⚠️"}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className={`text-xs text-right max-w-40 ${item.ok?"text-brand-green":"text-brand-yellow"}`}>{item.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
