"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Barber, EstadoCita } from "@/lib/types";
import {
  getDayAppointments,
  getDayBlocks,
  setAppointmentStatus,
} from "@/actions/admin";
import { getService } from "@/lib/constants";
import {
  cn,
  fromDateKey,
  toDateKey,
  formatDateLong,
  hhmm,
} from "@/lib/utils";
import { slotsForWeekday, isOpenDay } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "@/components/icons";

/* ─── tipos ──────────────────────────────────────────────── */
type Cita = import("@/lib/types").AppointmentWithRelations;

/* ─── badges de estado ───────────────────────────────────── */
const ESTADO_STYLES: Record<EstadoCita, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelada: "bg-line text-muted border-line",
  no_presentado: "bg-danger/15 text-danger border-danger/30",
};
const ESTADO_LABEL: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada",
  no_presentado: "No vino",
};

/* ─── componente principal ───────────────────────────────── */
export function AgendaTab({
  barbers,
  today,
}: {
  barbers: Barber[];
  today: string;
}) {
  const [fecha, setFecha] = useState(today);
  const qc = useQueryClient();

  const { data: citas, isFetching: loadingCitas } = useQuery({
    queryKey: ["admin-day", fecha],
    queryFn: () => getDayAppointments(fecha),
  });

  const { data: bloqueos } = useQuery({
    queryKey: ["admin-blocks-day", fecha],
    queryFn: () => getDayBlocks(fecha),
  });

  function shiftDay(delta: number) {
    const d = fromDateKey(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(toDateKey(d));
  }

  const weekday = fromDateKey(fecha).getDay();
  const slots = isOpenDay(weekday) ? slotsForWeekday(weekday) : [];
  const citasHoy = citas ?? [];
  const bloqueosHoy = bloqueos ?? [];

  // recuento rápido por peluquero
  const countByBarber = (bid: string) =>
    citasHoy.filter(
      (c) => c.barber_id === bid && c.estado !== "cancelada",
    ).length;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-day", fecha] });
    qc.invalidateQueries({ queryKey: ["admin-blocks-day", fecha] });
  }

  return (
    <div>
      {/* ── Navegación de día ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => shiftDay(-1)}
          className="flex h-8 w-8 items-center justify-center border border-line transition-colors hover:border-text/40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[13rem] text-center text-sm font-medium capitalize">
          {formatDateLong(fromDateKey(fecha))}
        </span>
        <button
          onClick={() => shiftDay(1)}
          className="flex h-8 w-8 items-center justify-center border border-line transition-colors hover:border-text/40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {fecha !== today && (
          <button
            onClick={() => setFecha(today)}
            className="text-xs text-muted underline underline-offset-2 hover:text-text"
          >
            Hoy
          </button>
        )}
        {loadingCitas && (
          <span className="text-xs text-muted">Cargando…</span>
        )}
      </div>

      {/* ── Resumen por peluquero ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {barbers.map((b) => (
          <div key={b.id} className="card px-4 py-3">
            <p className="text-xs text-muted">{b.nombre}</p>
            <p className="mt-1 font-serif text-2xl">{countByBarber(b.id)}</p>
            <p className="text-[0.65rem] text-muted">citas</p>
          </div>
        ))}
      </div>

      {/* ── Tabla de cuadrícula ── */}
      {slots.length === 0 ? (
        <p className="card p-12 text-center text-sm text-muted">
          Cerrado este día.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            {/* Cabecera: peluqueros */}
            <thead>
              <tr className="border-b border-line">
                <th className="w-20 px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted">
                  Hora
                </th>
                {barbers.map((b) => (
                  <th
                    key={b.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted"
                  >
                    {b.nombre}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Filas: slots */}
            <tbody>
              {slots.map((hora, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={hora}
                    className={cn(
                      "border-b border-line/50 last:border-0",
                      isEven ? "bg-transparent" : "bg-surface/30",
                    )}
                  >
                    {/* Columna de hora */}
                    <td className="px-4 py-3 font-serif text-base tabular-nums text-muted">
                      {hora}
                    </td>

                    {/* Columna de cada peluquero */}
                    {barbers.map((b) => {
                      const cita = citasHoy.find(
                        (c) =>
                          c.barber_id === b.id && hhmm(c.hora_inicio) === hora,
                      );
                      const bloqueo = bloqueosHoy.find(
                        (bl) =>
                          bl.barber_id === b.id &&
                          hhmm(bl.hora_inicio) === hora,
                      );

                      return (
                        <td key={b.id} className="px-3 py-2">
                          {bloqueo ? (
                            <div className="rounded-lg border border-line/60 bg-line/30 px-3 py-2 text-xs text-muted">
                              Bloqueado
                              {bloqueo.motivo && (
                                <span className="block opacity-60">
                                  {bloqueo.motivo}
                                </span>
                              )}
                            </div>
                          ) : cita ? (
                            <CitaCell
                              cita={cita}
                              onChanged={refresh}
                            />
                          ) : (
                            <div className="px-1 py-2 text-xs text-muted/30">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Celda de cita ──────────────────────────────────────── */
function CitaCell({
  cita,
  onChanged,
}: {
  cita: Cita;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const servicio = getService(cita.service)?.nombre ?? cita.service;
  const nombre = cita.profiles
    ? `${cita.profiles.nombre} ${cita.profiles.apellidos}`
    : "Cliente";

  function mark(estado: EstadoCita) {
    startTransition(async () => {
      const res = await setAppointmentStatus(cita.id, estado);
      if (res.ok) {
        toast.success("Estado actualizado");
        onChanged();
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="group relative">
      {/* Tarjeta compacta */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-left transition-all",
          ESTADO_STYLES[cita.estado],
          "hover:brightness-110",
        )}
      >
        <p className="truncate text-xs font-medium leading-tight">{nombre}</p>
        <p className="truncate text-[0.65rem] opacity-70">{servicio}</p>
        <span
          className={cn(
            "mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider",
            ESTADO_STYLES[cita.estado],
          )}
        >
          {ESTADO_LABEL[cita.estado]}
        </span>
      </button>

      {/* Panel de acciones expandido */}
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-xl border border-line bg-surface p-3 shadow-2xl">
          <p className="mb-1 text-sm font-medium">{nombre}</p>
          <p className="mb-1 text-xs text-muted">{servicio}</p>
          {cita.profiles?.telefono && (
            <a
              href={`tel:${cita.profiles.telefono}`}
              className="mb-3 block text-xs text-muted underline hover:text-text"
            >
              {cita.profiles.telefono}
            </a>
          )}

          {cita.estado === "pendiente" && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => mark("completada")}
                disabled={pending}
                className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
              >
                Marcar completada
              </button>
              <button
                onClick={() => mark("no_presentado")}
                disabled={pending}
                className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                No se presentó
              </button>
              <button
                onClick={() => mark("cancelada")}
                disabled={pending}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-text/40 hover:text-text disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-center text-[0.65rem] text-muted hover:text-text"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
