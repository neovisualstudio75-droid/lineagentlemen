import Link from "next/link";
import { SERVICES, SCHEDULE_TEXT } from "@/lib/constants";
import {
  ScissorsIcon,
  RazorIcon,
  ArrowUpRight,
  ArrowRight,
  ClockIcon,
  MapPinIcon,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Reveal } from "@/components/motion/Reveal";

export default function HomePage() {
  return (
    <main>
      <Hero />

      <Marquee />

      {/* SERVICIOS — lista editorial */}
      <section id="servicios" className="py-24 sm:py-32">
        <div className="mx-auto max-w-content px-6">
          <Reveal className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Lo que hacemos</p>
              <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Servicios</h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Cada sesión dura 40 minutos de atención dedicada, sin prisas.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.1}>
                <Link
                  href="/reservar"
                  className="card group relative flex h-full flex-col overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 hover:border-text/40 hover:bg-surface sm:p-10"
                >
                  {/* glow al hover */}
                  <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-radial-fade opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line text-text/80 transition-colors duration-300 group-hover:border-text/40">
                      {s.id === "corte" ? (
                        <ScissorsIcon className="h-6 w-6" />
                      ) : (
                        <RazorIcon className="h-6 w-6" />
                      )}
                    </span>
                    {i === 1 && (
                      <span className="chip text-[10px] uppercase tracking-[0.16em] text-text">
                        Más popular
                      </span>
                    )}
                  </div>

                  <h3 className="relative mt-8 text-2xl font-bold sm:text-3xl">
                    {s.nombre}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {s.descripcion}
                  </p>

                  <div className="relative mt-8 flex items-end justify-between border-t border-line pt-6">
                    <div>
                      <div className="font-serif text-5xl leading-none">
                        {s.precio}
                        <span className="ml-0.5 text-2xl text-muted">€</span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {s.duracion} min
                      </div>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-muted transition-all duration-300 group-hover:border-text group-hover:bg-text group-hover:text-bg">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HORARIO + UBICACIÓN — split asimétrico */}
      <section className="border-t border-line bg-surface/30 py-24 sm:py-32">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-16 px-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">Cuándo y dónde</p>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
              Horario de <span className="text-muted">apertura</span>
            </h2>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <MapPinIcon className="h-4 w-4" />
              Sanlúcar de Barrameda (Cádiz) · Cita previa recomendada
            </p>
            <Link href="/reservar" className="btn-secondary group mt-10">
              Reservar ahora
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7">
            <div className="divide-y divide-line border-y border-line">
              {SCHEDULE_TEXT.map((row) => (
                <div
                  key={row.dias}
                  className="flex items-center justify-between py-6"
                >
                  <span className="text-lg font-medium">{row.dias}</span>
                  <span className="font-serif text-xl text-muted">
                    {row.horas}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden border-t border-line py-28 sm:py-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-radial-fade blur-2xl" />
        <Reveal className="relative mx-auto max-w-content px-6 text-center">
          <h2 className="mx-auto max-w-2xl text-balance text-4xl font-bold leading-tight sm:text-6xl">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
            Elige profesional, día y hora. Tu cita confirmada en menos de un
            minuto.
          </p>
          <Link
            href="/reservar"
            className="btn-primary group mt-10 px-9 py-4 text-sm"
          >
            Reservar cita
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-16">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-8 px-6 sm:flex-row">
          <Logo className="h-8" />
          <nav className="flex items-center gap-8 text-sm text-muted">
            <Link href="/reservar" className="transition-colors hover:text-text">
              Reservar
            </Link>
            <a href="#servicios" className="transition-colors hover:text-text">
              Servicios
            </a>
            <Link href="/login" className="transition-colors hover:text-text">
              Acceder
            </Link>
          </nav>
          <p className="text-xs text-muted/70">
            © {new Date().getFullYear()} Línea Gentlemen
          </p>
        </div>
      </footer>
    </main>
  );
}
