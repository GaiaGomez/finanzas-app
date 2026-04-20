"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { getPeriodo, prevPeriodo } from "@/lib/utils";
import type { GastoFijo, GastoVariable, Ingreso, Deuda, Abono, MetaAhorro } from "@/types";

export type Tab = "fijos" | "variables" | "deudas" | "resumen" | "ahorro";

interface Input {
  userId: string | null;
  periodoInicial: string;
  fijosIniciales: GastoFijo[];
  variablesIniciales: GastoVariable[];
  ingresosIniciales: Ingreso[];
  deudasIniciales: Deuda[];
  abonosIniciales: Abono[];
  metasAhorroIniciales: MetaAhorro[];
}

export function useDashboard({
  userId, periodoInicial,
  fijosIniciales, variablesIniciales, ingresosIniciales,
  deudasIniciales, abonosIniciales, metasAhorroIniciales,
}: Input) {
  const supabase = useMemo(() => createClient(), []);

  // ── DATOS ──
  const [periodo,  setPeriodo]  = useState(periodoInicial);
  const [fijos,    setFijos]    = useState<GastoFijo[]>(fijosIniciales);
  const [vars,     setVars]     = useState<GastoVariable[]>(variablesIniciales);
  const [ingresos, setIngresos] = useState<Ingreso[]>(ingresosIniciales);
  const [deudas,   setDeudas]   = useState<Deuda[]>(deudasIniciales);
  const [abonos,   setAbonos]   = useState<Abono[]>(abonosIniciales);
  const [metas,    setMetas]    = useState<MetaAhorro[]>(metasAhorroIniciales);

  // ── UI GLOBAL ──
  const [tab,             setTab]             = useState<Tab>("fijos");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [modalIngreso,    setModalIngreso]    = useState(false);
  const [loadingPeriodo,  setLoadingPeriodo]  = useState(false);

  // ── FORMULARIOS ──
  const [formFijo,  setFormFijo]  = useState(false);
  const [formVar,   setFormVar]   = useState(false);
  const [formDeuda, setFormDeuda] = useState(false);

  const [nFijo,    setNFijo]    = useState({ nombre: "", categoria: "Casa", monto: "" });
  const [nVar,     setNVar]     = useState({ descripcion: "", categoria: "Otro", monto: "" });
  const [nDeuda,   setNDeuda]   = useState({ nombre: "", monto_total: "" });
  const [nIngreso, setNIngreso] = useState({ monto: "", descripcion: "Pago" });

  // ── UI DEUDAS ──
  const [abonoAbierto,   setAbonoAbierto]   = useState<string | null>(null);
  const [aumentoAbierto, setAumentoAbierto] = useState<string | null>(null);
  const [expandida,      setExpandida]      = useState<string | null>(null);
  const [nAbono,   setNAbono]   = useState({ monto: "", nota: "" });
  const [nAumento, setNAumento] = useState({ monto: "", nota: "" });

  // ── UI AHORRO ──
  const [formMeta,    setFormMeta]    = useState(false);
  const [nMeta,       setNMeta]       = useState({ nombre: "", monto_meta: "" });
  const [abonoMeta,   setAbonoMeta]   = useState<string | null>(null);
  const [nAbonoMeta,  setNAbonoMeta]  = useState({ monto: "" });

  // ── CÁLCULOS ──
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const gastadoFijos  = fijos.filter(g => g.pagado).reduce((s, g) => s + g.monto, 0);
  const totalFijos    = fijos.reduce((s, g) => s + g.monto, 0);
  const totalVars     = vars.reduce((s, g) => s + g.monto, 0);
  const totalAbonos   = abonos.filter(a => a.fecha?.startsWith(periodo)).reduce((s, a) => s + a.monto, 0);
  const gastado       = gastadoFijos + totalVars + totalAbonos;
  const disponible    = totalIngresos - gastado;
  const pct           = totalIngresos > 0 ? Math.min((gastado / totalIngresos) * 100, 100) : 0;
  const cats          = [...new Set(fijos.map(g => g.categoria))];

  // ── CAMBIO DE PERIODO ──
  async function cambiarPeriodo(p: string) {
    setPeriodo(p);
    if (!userId) return;
    setLoadingPeriodo(true);
    setFijos([]); setVars([]); setIngresos([]);
    const [f, v, i] = await Promise.all([
      supabase.from("gastos_fijos").select("*").eq("user_id", userId).eq("periodo", p).order("created_at"),
      supabase.from("gastos_variables").select("*").eq("user_id", userId).eq("periodo", p).order("created_at", { ascending: false }),
      supabase.from("ingresos").select("*").eq("user_id", userId).eq("periodo", p).order("fecha", { ascending: false }),
    ]);

    let fijosData: GastoFijo[] = f.data ?? [];

    // Si el mes está vacío y es el mes actual o futuro, copiar fijos del mes anterior
    if (fijosData.length === 0 && p >= getPeriodo()) {
      const { data: prevFijos, error: errPrev } = await supabase
        .from("gastos_fijos").select("*")
        .eq("user_id", userId).eq("periodo", prevPeriodo(p)).order("created_at");

      if (errPrev) { setError(`Error al cargar mes anterior: ${errPrev.message}`); }
      else if (prevFijos && prevFijos.length > 0) {
        const toInsert = prevFijos.map(({ id: _id, created_at: _ca, ...rest }) => ({
          ...rest, periodo: p, pagado: false,
        }));
        const { data: nuevos, error: errCopy } = await supabase
          .from("gastos_fijos").insert(toInsert).select();
        if (errCopy) setError(`Error al copiar gastos fijos: ${errCopy.message}`);
        else fijosData = nuevos ?? [];
      }
    }

    setFijos(fijosData);
    setVars(v.data ?? []);
    setIngresos(i.data ?? []);
    setLoadingPeriodo(false);
  }

  // ── INGRESOS ──
  async function addIngreso() {
    if (!userId) return;
    const monto = parseFloat(nIngreso.monto);
    if (isNaN(monto) || monto <= 0) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("ingresos").insert({
      user_id: userId, monto,
      descripcion: nIngreso.descripcion.trim() || "Pago",
      fecha: new Date().toISOString().split("T")[0], periodo,
    }).select().single();
    if (err) { setError(`Error al guardar ingreso: ${err.message}`); setSaving(false); return; }
    if (data) setIngresos(prev => [data, ...prev]);
    setNIngreso({ monto: "", descripcion: "Pago" });
    setModalIngreso(false);
    setSaving(false);
  }

  async function delIngreso(id: string) {
    if (!userId) return;
    setIngresos(prev => prev.filter(i => i.id !== id));
    const { error: err } = await supabase.from("ingresos").delete().eq("id", id);
    if (err) { setError(`Error al eliminar ingreso: ${err.message}`); cambiarPeriodo(periodo); }
  }

  // ── GASTOS FIJOS ──
  async function toggleFijo(id: string, pagado: boolean) {
    if (!userId) return;
    setFijos(prev => prev.map(g => g.id === id ? { ...g, pagado: !pagado } : g));
    const { error: err } = await supabase.from("gastos_fijos").update({ pagado: !pagado }).eq("id", id);
    if (err) { setError(`Error al actualizar: ${err.message}`); setFijos(prev => prev.map(g => g.id === id ? { ...g, pagado } : g)); }
  }

  async function editFijo(id: string, campo: keyof GastoFijo, valor: string | number | boolean) {
    if (!userId) return;
    const original = fijos.find(g => g.id === id);
    setFijos(prev => prev.map(g => g.id === id ? { ...g, [campo]: valor } : g));
    const { error: err } = await supabase.from("gastos_fijos").update({ [campo]: valor }).eq("id", id);
    if (err) {
      setError(`Error al editar: ${err.message}`);
      if (original) setFijos(prev => prev.map(g => g.id === id ? original : g));
    }
  }

  async function delFijo(id: string) {
    if (!userId) return;
    const nombre = fijos.find(g => g.id === id)?.nombre ?? "este gasto";
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    setFijos(prev => prev.filter(g => g.id !== id));
    const { error: err } = await supabase.from("gastos_fijos").delete().eq("id", id);
    if (err) { setError(`Error al eliminar: ${err.message}`); cambiarPeriodo(periodo); }
  }

  async function addFijo() {
    if (!userId) return;
    const monto = parseFloat(nFijo.monto);
    if (!nFijo.nombre.trim() || isNaN(monto)) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("gastos_fijos").insert({
      user_id: userId, nombre: nFijo.nombre, categoria: nFijo.categoria,
      monto, pagado: false, periodo,
    }).select().single();
    if (err) { setError(`Error al guardar gasto fijo: ${err.message}`); setSaving(false); return; }
    if (data) setFijos(prev => [...prev, data]);
    setNFijo({ nombre: "", categoria: "Casa", monto: "" });
    setFormFijo(false);
    setSaving(false);
  }

  // ── GASTOS VARIABLES ──
  async function addVar() {
    if (!userId) return;
    const monto = parseFloat(nVar.monto);
    if (!nVar.descripcion.trim() || isNaN(monto) || monto <= 0) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("gastos_variables").insert({
      user_id: userId, descripcion: nVar.descripcion, categoria: nVar.categoria,
      monto, fecha: new Date().toISOString().split("T")[0], periodo,
    }).select().single();
    if (err) { setError(`Error al guardar gasto variable: ${err.message}`); setSaving(false); return; }
    if (data) setVars(prev => [data, ...prev]);
    setNVar({ descripcion: "", categoria: "Otro", monto: "" });
    setFormVar(false);
    setSaving(false);
  }

  async function editVar(id: string, campo: keyof GastoVariable, valor: string | number) {
    if (!userId) return;
    const original = vars.find(g => g.id === id);
    setVars(prev => prev.map(g => g.id === id ? { ...g, [campo]: valor } : g));
    const { error: err } = await supabase.from("gastos_variables").update({ [campo]: valor }).eq("id", id);
    if (err) {
      setError(`Error al editar gasto: ${err.message}`);
      if (original) setVars(prev => prev.map(g => g.id === id ? original : g));
    }
  }

  async function delVar(id: string) {
    if (!userId) return;
    const desc = vars.find(g => g.id === id)?.descripcion ?? "este gasto";
    if (!window.confirm(`¿Eliminar "${desc}"?`)) return;
    setVars(prev => prev.filter(g => g.id !== id));
    const { error: err } = await supabase.from("gastos_variables").delete().eq("id", id);
    if (err) { setError(`Error al eliminar gasto: ${err.message}`); cambiarPeriodo(periodo); }
  }

  // ── DEUDAS ──
  const pagadoPor = useCallback((deudaId: string) =>
    abonos.filter(a => a.deuda_id === deudaId).reduce((s, a) => s + a.monto, 0), [abonos]);

  async function addDeuda() {
    if (!userId) return;
    const monto = parseFloat(nDeuda.monto_total);
    if (!nDeuda.nombre.trim() || isNaN(monto) || monto <= 0) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("deudas").insert({
      user_id: userId, nombre: nDeuda.nombre, monto_total: monto,
    }).select().single();
    if (err) { setError(`Error al guardar deuda: ${err.message}`); setSaving(false); return; }
    if (data) setDeudas(prev => [...prev, data]);
    setNDeuda({ nombre: "", monto_total: "" });
    setFormDeuda(false);
    setSaving(false);
  }

  async function editDeuda(id: string, campo: keyof Deuda, valor: string | number) {
    if (!userId) return;
    const original = deudas.find(d => d.id === id);
    setDeudas(prev => prev.map(d => d.id === id ? { ...d, [campo]: valor } : d));
    const { error: err } = await supabase.from("deudas").update({ [campo]: valor }).eq("id", id);
    if (err) {
      setError(`Error al editar deuda: ${err.message}`);
      if (original) setDeudas(prev => prev.map(d => d.id === id ? original : d));
    }
  }

  async function delDeuda(id: string) {
    if (!userId) return;
    const nombre = deudas.find(d => d.id === id)?.nombre ?? "esta deuda";
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    const deudasSnapshot = [...deudas];
    const abonosSnapshot = [...abonos];
    setDeudas(prev => prev.filter(d => d.id !== id));
    setAbonos(prev => prev.filter(a => a.deuda_id !== id));
    const { error: err } = await supabase.from("deudas").delete().eq("id", id);
    if (err) {
      setError(`Error al eliminar deuda: ${err.message}`);
      setDeudas(deudasSnapshot);
      setAbonos(abonosSnapshot);
    }
  }

  async function addAbono(deudaId: string) {
    if (!userId) return;
    const monto = parseFloat(nAbono.monto);
    if (isNaN(monto) || monto <= 0) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("abonos").insert({
      deuda_id: deudaId, user_id: userId, monto,
      nota: nAbono.nota.trim(),
      fecha: new Date().toISOString().split("T")[0],
    }).select().single();
    if (err) { setError(`Error al guardar abono: ${err.message}`); setSaving(false); return; }
    if (data) setAbonos(prev => [data, ...prev]);
    setNAbono({ monto: "", nota: "" });
    setAbonoAbierto(null);
    setSaving(false);
  }

  async function delAbono(id: string) {
    if (!userId) return;
    if (!window.confirm("¿Eliminar este abono?")) return;
    const snapshot = [...abonos];
    setAbonos(prev => prev.filter(a => a.id !== id));
    const { error: err } = await supabase.from("abonos").delete().eq("id", id);
    if (err) {
      setError(`Error al eliminar abono: ${err.message}`);
      setAbonos(snapshot);
    }
  }

  async function addAumento(deuda: Deuda) {
    if (!userId) return;
    const monto = parseFloat(nAumento.monto);
    if (isNaN(monto) || monto <= 0) return;
    const nuevoTotal = deuda.monto_total + monto;
    setSaving(true); setError(null);
    const snapshot = [...deudas];
    setDeudas(prev => prev.map(d => d.id === deuda.id ? { ...d, monto_total: nuevoTotal } : d));
    const { error: err } = await supabase.from("deudas").update({ monto_total: nuevoTotal }).eq("id", deuda.id);
    if (err) {
      setError(`Error al aumentar deuda: ${err.message}`);
      setDeudas(snapshot);
      setSaving(false);
      return;
    }
    setNAumento({ monto: "", nota: "" });
    setAumentoAbierto(null);
    setSaving(false);
  }

  // ── METAS DE AHORRO ──

  async function addMeta() {
    if (!userId) return;
    const monto = parseFloat(nMeta.monto_meta);
    if (!nMeta.nombre.trim() || isNaN(monto) || monto <= 0) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("metas_ahorro").insert({
      user_id: userId, nombre: nMeta.nombre, monto_meta: monto, monto_actual: 0,
    }).select().single();
    if (err) { setError(`Error al guardar meta: ${err.message}`); setSaving(false); return; }
    if (data) setMetas(prev => [...prev, data]);
    setNMeta({ nombre: "", monto_meta: "" });
    setFormMeta(false);
    setSaving(false);
  }

  async function editMeta(id: string, campo: keyof MetaAhorro, valor: string | number) {
    if (!userId) return;
    const original = metas.find(m => m.id === id);
    setMetas(prev => prev.map(m => m.id === id ? { ...m, [campo]: valor } : m));
    const { error: err } = await supabase.from("metas_ahorro").update({ [campo]: valor }).eq("id", id);
    if (err) {
      setError(`Error al editar meta: ${err.message}`);
      if (original) setMetas(prev => prev.map(m => m.id === id ? original : m));
    }
  }

  async function delMeta(id: string) {
    if (!userId) return;
    const nombre = metas.find(m => m.id === id)?.nombre ?? "esta meta";
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    const snapshot = [...metas];
    setMetas(prev => prev.filter(m => m.id !== id));
    const { error: err } = await supabase.from("metas_ahorro").delete().eq("id", id);
    if (err) {
      setError(`Error al eliminar meta: ${err.message}`);
      setMetas(snapshot);
    }
  }

  async function addAbonoMeta(metaId: string) {
    if (!userId) return;
    const monto = parseFloat(nAbonoMeta.monto);
    if (isNaN(monto) || monto <= 0) return;
    const meta = metas.find(m => m.id === metaId);
    if (!meta) return;
    const nuevoActual = meta.monto_actual + monto;
    setSaving(true); setError(null);
    const snapshot = [...metas];
    setMetas(prev => prev.map(m => m.id === metaId ? { ...m, monto_actual: nuevoActual } : m));
    const { error: err } = await supabase.from("metas_ahorro").update({ monto_actual: nuevoActual }).eq("id", metaId);
    if (err) {
      setError(`Error al registrar abono: ${err.message}`);
      setMetas(snapshot);
      setSaving(false);
      return;
    }
    setNAbonoMeta({ monto: "" });
    setAbonoMeta(null);
    setSaving(false);
  }

  async function logout() {
    if (userId) await supabase.auth.signOut();
    window.location.href = "/dashboard";
  }

  return {
    // Datos
    periodo, fijos, vars, ingresos, deudas, abonos, metas,
    // Cálculos
    totalIngresos, gastadoFijos, totalFijos, totalVars, totalAbonos,
    gastado, disponible, pct, cats,
    // UI global
    tab, setTab, saving, error, setError, modalIngreso, setModalIngreso, loadingPeriodo,
    // Formularios
    formFijo, setFormFijo, formVar, setFormVar, formDeuda, setFormDeuda,
    nFijo, setNFijo, nVar, setNVar, nDeuda, setNDeuda, nIngreso, setNIngreso,
    // UI deudas
    abonoAbierto, setAbonoAbierto, aumentoAbierto, setAumentoAbierto,
    expandida, setExpandida, nAbono, setNAbono, nAumento, setNAumento,
    // UI ahorro
    formMeta, setFormMeta, nMeta, setNMeta,
    abonoMeta, setAbonoMeta, nAbonoMeta, setNAbonoMeta,
    // Handlers
    cambiarPeriodo, addIngreso, delIngreso,
    toggleFijo, editFijo, delFijo, addFijo,
    addVar, editVar, delVar,
    pagadoPor, addDeuda, editDeuda, delDeuda,
    addAbono, delAbono, addAumento,
    addMeta, editMeta, delMeta, addAbonoMeta,
    logout,
  };
}
