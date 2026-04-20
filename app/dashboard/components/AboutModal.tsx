interface Props {
  onClose: () => void;
}

export default function AboutModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
              <span className="text-brand-bg font-black text-xs leading-none">F</span>
            </div>
            <h2 className="font-extrabold text-base tracking-tight">Acerca de Fynt</h2>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white text-xl leading-none transition-colors">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-brand-muted">
            Dashboard financiero personal para organizar tus finanzas mes a mes.
          </p>

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-3">
              <span className="text-base leading-none mt-0.5">💳</span>
              <div>
                <span className="text-white font-semibold">Presupuesto mensual —</span>{" "}
                <span className="text-brand-muted">
                  Registra gastos fijos y márcalos como pagados. Se copian al mes siguiente automáticamente.
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-base leading-none mt-0.5">💸</span>
              <div>
                <span className="text-white font-semibold">Control de deudas —</span>{" "}
                <span className="text-brand-muted">
                  Agrega deudas, registra abonos y visualiza el progreso de pago con barra de avance.
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-base leading-none mt-0.5">🛒</span>
              <div>
                <span className="text-white font-semibold">Gastos variables —</span>{" "}
                <span className="text-brand-muted">
                  Lleva el día a día. La app te avisa si superas el límite recomendado del mes.
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-base leading-none mt-0.5">📊</span>
              <div>
                <span className="text-white font-semibold">Resumen —</span>{" "}
                <span className="text-brand-muted">
                  Vista consolidada: ingresos, fijos, variables, abonos y disponible final.
                </span>
              </div>
            </div>
          </div>

          <p className="text-brand-muted text-xs border-t border-brand-border pt-3">
            Tus datos se guardan en tu cuenta y son exclusivamente tuyos.
          </p>
        </div>
      </div>
    </div>
  );
}
