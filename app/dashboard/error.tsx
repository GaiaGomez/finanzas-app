"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[dashboard] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-brand-muted text-sm text-center max-w-xs">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo o recargar la página.
      </p>
      <button
        onClick={reset}
        className="bg-brand-purple text-brand-bg text-sm font-bold px-5 py-2.5 rounded-xl"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
