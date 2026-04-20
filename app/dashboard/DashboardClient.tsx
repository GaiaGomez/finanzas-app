"use client";

import { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import AboutModal from "./components/AboutModal";
import AuthPanel from "./components/AuthPanel";
import IngresoModal from "./components/IngresoModal";
import { useDashboard } from "./hooks/useDashboard";
import MonthSummary from "./components/MonthSummary";
import FijosTab from "./components/FijosTab";
import VariablesTab from "./components/VariablesTab";
import DeudasTab from "./components/DeudasTab";
import ResumenTab from "./components/ResumenTab";
import AhorroTab from "./components/AhorroTab";
import { nextPeriodo, prevPeriodo } from "@/lib/utils";
import type { GastoFijo, GastoVariable, Ingreso, Deuda, Abono, MetaAhorro, AbonoMeta } from "@/types";

type AuthTab = "login" | "registro" | "magic";

interface Props {
  userId: string | null;
  periodoInicial: string;
  fijosIniciales: GastoFijo[];
  variablesIniciales: GastoVariable[];
  ingresosIniciales: Ingreso[];
  deudasIniciales: Deuda[];
  abonosIniciales: Abono[];
  metasAhorroIniciales: MetaAhorro[];
  abonosMetaIniciales: AbonoMeta[];
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
        <IngresoModal
          periodo={db.periodo}
          ingresos={db.ingresos}
          draft={db.nIngreso}
          saving={db.saving}
          onClose={() => db.setModalIngreso(false)}
          onChange={db.setNIngreso}
          onAdd={db.addIngreso}
          onDelete={db.delIngreso}
        />
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
                abonosMeta={db.abonosMeta}
                saving={db.saving}
                formMeta={db.formMeta}
                setFormMeta={db.setFormMeta}
                nMeta={db.nMeta}
                setNMeta={db.setNMeta}
                abonoMeta={db.abonoMeta}
                setAbonoMeta={db.setAbonoMeta}
                nAbonoMeta={db.nAbonoMeta}
                setNAbonoMeta={db.setNAbonoMeta}
                expandidaMeta={db.expandidaMeta}
                setExpandidaMeta={db.setExpandidaMeta}
                onAdd={db.addMeta}
                onEdit={db.editMeta}
                onDelete={db.delMeta}
                onAddAbono={db.addAbonoMeta}
                onDelAbono={db.delAbonoMeta}
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
