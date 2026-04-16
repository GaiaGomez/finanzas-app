// Barra de progreso reutilizable
// val/total definen el porcentaje, color es el color de la barra
interface Props { val: number; total: number; color?: string; }

export default function Bar({ val, total, color = "#a78bfa" }: Props) {
  const pct = total > 0 ? Math.min((val / total) * 100, 100) : 0;
  const over = total > 0 && val > total;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1e1b2e" }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: over ? "#f87171" : color }}
      />
    </div>
  );
}
