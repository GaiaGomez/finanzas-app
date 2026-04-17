// app/layout.tsx — Layout raíz de Next.js
// Este archivo envuelve TODAS las páginas de la app

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fynt",
  description: "Tu dashboard financiero personal",
  manifest: "/manifest.json",          // PWA: le dice al navegador que es instalable
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fynt",
  },
};

export const viewport: Viewport = {
  themeColor: "#080611",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-bg text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
