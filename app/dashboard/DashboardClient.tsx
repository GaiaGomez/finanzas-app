"use client";

import { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import AboutModal from "./components/AboutModal";
import AuthPanel from "./components/AuthPanel";
import { useDashboard } from "./hooks/useDashboard";
import MonthSummary from "./components/MonthSummary";
import FijosTab from "./components/FijosTab";
import VariablesTab from "./components/VariablesTab";
import DeudasTab from "./components/DeudasTab";
import ResumenTab from "./components/ResumenTab";
import AhorroTab from "./components/AhorroTab";
import { getPeriodoLabel, nextPeriodo, prevPeriodo } from "@/lib/utils";
import { INPUT_CLS } from "@/lib/constants";
import { fmtCOP } from "@/lib/utils";
import type { GastoFijo, GastoVariable, Ingreso, Perfil, Deuda, Abono, MetaAhorro } from "@/types";

type AuthTab = "login" | "registro" | "magic";

interface Props {
  userId: string | null;
  perfil: Perfil | null;
  periodoInicial: string;
  fijosIniciales: GastoFijo[];
  variablesIniciales: GastoVariable[];
  ingresosIniciales: Ingreso[];
  deudasIniciales: Deuda[];
  abonosIniciales: Abono[];
  metasAhorroIniciales: MetaAhorro[];
}

// ── Componente principal ───────────────────────────────────────────────────

export default function DashboardClient(props: Props) {
  const [showAbout,  setShowAbout]  = useState(false);
  const [authModal,  setAuthModal]  = useState<AuthTab | null>(null);

  return (
    <>
      {/* ══ MODAL AUTH ══ */}
      {authModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setAuthModal(null); }}
        >
          <div className="w-full sm:max-w-sm bg-brand-bg sm:bg-transparent rounded-t-3xl sm:rounded-none pt-4 pb-safe">
            <div className="flex items-center justify-between px-5 mb-2 sm:hidden">
              <span className="text-xs text-brand-muted uppercase tracking-widest font-semibold">
                {authModal === "registro" ? "Crear cuenta" : "Iniciar sesión"}
              </span>
              <button onClick={() => setAuthModal(null)}
                className="text-brand-muted hover:text-white text-lg leading-none">×</button>
            </div>
            <AuthPanel initialTab={authModal} />
          </div>
        </div>
      )}

      {/* ══ MODAL ACERCA DE ══ */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* ══ DASHBOARD ══ */}
      <Dashboard
        {...props}
        onAbout={() => setShowAbout(true)}
        onLogin={() => setAuthModal("login")}
        onRegister={() => setAuthModal("registro")}
      />
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

