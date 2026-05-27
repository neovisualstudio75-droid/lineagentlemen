"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Barber, EstadoCita, AppointmentWithRelations } from "@/lib/types";
import {
  getMonthAppointments,
  setAppointmentStatus,
} from "@/actions/admin";
import { getService } from "@/lib/constants";
import {
  cn,
  fromDateKey,
  formatDateLong,
  hhmm,
} from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  ClockIcon,
} from "@/components/icons";
import { BarberAvatar } from "@/components/booking/BarberAvatar";
import { FacturacionTab } from "./FacturacionTab";

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

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

type Tab = "agenda" | "facturacion";

export function AdminDashboard({
  barbers,
  stats,
  today,
}: {
  barbers: Barber[];
  stats: { total: number; topBarber: string; topService: string };
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("agenda");
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  return (
    <div>
      {/* Stats globales */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reservas este mes" value={String(stats.total)} />
        <StatCard label="Peluquero top" value={stats.topBarber} />
        <StatCard label="Servicio top" value={stats.topService} />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-line print:hidden">
        {(
          [
            ["agenda", "Agenda"],
            ["facturacion", "Facturación"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setSelectedBarber(null);
            }}
            className={cn(
              "-mb-px border-b-2 px-5 py-3 text-sm transition-colors",
              tab === id
                ? "border-text text-text"
                : "border-transparent text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "agenda" &&
        (!selectedBarber ? (
          <BarberGrid barbers={barbers} onSelect={setSelectedBarber} today={today} />
        ) : (
          <BarberCalendar
            barber={selectedBarber}
            today={today}
            onBack={() => setSelectedBarber(null)}
          />
        ))}

      {tab === "facturacion" && (
        <FacturacionTab barbers={barbers} today={today} />
      )}
    </div>
  );
}

/* ─── Tarjetas de peluqueros ───────────────────────────── */
function BarberGrid({
  barbers,
  onSelect,
  today,
}: {
  barbers: Barber[];
  onSelect: (b: Barber) => void;
  today: string;
}) {
  // Trae las citas del mes en curso para mostrar contadores en cada tarjeta.
  const monthRange = useMemo(() => {
    const [y, m] = today.split("-");
    const first = `${y}-${m}-01`;
    const last = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;
    return { first, last };
  }, [today]);

  const { data: monthData } = useQuery({
    queryKey: ["admin-month", monthRange.first, monthRange.last],
    queryFn: () => getMonthAppointments(monthRange.first, monthRange.last),
  });

  const todayCount = (bid: string) =>
    (monthData ?? []).filter(
      (c) => c.barber_id === bid && c.fecha === today && c.estado !== "cancelada",
    ).length;

  const monthCount = (bid: string) =>
    (monthData ?? []).filter(
      (c) => c.barber_id === bid && c.estado !== "cancelada",
    ).length;

  return (
    <div>
      <h2 className="mb-6 text-xl font-medium">Elige peluquero</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((b) => {
          const todayN = todayCount(b.id);
          const monthN = monthCount(b.id);
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="card group relative flex flex-col items-center overflow-hidden p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-text/40 hover:bg-surface"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-radial-fade opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

              <BarberAvatar
                nombre={b.nombre}
                fotoUrl={b.foto_url}
                size={80}
              />
              <h3 className="relative mt-5 text-xl font-bold">{b.nombre}</h3>

              <div className="relative mt-6 grid w-full grid-cols-2 gap-2 border-t border-line pt-5">
                <div>
                  <p className="font-serif text-2xl leading-none">{todayN}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted">
                    Hoy
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl leading-none">{monthN}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted">
                    Este mes
                  </p>
                </div>
              </div>

              <span className="relative mt-6 text-xs uppercase tracking-widest text-muted transition-colors group-hover:text-text">
                Ver agenda →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Calendario del peluquero ─────────────────────────── */
function BarberCalendar({
  barber,
  today,
  onBack,
}: {
  barber: Barber;
  today: string;
  onBack: () => void;
}) {
  const [year, month] = today.split("-").map(Number);
  const [cursor, setCursor] = useState({ year, month }); // 1-12
  const [selectedDay, setSelectedDay] = useState<string | null>(today);

  // Rango de fechas a consultar (mes completo)
  const firstDay = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-01`;
  const lastDate = new Date(cursor.year, cursor.month, 0).getDate();
  const lastDay = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;

  const qc = useQueryClient();
  const { data: monthData, isFetching } = useQuery({
    queryKey: ["admin-cal", barber.id, firstDay, lastDay],
    queryFn: () => getMonthAppointments(firstDay, lastDay),
  });

  // Filtra solo este peluquero
  const citasBarber = (monthData ?? []).filter((c) => c.barber_id === barber.id);

  // Mapea día → cantidad de citas activas
  const countByDay = new Map<string, number>();
  for (const c of citasBarber) {
    if (c.estado === "cancelada") continue;
    countByDay.set(c.fecha, (countByDay.get(c.fecha) ?? 0) + 1);
  }

  function shiftMonth(delta: number) {
    setCursor((c) => {
      let m = c.month + delta;
      let y = c.year;
      if (m < 1) {
        m = 12;
        y--;
      } else if (m > 12) {
        m = 1;
        y++;
      }
      return { year: y, month: m };
    });
    setSelectedDay(null);
  }

  // Genera las celdas del calendario (incluyendo huecos para alinear con lunes)
  const firstWeekday = new Date(cursor.year, cursor.month - 1, 1).getDay();
  // weekday 0=Dom; queremos lunes=0
  const offset = (firstWeekday + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(
      `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }

  const monthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(cursor.year, cursor.month - 1, 1));

  const citasDelDia = selectedDay
    ? citasBarber.filter((c) => c.fecha === selectedDay)
    : [];

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Todos los peluqueros
        </button>

        <div className="flex items-center gap-3">
          <BarberAvatar nombre={barber.nombre} fotoUrl={barber.foto_url} size={48} />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Agenda de</p>
            <p className="text-xl font-bold">{barber.nombre}</p>
          </div>
        </div>

        <div className="hidden sm:block" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Calendario */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center border border-line transition-colors hover:border-text/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-medium capitalize">{monthName}</h3>
            <button
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center border border-line transition-colors hover:border-text/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[0.65rem] uppercase tracking-widest text-muted">
            {DIAS_SEMANA.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((dateKey, i) =>
              dateKey === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <DayCell
                  key={dateKey}
                  dateKey={dateKey}
                  count={countByDay.get(dateKey) ?? 0}
                  isToday={dateKey === today}
                  isSelected={dateKey === selectedDay}
                  onClick={() => setSelectedDay(dateKey)}
                />
              ),
            )}
          </div>

          {isFetching && (
            <p className="mt-4 text-center text-xs text-muted">Cargando…</p>
          )}
        </div>

        {/* Citas del día seleccionado */}
        <div>
          {!selectedDay ? (
            <p className="card p-12 text-center text-sm text-muted">
              Selecciona un día del calendario.
            </p>
          ) : (
            <DayDetail
              fecha={selectedDay}
              citas={citasDelDia}
              onChanged={() =>
                qc.invalidateQueries({
                  queryKey: ["admin-cal", barber.id, firstDay, lastDay],
                })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Celda de día ─────────────────────────────────────── */
function DayCell({
  dateKey,
  count,
  isToday,
  isSelected,
  onClick,
}: {
  dateKey: string;
  count: number;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const day = Number(dateKey.split("-")[2]);
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all duration-200 active:scale-[0.97]",
        isSelected
          ? "border-text bg-text text-bg shadow-[0_0_0_3px_rgba(250,250,247,0.08)]"
          : isToday
            ? "border-text/60 text-text"
            : count > 0
              ? "border-line bg-surface/50 text-text hover:border-text/40"
              : "border-line/40 text-muted hover:border-text/40",
      )}
    >
      <span className="font-medium">{day}</span>
      {count > 0 && (
        <span
          className={cn(
            "mt-0.5 text-[0.55rem] font-medium",
            isSelected ? "text-bg/70" : "text-amber-400",
          )}
        >
          {count} {count === 1 ? "cita" : "citas"}
        </span>
      )}
    </button>
  );
}

/* ─── Detalle del día ──────────────────────────────────── */
function DayDetail({
  fecha,
  citas,
  onChanged,
}: {
  fecha: string;
  citas: AppointmentWithRelations[];
  onChanged: () => void;
}) {
  const ordenadas = [...citas].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio),
  );

  const activas = ordenadas.filter((c) => c.estado !== "cancelada").length;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between border-b border-line pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            <CalendarIcon className="mr-1 inline h-3 w-3" /> Día
          </p>
          <p className="mt-1 text-xl font-medium capitalize">
            {formatDateLong(fromDateKey(fecha))}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl leading-none">{activas}</p>
          <p className="text-[0.65rem] uppercase tracking-widest text-muted">
            Citas activas
          </p>
        </div>
      </div>

      {ordenadas.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">
          Sin citas este día.
        </p>
      ) : (
        <div className="space-y-3">
          {ordenadas.map((c) => (
            <CitaCard key={c.id} cita={c} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tarjeta de cita ──────────────────────────────────── */
function CitaCard({
  cita,
  onChanged,
}: {
  cita: AppointmentWithRelations;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const servicio = getService(cita.service)?.nombre ?? cita.service;
  const nombre = cita.profiles?.nombre ?? "";
  const apellidos = cita.profiles?.apellidos ?? "";
  const telefono = cita.profiles?.telefono ?? "";

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

  return (
    <div
      className={cn(
        "card overflow-hidden p-0",
        cita.estado === "cancelada" && "opacity-50",
      )}
    >
      <div className="flex flex-col gap-4 border-b border-line/50 p-5 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line">
          <ClockIcon className="h-3 w-3 text-muted" />
          <span className="font-serif text-base leading-none">
            {hhmm(cita.hora_inicio)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">
            {(nombre + " " + apellidos).trim() || "Cliente"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{servicio}</p>

          <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3 sm:gap-x-4">
            <div>
              <dt className="text-[0.6rem] uppercase tracking-widest text-muted">
                Nombre
              </dt>
              <dd className="truncate text-text">{nombre || "—"}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-widest text-muted">
                Apellidos
              </dt>
              <dd className="truncate text-text">{apellidos || "—"}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-widest text-muted">
                Teléfono
              </dt>
              <dd className="truncate">
                {telefono ? (
                  <a
                    href={`tel:${telefono}`}
                    className="tabular-nums text-text underline underline-offset-2 hover:opacity-70"
                  >
                    {telefono}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
        <span
          className={cn(
            "shrink-0 self-start rounded-full border px-2 py-1 text-[0.6rem] uppercase tracking-wider",
            ESTADO_STYLES[cita.estado],
          )}
        >
          {ESTADO_LABEL[cita.estado]}
        </span>
      </div>

      {cita.estado === "pendiente" && (
        <div className="flex divide-x divide-line">
          <button
            onClick={() => mark("completada")}
            disabled={pending}
            className="flex-1 px-3 py-2.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
          >
            Marcar completada
          </button>
          <button
            onClick={() => mark("no_presentado")}
            disabled={pending}
            className="flex-1 px-3 py-2.5 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            No vino
          </button>
          <button
            onClick={() => mark("cancelada")}
            disabled={pending}
            className="flex-1 px-3 py-2.5 text-xs text-muted transition-colors hover:bg-line/30 hover:text-text disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-6">
      <p className="label mb-2">{label}</p>
      <p className="font-serif text-3xl">{value}</p>
    </div>
  );
}
