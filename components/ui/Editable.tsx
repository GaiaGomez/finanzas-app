// Editable.tsx — campo de texto/número/select que se edita al hacer click
// Igual al que tenías en el Artifact, ahora como componente React real
"use client";
import { useEffect, useRef, useState } from "react";
import { fmtCOP } from "@/lib/utils";

interface Props {
  value: string | number;
  tipo?: "text" | "number" | "select";
  opciones?: string[];
  onSave: (v: string | number) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function Editable({ value, tipo = "text", opciones = [], onSave, className = "", placeholder = "—", style }: Props) {
  const [on, setOn]   = useState(false);
  const [tmp, setTmp] = useState("");
  const ref           = useRef<HTMLInputElement & HTMLSelectElement>(null);

  function abrir() { setTmp(String(value)); setOn(true); }
  function confirmar() {
    const v = tipo === "number" ? parseFloat(tmp) : tmp.trim();
    if (tipo === "number" && isNaN(v as number)) { setOn(false); return; }
    if (tipo === "text" && !v) { setOn(false); return; }
    onSave(v);
    setOn(false);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirmar();
    if (e.key === "Escape") setOn(false);
  }
  useEffect(() => { if (on && ref.current) ref.current.focus(); }, [on]);

  const inputClass = "bg-[#1a1730] border border-brand-purple rounded-lg px-2 py-0.5 text-white outline-none font-inherit";

  if (!on) return (
    <span
      onClick={abrir}
      title="Click para editar"
      className={`cursor-text border-b border-dashed border-[#2a2440] pb-px ${className}`}
      style={style}
    >
      {tipo === "number"
        ? fmtCOP(value as number)
        : value || <span className="text-brand-muted">{placeholder}</span>}
    </span>
  );

  if (tipo === "select") return (
    <select
      ref={ref} value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={confirmar} onKeyDown={onKey}
      className={`${inputClass} ${className}`}
    >
      {opciones.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <input
      ref={ref} type={tipo === "number" ? "number" : "text"} value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={confirmar} onKeyDown={onKey}
      className={`${inputClass} ${className} ${tipo === "number" ? "text-right w-28" : "w-auto"}`}
    />
  );
}
