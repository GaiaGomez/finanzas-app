"use client";

import { useEffect, useRef, useState } from "react";
import { getPeriodoLabel, nextPeriodo, prevPeriodo } from "@/lib/utils";

interface Props {
  periodo: string;
  onPrevMes: () => void;
  onNextMes: () => void;
  onOpenIngreso: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  periodo, onPrevMes, onNextMes, onOpenIngreso, onLogout,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  return (
    <div className="flex items-center justify-between mb-3">
      {/* Izquierda: logo + navegador de mes */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
          <span className="text-brand-bg font-black text-sm leading-none">F</span>
        </div>
        <button onClick={onPrevMes}
          className="w-7 h-7 rounded-lg bg-[#1a1730] text-brand-muted hover:text-white flex items-center justify-center text-sm transition-colors">
          ‹
        </button>
        <h1 className="text-base font-extrabold tracking-tight">{getPeriodoLabel(periodo)}</h1>
        <button onClick={onNextMes}
          className="w-7 h-7 rounded-lg bg-[#1a1730] text-brand-muted hover:text-white flex items-center justify-center text-sm transition-colors">
          ›
        </button>
      </div>

      {/* Derecha: + Ingreso + menú ⋮ */}
      <div className="flex items-center gap-2">
        <button onClick={onOpenIngreso}
          className="bg-brand-green text-brand-bg font-bold px-3 py-1.5 rounded-xl text-xs hover:opacity-90 transition-opacity">
          + Ingreso
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.08] border border-white/10 text-white/60 text-lg hover:bg-white/[0.12] transition-colors">
            ⋮
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[160px] rounded-xl border border-white/10 bg-[#252547] p-1">
              <button
                onClick={() => { onNextMes(); setMenuOpen(false); }}
                className="block w-full text-left px-3.5 py-2.5 text-[13px] text-white rounded-md hover:bg-white/[0.07] transition-colors">
                + Nuevo mes
              </button>
              <div className="h-px bg-white/[0.08] my-0.5 mx-1.5" />
              <button
                onClick={() => { onLogout(); setMenuOpen(false); }}
                className="block w-full text-left px-3.5 py-2.5 text-[13px] text-white/40 rounded-md hover:bg-white/[0.07] transition-colors">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