interface DashboardProps extends Props {
  onAbout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

function Dashboard({ onAbout, onLogin, onRegister, ...dashboardProps }: DashboardProps) {
  const db = useDashboard(dashboardProps);

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans pb-16">

      {/* ══ MODAL INGRESO ══ */}
      {db.modalIngreso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) db.setModalIngreso(false); }}>
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-sm">
            <p className="text-sm font-bold text-brand-green mb-4">Registrar ingreso</p>
            <div className="flex flex-col gap-3">
              <label className="sr-only" htmlFor="ingreso-monto">Monto del ingreso</label>
              <input id="ingreso-monto" type="number" value={db.nIngreso.monto}
                onChange={e => db.setNIngreso({ ...db.nIngreso, monto: e.target.value })}
                placeholder="Monto" className={`${INPUT_CLS} text-right font-mono text-lg`}
                autoFocus onKeyDown={e => e.key === "Enter" && db.addIngreso()} />
              <label className="sr-only" htmlFor="ingreso-descripcion">Descripción del ingreso</label>
              <input id="ingreso-descripcion" value={db.nIngreso.descripcion}
                onChange={e => db.setNIngreso({ ...db.nIngreso, descripcion: e.target.value })}
                placeholder="Descripción (ej: Pago quincenal)" className={INPUT_CLS}
                onKeyDown={e => e.key === "Enter" && db.addIngreso()} />
              <div className="flex gap-2">
                <button onClick={db.addIngreso} disabled={db.saving || !db.nIngreso.monto}
                  className="flex-1 bg-brand-green text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                  {db.saving ? "Guardando…" : "Guardar ingreso"}
                </button>
                <button onClick={() => db.setModalIngreso(false)}
                  className="px-4 py-3 rounded-xl bg-[#1e1b2e] text-brand-muted text-sm">
                  Cancelar
                </button>
              </div>
            </div>
            {db.ingresos.length > 0 && (
              <div className="mt-4 border-t border-brand-border pt-4">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-2">
                  Ingresos de {getPeriodoLabel(db.periodo)}
                </p>
                {db.ingresos.map(i => (
                  <div key={i.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-xs font-semibold text-brand-green font-mono">+ {fmtCOP(i.monto)}</p>
                      <p className="text-[10px] text-brand-muted">{i.descripcion}</p>
                    </div>
                    <button onClick={() => db.delIngreso(i.id)}
                      className="text-[#2a2440] hover:text-brand-red text-lg leading-none ml-3">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BANNER DE ERROR ══ */}
      {db.error && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-xl mx-auto bg-red-900/90 border border-brand-red text-white text-sm rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="flex-1">{db.error}</span>
          <button onClick={() => db.setError(null)} className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div className="sticky top-0 z-10">
        <div className="border-b border-brand-border px-4 py-4 bg-[linear-gradient(160deg,#13101f,#1a0f2e)]">
          <div className="max-w-xl mx-auto">
            <DashboardHeader
              hasSession={!!dashboardProps.userId}
              periodo={db.periodo}
              onPrevMes={() => db.cambiarPeriodo(prevPeriodo(db.periodo))}
              onNextMes={() => db.cambiarPeriodo(nextPeriodo(db.periodo))}
              onOpenIngreso={() => db.setModalIngreso(true)}
              onAbout={onAbout}
              onLogin={onLogin}
              onRegister={onRegister}
              onLogout={db.logout}
            />
            <MonthSummary
              periodo={db.periodo}
              totalIngresos={db.totalIngresos}
              gastado={db.gastado}
              disponible={db.disponible}
              pct={db.pct}
              ingresos={db.ingresos}
              fijos={db.fijos}
              vars={db.vars}
              abonos={db.abonos}
            />
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="flex gap-1 mb-4 overflow-x-auto pb-0.5 scrollbar-none">
          {([["fijos","Fijos"],["variables","Variables"],["deudas","Deudas"],["ahorro","Ahorro"],["resumen","Resumen"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => db.setTab(k)}
              className={`flex-1 min-w-0 py-2 px-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                db.tab === k
                  ? "bg-brand-purple text-brand-bg shadow-lg shadow-brand-purple/30"
                  : "bg-brand-card text-brand-muted"
              }`}>{l}</button>
          ))}
        </div>

        {db.loadingPeriodo ? (
          <div className="flex flex-col gap-3 animate-pulse" aria-busy="true" aria-label="Cargando datos del mes">
            <div className="h-20 bg-brand-card rounded-2xl" />
            <div className="h-14 bg-brand-card rounded-2xl" />
            <div className="h-14 bg-brand-card rounded-2xl" />
            <div className="h-14 bg-brand-card rounded-2xl" />
            <div className="h-10 bg-brand-card rounded-2xl opacity-50" />
          </div>
        ) : (
          <>
            {db.tab === "fijos" && (
              <FijosTab
                fijos={db.fijos}
                gastadoFijos={db.gastadoFijos}
                totalFijos={db.totalFijos}
                cats={db.cats}
                saving={db.saving}
                formFijo={db.formFijo}
                setFormFijo={db.setFormFijo}
                nFijo={db.nFijo}
                setNFijo={db.setNFijo}
                onToggle={db.toggleFijo}
                onEdit={db.editFijo}
                onDelete={db.delFijo}
                onAdd={db.addFijo}
              />
            )}
            {db.tab === "variables" && (
              <VariablesTab
                vars={db.vars}
                totalVars={db.totalVars}
                totalIngresos={db.totalIngresos}
                disponible={db.disponible}
                saving={db.saving}
                formVar={db.formVar}
                setFormVar={db.setFormVar}
                nVar={db.nVar}
                setNVar={db.setNVar}
                onEdit={db.editVar}
                onDelete={db.delVar}
                onAdd={db.addVar}
              />
            )}
            {db.tab === "deudas" && (
              <DeudasTab
                deudas={db.deudas}
                abonos={db.abonos}
                saving={db.saving}
                formDeuda={db.formDeuda}
                setFormDeuda={db.setFormDeuda}
                nDeuda={db.nDeuda}
                setNDeuda={db.setNDeuda}
                abonoAbierto={db.abonoAbierto}
                setAbonoAbierto={db.setAbonoAbierto}
                aumentoAbierto={db.aumentoAbierto}
                setAumentoAbierto={db.setAumentoAbierto}
                expandida={db.expandida}
                setExpandida={db.setExpandida}
                nAbono={db.nAbono}
                setNAbono={db.setNAbono}
                nAumento={db.nAumento}
                setNAumento={db.setNAumento}
                pagadoPor={db.pagadoPor}
                onAdd={db.addDeuda}
                onEdit={db.editDeuda}
                onDelete={db.delDeuda}
                onAddAbono={db.addAbono}
                onDelAbono={db.delAbono}
                onAddAumento={db.addAumento}
              />
            )}
            {db.tab === "ahorro" && (
              <AhorroTab
                metas={db.metas}
                saving={db.saving}
                formMeta={db.formMeta}
                setFormMeta={db.setFormMeta}
                nMeta={db.nMeta}
                setNMeta={db.setNMeta}
                abonoMeta={db.abonoMeta}
                setAbonoMeta={db.setAbonoMeta}
                nAbonoMeta={db.nAbonoMeta}
                setNAbonoMeta={db.setNAbonoMeta}
                onAdd={db.addMeta}
                onEdit={db.editMeta}
                onDelete={db.delMeta}
                onAddAbono={db.addAbonoMeta}
              />
            )}
            {db.tab === "resumen" && (
              <ResumenTab
                periodo={db.periodo}
                totalIngresos={db.totalIngresos}
                gastadoFijos={db.gastadoFijos}
                totalVars={db.totalVars}
                totalAbonos={db.totalAbonos}
                totalFijos={db.totalFijos}
                disponible={db.disponible}
                fijos={db.fijos}
                vars={db.vars}
              />
            )}
          </>
        )}
      </div>

    </div>
  );
}
