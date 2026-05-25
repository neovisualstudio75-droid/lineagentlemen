import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/**
 * Layout split-screen para las pantallas de autenticación:
 * panel de marca a la izquierda (oculto en móvil) + formulario a la derecha.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden border-r border-line p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="grain absolute inset-0 opacity-[0.35] mix-blend-overlay" />
        <div className="pointer-events-none absolute -left-1/3 top-0 h-[600px] w-[600px] rounded-full bg-radial-fade animate-glow-pulse blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:56px_56px] [mask-image:radial-gradient(60%_60%_at_30%_30%,black,transparent)]"
          aria-hidden
        />

        <Link href="/" className="relative w-fit transition-opacity hover:opacity-80">
          <Logo className="h-9" />
        </Link>

        <div className="relative">
          <p className="text-[3rem] font-bold leading-[1.04]">
            Servicio de peluquería{" "}
            <span className="text-muted">y estilización.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            Reserva online en segundos y luce siempre tu mejor versión.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>Desde 2015</span>
          <span className="h-3 w-px bg-line" />
          <span>Sanlúcar de Barrameda</span>
          <span className="h-3 w-px bg-line" />
          <span>Cádiz</span>
        </div>
      </aside>

      {/* Panel del formulario */}
      <section className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">{children}</div>
      </section>
    </main>
  );
}
