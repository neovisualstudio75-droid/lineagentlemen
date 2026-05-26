"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Barber, AppointmentWithRelations } from "@/lib/types";
import { getMonthAppointments } from "@/actions/admin";
import { SERVICES, getService } from "@/lib/constants";
import {
  cn,
  fromDateKey,
  toDateKey,
  formatDateLong,
  hhmm,
} from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "@/components/icons";
import { BarberAvatar } from "@/components/booking/BarberAvatar";

type Periodo = "dia" | "semana" | "mes";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
];

export function FacturacionTab({
  barbers,
  today,
}: {
  barbers: Barber[];
  today: string;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [refDate, setRefDate] = useState(today);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Calcula el rango de fechas según el periodo
  const range = useMemo(() => computeRange(refDate, periodo), [refDate, periodo]);

  const { data, isFetching } = useQuery({
    queryKey: ["fact", range.desde, range.hasta],
    queryFn: () => getMonthAppointments(range.desde, range.hasta),
  });

  const citas = data ?? [];

  // Solo cuentan las completadas + pendientes (ingresos reales/esperados)
  const factByBarber = (bid: string) =>
    citas
      .filter(
        (c) =>
          c.barber_id === bid &&
          (c.estado === "completada" || c.estado === "pendiente"),
      )
      .reduce((sum, c) => sum + servicePrice(c.service), 0);

  const completadasByBarber = (bid: string) =>
    citas.filter(
      (c) => c.barber_id === bid && c.estado === "completada",
    ).length;

  return (
    <div>
      {/* Selector de periodo */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-line p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriodo(p.id);
                setSelectedBarber(null);
              }}
              className={cn(
                "px-4 py-1.5 text-xs uppercase tracking-widest transition-colors rounded-full",
                periodo === p.id
                  ? "bg-text text-bg"
                  : "text-muted hover:text-text",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <DateNavigator
          periodo={periodo}
          refDate={refDate}
          onChange={setRefDate}
          today={today}
          rangeLabel={range.label}
        />
      </div>

      {isFetching && (
        <p className="mb-4 text-xs text-muted">Cargando…</p>
      )}

      {!selectedBarber ? (
        <BarberFactGrid
          barbers={barbers}
          factByBarber={factByBarber}
          completadasByBarber={completadasByBarber}
          onSelect={setSelectedBarber}
          rangeLabel={range.label}
        />
      ) : (
        <BarberFactDetail
          barber={selectedBarber}
          citas={citas.filter((c) => c.barber_id === selectedBarber.id)}
          range={range}
          periodo={periodo}
          onBack={() => setSelectedBarber(null)}
        />
      )}
    </div>
  );
}

/* ─── Grid de peluqueros con facturación ──────────────── */
function BarberFactGrid({
  barbers,
  factByBarber,
  completadasByBarber,
  onSelect,
  rangeLabel,
}: {
  barbers: Barber[];
  factByBarber: (bid: string) => number;
  completadasByBarber: (bid: string) => number;
  onSelect: (b: Barber) => void;
  rangeLabel: string;
}) {
  const totalGlobal = barbers.reduce((s, b) => s + factByBarber(b.id), 0);

  return (
    <div>
      {/* Total del periodo */}
      <div className="mb-6 flex items-end justify-between border-b border-line pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            Facturación total · <span className="capitalize">{rangeLabel}</span>
          </p>
          <p className="mt-2 font-serif text-5xl font-medium leading-none">
            {totalGlobal.toFixed(0)}
            <span className="ml-1 text-2xl text-muted">€</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((b) => {
          const total = factByBarber(b.id);
          const completadas = completadasByBarber(b.id);
          const pct = totalGlobal > 0 ? Math.round((total / totalGlobal) * 100) : 0;

          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="card group relative flex flex-col items-start overflow-hidden p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-text/40 hover:bg-surface"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-radial-fade opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative flex w-full items-start justify-between">
                <BarberAvatar
                  nombre={b.nombre}
                  fotoUrl={b.foto_url}
                  size={56}
                />
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-all group-hover:border-text group-hover:bg-text group-hover:text-bg">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <h3 className="relative mt-5 text-lg font-bold">{b.nombre}</h3>

              <div className="relative mt-6 w-full border-t border-line pt-5">
                <p className="font-serif text-4xl font-medium leading-none">
                  {total.toFixed(0)}
                  <span className="ml-1 text-xl text-muted">€</span>
                </p>
                <div className="mt-3 flex items-center justify-between text-[0.7rem] text-muted">
                  <span>{completadas} citas</span>
                  <span>{pct}% del total</span>
                </div>
                {/* Barra de porcentaje */}
                <div className="mt-2 h-0.5 w-full overflow-hidden bg-line">
                  <div
                    className="h-full bg-text transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Detalle por peluquero ───────────────────────────── */
function BarberFactDetail({
  barber,
  citas,
  range,
  periodo,
  onBack,
}: {
  barber: Barber;
  citas: AppointmentWithRelations[];
  range: { desde: string; hasta: string; label: string };
  periodo: Periodo;
  onBack: () => void;
}) {
  const facturables = citas.filter(
    (c) => c.estado === "completada" || c.estado === "pendiente",
  );
  const completadas = citas.filter((c) => c.estado === "completada");

  const total = facturables.reduce(
    (s, c) => s + servicePrice(c.service),
    0,
  );
  const totalReal = completadas.reduce(
    (s, c) => s + servicePrice(c.service),
    0,
  );
  const ticketMedio =
    facturables.length > 0 ? total / facturables.length : 0;

  // Desglose por servicio
  const porServicio = SERVICES.map((s) => {
    const cantidad = facturables.filter((c) => c.service === s.id).length;
    return {
      ...s,
      cantidad,
      importe: cantidad * s.precio,
    };
  });

  function exportarPDF() {
    window.print();
  }

  return (
    <div>
      {/* Cabecera de pantalla (oculta al imprimir) */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Todos los peluqueros
        </button>

        <button
          onClick={exportarPDF}
          className="btn-primary text-xs"
        >
          Exportar PDF
        </button>
      </div>

      {/* Vista imprimible: marca de identidad */}
      <div
        id="factura-print"
        className="print:bg-white print:p-8 print:text-black"
      >
        {/* Cabecera para impresión */}
        <div className="hidden print:mb-8 print:block print:border-b print:border-black print:pb-4">
          <h1 className="text-2xl font-bold">LÍNEA GENTLEMEN</h1>
          <p className="text-xs">
            Sanlúcar de Barrameda · Cádiz
          </p>
          <p className="mt-4 text-sm">
            <strong>Facturación · {barber.nombre}</strong>
          </p>
          <p className="text-xs">{range.label}</p>
        </div>

        {/* Cabecera en pantalla */}
        <div className="mb-8 flex items-end justify-between border-b border-line pb-4 print:hidden">
          <div className="flex items-center gap-4">
            <BarberAvatar
              nombre={barber.nombre}
              fotoUrl={barber.foto_url}
              size={56}
            />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">
                Facturación · <span className="capitalize">{periodo}</span>
              </p>
              <p className="text-2xl font-bold">{barber.nombre}</p>
              <p className="mt-1 text-xs text-muted capitalize">{range.label}</p>
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatBlock
            label="Total facturable"
            value={`${total.toFixed(2)} €`}
            sublabel={`${facturables.length} citas`}
          />
          <StatBlock
            label="Cobrado real"
            value={`${totalReal.toFixed(2)} €`}
            sublabel={`${completadas.length} completadas`}
          />
          <StatBlock
            label="Ticket medio"
            value={`${ticketMedio.toFixed(2)} €`}
            sublabel="por cita"
          />
        </div>

        {/* Desglose por servicio */}
        <div className="mb-8 rounded-2xl border border-line p-6 print:border print:border-black/40 print:p-4">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted">
            Desglose por servicio
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 font-medium">Servicio</th>
                <th className="pb-2 text-center font-medium">Cantidad</th>
                <th className="pb-2 text-right font-medium">Precio</th>
                <th className="pb-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {porServicio.map((s) => (
                <tr key={s.id} className="border-b border-line/30 last:border-0">
                  <td className="py-3">{s.nombre}</td>
                  <td className="py-3 text-center">{s.cantidad}</td>
                  <td className="py-3 text-right">{s.precio.toFixed(2)} €</td>
                  <td className="py-3 text-right font-medium">
                    {s.importe.toFixed(2)} €
                  </td>
                </tr>
              ))}
              <tr>
                <td className="pt-4 font-medium" colSpan={3}>
                  TOTAL
                </td>
                <td className="pt-4 text-right font-serif text-xl">
                  {total.toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lista de citas */}
        <div className="rounded-2xl border border-line p-6 print:border print:border-black/40 print:p-4">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted">
            Detalle de citas ({facturables.length})
          </p>
          {facturables.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Sin citas en este periodo.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Hora</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Servicio</th>
                  <th className="pb-2 text-center font-medium">Estado</th>
                  <th className="pb-2 text-right font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {facturables.map((c) => {
                  const svc = getService(c.service);
                  const nombre = c.profiles
                    ? `${c.profiles.nombre} ${c.profiles.apellidos}`
                    : "Cliente";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-line/30 text-sm last:border-0"
                    >
                      <td className="py-2.5 capitalize">{shortDate(c.fecha)}</td>
                      <td className="py-2.5 tabular-nums">
                        {hhmm(c.hora_inicio)}
                      </td>
                      <td className="py-2.5">{nombre}</td>
                      <td className="py-2.5">{svc?.nombre}</td>
                      <td className="py-2.5 text-center text-xs capitalize text-muted">
                        {c.estado === "completada" ? "Cobrada" : "Pendiente"}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        {(svc?.precio ?? 0).toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie sólo en impresión */}
        <div className="hidden print:mt-12 print:block print:border-t print:border-black/40 print:pt-4 print:text-xs">
          Generado el {new Date().toLocaleDateString("es-ES")} · Línea Gentlemen
        </div>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header,
          nav,
          .btn-primary,
          .btn-secondary {
            display: none !important;
          }
          #factura-print table {
            color: black !important;
          }
          #factura-print .border-line,
          #factura-print .border-line\\/30 {
            border-color: rgba(0, 0, 0, 0.2) !important;
          }
          #factura-print .text-muted {
            color: rgba(0, 0, 0, 0.6) !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-line p-5 print:border print:border-black/40">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl font-medium">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
    </div>
  );
}

/* ─── Navegador de fechas ─────────────────────────────── */
function DateNavigator({
  periodo,
  refDate,
  onChange,
  today,
  rangeLabel,
}: {
  periodo: Periodo;
  refDate: string;
  onChange: (d: string) => void;
  today: string;
  rangeLabel: string;
}) {
  function shift(delta: number) {
    const d = fromDateKey(refDate);
    if (periodo === "dia") d.setDate(d.getDate() + delta);
    else if (periodo === "semana") d.setDate(d.getDate() + 7 * delta);
    else d.setMonth(d.getMonth() + delta);
    onChange(toDateKey(d));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="flex h-8 w-8 items-center justify-center border border-line transition-colors hover:border-text/40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[12rem] text-center text-sm font-medium capitalize">
        {rangeLabel}
      </span>
      <button
        onClick={() => shift(1)}
        className="flex h-8 w-8 items-center justify-center border border-line transition-colors hover:border-text/40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {refDate !== today && (
        <button
          onClick={() => onChange(today)}
          className="ml-2 text-xs text-muted underline underline-offset-2 hover:text-text"
        >
          Hoy
        </button>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function computeRange(
  refDate: string,
  periodo: Periodo,
): { desde: string; hasta: string; label: string } {
  const d = fromDateKey(refDate);

  if (periodo === "dia") {
    return {
      desde: refDate,
      hasta: refDate,
      label: formatDateLong(d),
    };
  }

  if (periodo === "semana") {
    // Lunes a domingo de la semana del refDate
    const dow = (d.getDay() + 6) % 7;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() - dow);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const label =
      `Sem. del ${lunes.getDate()} ` +
      new Intl.DateTimeFormat("es-ES", { month: "short" }).format(lunes) +
      ` al ${domingo.getDate()} ` +
      new Intl.DateTimeFormat("es-ES", { month: "short" }).format(domingo);
    return {
      desde: toDateKey(lunes),
      hasta: toDateKey(domingo),
      label,
    };
  }

  // Mes
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const label = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(first);
  return {
    desde: toDateKey(first),
    hasta: toDateKey(last),
    label,
  };
}

function servicePrice(serviceId: string): number {
  return getService(serviceId)?.precio ?? 0;
}

function shortDate(fecha: string): string {
  const d = fromDateKey(fecha);
  return (
    d.getDate() +
    " " +
    new Intl.DateTimeFormat("es-ES", { month: "short" }).format(d)
  );
}
