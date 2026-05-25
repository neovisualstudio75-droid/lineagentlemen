import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowRight } from "@/components/icons";

const stats = [
  { value: "40", label: "Min · sesión" },
  { value: "6", label: "Días / semana" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Glows + grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:64px_64px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade animate-glow-pulse blur-2xl" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-content grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-12 lg:gap-8 lg:py-0">
        {/* Left — editorial copy */}
        <div className="lg:col-span-7">
          <p
            className="eyebrow flex animate-fade-up items-center gap-3"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-px w-8 bg-muted/50" />
            Barbería · Desde 2015
          </p>

          <h1
            className="mt-7 animate-fade-up text-balance text-[clamp(2.4rem,6.5vw,5rem)] font-bold leading-[0.98]"
            style={{ animationDelay: "0.15s" }}
          >
            Servicio de peluquería{" "}
            <span className="text-muted">y estilización</span>
          </h1>

          <p
            className="mt-8 max-w-md animate-fade-up text-base leading-relaxed text-muted"
            style={{ animationDelay: "0.25s" }}
          >
            Reserva online en segundos y déjate en las mejores manos. Cortes,
            barba y estilizado con acabado de alta peluquería.
          </p>

          <div
            className="mt-10 flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.35s" }}
          >
            <Link href="/reservar" className="btn-primary group w-full sm:w-auto">
              Reservar cita
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href="#servicios" className="btn-secondary w-full sm:w-auto">
              Ver servicios
            </a>
          </div>

          <div
            className="mt-16 flex max-w-md animate-fade-up items-end gap-10 border-t border-line pt-8"
            style={{ animationDelay: "0.45s" }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-serif text-4xl leading-none">{s.value}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — framed emblem with floating chips */}
        <div
          className="relative hidden animate-fade-up lg:col-span-5 lg:block"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line bg-surface/40">
            <div className="grain absolute inset-0 opacity-[0.4] mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-float">
                <Logo className="h-20 w-auto opacity-90" />
              </div>
            </div>
            <div className="absolute -left-px bottom-0 right-0 h-1/2 bg-gradient-to-t from-bg/80 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-2xl font-bold">Línea Gentlemen</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Sanlúcar de Barrameda (Cádiz)
              </p>
            </div>
          </div>

          {/* Floating glass chips */}
          <div
            className="chip glass absolute -left-5 top-10 animate-fade-up text-text"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Reserva online 24/7
          </div>
          <div
            className="chip glass absolute -right-4 top-1/2 animate-fade-up text-text"
            style={{ animationDelay: "1s" }}
          >
            Corte + Barba
          </div>
        </div>
      </div>
    </section>
  );
}
