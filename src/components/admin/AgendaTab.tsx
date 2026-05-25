"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Barber, EstadoCita } from "@/lib/types";
import { getDayAppointments, setAppointmentStatus } from "@/actions/admin";
import { getService } from "@/lib/constants";
import {
  cn,
  fromDateKey,
  toDateKey,
  formatDateLong,
  hhmm,
} from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function AgendaTab({
  barbers,
  today,
}: {
  barbers: Barber[];
  today: string;
}) {
  const [fecha, setFecha] = useState(today);
  const [filtro, setFiltro] = useState<string>("all");
  const qc = useQueryClient();

  const { data: citas, isFetching } = useQuery({
    queryKey: ["admin-day", fecha],
    queryFn: () => getDayAppointments(fecha),
  });

  function shiftDay(delta: number) {
    const d = fromDateKey(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(toDateKey(d));
  }

  const visibles = (citas ?? []).filter(
    (c) => filtro === "all" || c.barber_id === filtro,
  );

  return (
    <div>
      {/* Navegación de día + filtro */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => shiftDay(-1)} className="btn-ghost px-2 py-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[12rem] text-center text-sm capitalize">
            {formatDateLong(fromDateKey(fecha))}
          </span>
          <button onClick={() => shiftDay(1)} className="btn-ghost px-2 py-2">
            <ChevronRight className="h-4 w-4" />
          </button>
          {fecha !== today && (
            <button
              onClick={() => setFecha(today)}
              className="text-xs text-muted hover:text-text"
            >
              Hoy
            </button>
          )}
        </div>

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input w-auto py-2"
        >
          <option value="all">Todos los peluqueros</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {isFetching ? (
        <p className="py-12 text-center text-sm text-muted">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="card p-12 text-center text-sm text-muted">
          No hay reservas para este día.
        </p>
      ) : (
        <div className="space-y-3">
          {visibles.map((c) => (
            <AppointmentRow
              key={c.id}
              cita={c}
              onChanged={() =>
                qc.invalidateQueries({ queryKey: ["admin-day", fecha] })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  cita,
  onChanged,
}: {
  cita: import("@/lib/types").AppointmentWithRelations;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function mark(estado: EstadoCita) {
    startTransition(async () => {
      const res = await setAppointmentStatus(cita.id, estado);
      if (res.ok) {
        toast.success("Estado actualizado");
        onChanged();
      } else {
        toast.error(res.error);
      }
    });
  }

  const servicio = getService(cita.service)?.nombre ?? cita.service;

  return (
    <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className="font-serif text-2xl tabular-nums">
        {hhmm(cita.hora_inicio)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {cita.profiles
            ? `${cita.profiles.nombre} ${cita.profiles.apellidos}`
            : "Cliente"}
        </p>
        <p className="text-sm text-muted">
          {servicio} · {cita.barbers?.nombre ?? "—"}
          {cita.profiles?.telefono && (
            <>
              {" · "}
              <a
                href={`tel:${cita.profiles.telefono}`}
                className="hover:text-text"
              >
                {cita.profiles.telefono}
              </a>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge estado={cita.estado} />
        {cita.estado === "pendiente" && (
          <div className="flex gap-1">
            <button
              onClick={() => mark("completada")}
              disabled={pending}
              className={cn(
                "border border-success/40 px-3 py-1.5 text-xs text-success transition-colors hover:bg-success/10 disabled:opacity-50",
              )}
            >
              Completada
            </button>
            <button
              onClick={() => mark("no_presentado")}
              disabled={pending}
              className="border border-danger/40 px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            >
              No vino
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
