"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SERVICES, type ServiceId, isOpenDay } from "@/lib/constants";
import { getAvailableSlots, createBooking } from "@/actions/booking";
import { cn, toDateKey, fromDateKey, formatDateLong } from "@/lib/utils";
import { BarberAvatar } from "./BarberAvatar";
import {
  ScissorsIcon,
  RazorIcon,
  CheckIcon,
  ChevronLeft,
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from "@/components/icons";

type Barber = {
  id: string;
  nombre: string;
  foto_url: string | null;
  activo: boolean;
};

const STEPS = ["Servicio", "Peluquero", "Fecha y hora", "Confirmar"];
const ANY = "any";

export function BookingFlow({ barbers }: { barbers: Barber[] }) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceId | null>(null);
  const [barberChoice, setBarberChoice] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const barberId = barberChoice === ANY ? null : barberChoice;

  const upcomingDays = useMemo(() => {
    const days: string[] = [];
    const cursor = new Date();
    for (let i = 0; days.length < 18 && i < 40; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + i);
      if (isOpenDay(d.getDay())) days.push(toDateKey(d));
    }
    return days;
  }, []);

  const { data: slots, isFetching } = useQuery({
    queryKey: ["slots", barberChoice, fecha],
    queryFn: () => getAvailableSlots(barberId, fecha!),
    enabled: step === 2 && !!fecha,
  });

  const selectedBarber = barbers.find((b) => b.id === barberChoice);

  function reset() {
    setStep(0);
    setService(null);
    setBarberChoice(null);
    setFecha(null);
    setHora(null);
    setCodigo(null);
  }

  function confirm() {
    if (!service || !fecha || !hora) return;
    startTransition(async () => {
      const res = await createBooking({ service, barberId, fecha, hora });
      if (res.ok) {
        setCodigo(res.codigo);
      } else {
        toast.error(res.error);
        if (res.error.includes("ocup")) {
          setHora(null);
          setStep(2);
        }
      }
    });
  }

  // ---------- Pantalla de éxito ----------
  if (codigo) {
    return (
      <div className="mx-auto max-w-md animate-fade-in py-12 text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-success/40">
          <CheckIcon className="h-8 w-8 text-success" />
        </div>
        <h1 className="mb-3 text-3xl font-medium">Cita confirmada</h1>
        <p className="mb-8 text-sm text-muted">
          Te hemos enviado un email con los detalles.
        </p>
        <div className="card mb-2 p-6">
          <p className="label mb-1">Código de reserva</p>
          <p className="font-serif text-4xl tracking-[0.2em]">
            {codigo.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/mis-reservas" className="btn-primary">
            Ver mis reservas
          </Link>
          <button onClick={reset} className="btn-secondary">
            Reservar otra cita
          </button>
        </div>
      </div>
    );
  }

  const canContinue =
    (step === 0 && service) ||
    (step === 1 && barberChoice) ||
    (step === 2 && fecha && hora);

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} />

      <div className="mt-10 animate-fade-in" key={step}>
        {/* PASO 1 — SERVICIO */}
        {step === 0 && (
          <Section title="Elige el servicio">
            <div className="grid gap-4 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setService(s.id)}
                  className={cn(
                    "card flex flex-col p-6 text-left transition-colors",
                    service === s.id
                      ? "border-text"
                      : "hover:border-text/40",
                  )}
                >
                  <div className="mb-4 text-text/80">
                    {s.id === "corte" ? (
                      <ScissorsIcon className="h-7 w-7" />
                    ) : (
                      <RazorIcon className="h-7 w-7" />
                    )}
                  </div>
                  <h3 className="mb-1 text-xl font-medium">{s.nombre}</h3>
                  <p className="mb-6 flex-1 text-sm text-muted">
                    {s.descripcion}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <ClockIcon className="h-3.5 w-3.5" /> {s.duracion} min
                    </span>
                    <span className="font-serif text-3xl leading-none">
                      {s.precio}
                      <span className="ml-0.5 text-lg text-muted">€</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* PASO 2 — PELUQUERO */}
        {step === 1 && (
          <Section title="Elige el peluquero">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <BarberOption
                selected={barberChoice === ANY}
                onClick={() => setBarberChoice(ANY)}
                label="Sin preferencia"
                icon
              />
              {barbers.map((b) => (
                <BarberOption
                  key={b.id}
                  selected={barberChoice === b.id}
                  onClick={() => setBarberChoice(b.id)}
                  label={b.nombre}
                  fotoUrl={b.foto_url}
                />
              ))}
            </div>
          </Section>
        )}

        {/* PASO 3 — FECHA Y HORA */}
        {step === 2 && (
          <Section title="Elige fecha y hora">
            <p className="label">Fecha</p>
            <div className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {upcomingDays.map((key) => {
                const d = fromDateKey(key);
                const active = fecha === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setFecha(key);
                      setHora(null);
                    }}
                    className={cn(
                      "flex flex-col items-center border py-3 transition-colors",
                      active
                        ? "border-text bg-text text-bg"
                        : "border-line text-text hover:border-text/40",
                    )}
                  >
                    <span className="text-[0.65rem] uppercase tracking-wider opacity-70">
                      {new Intl.DateTimeFormat("es-ES", {
                        weekday: "short",
                      }).format(d)}
                    </span>
                    <span className="text-lg font-medium leading-tight">
                      {d.getDate()}
                    </span>
                    <span className="text-[0.65rem] opacity-70">
                      {new Intl.DateTimeFormat("es-ES", {
                        month: "short",
                      }).format(d)}
                    </span>
                  </button>
                );
              })}
            </div>

            {fecha && (
              <>
                <p className="label">Hora</p>
                {isFetching ? (
                  <p className="py-6 text-sm text-muted">
                    Buscando disponibilidad…
                  </p>
                ) : slots && slots.some((s) => s.disponible) ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.hora}
                        disabled={!s.disponible}
                        onClick={() => setHora(s.hora)}
                        className={cn(
                          "border py-3 text-sm transition-colors",
                          hora === s.hora
                            ? "border-text bg-text text-bg"
                            : s.disponible
                              ? "border-line text-text hover:border-text/40"
                              : "cursor-not-allowed border-line/50 text-muted/30 line-through",
                        )}
                      >
                        {s.hora}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-sm text-muted">
                    No quedan huecos libres ese día. Prueba con otra fecha.
                  </p>
                )}
              </>
            )}
          </Section>
        )}

        {/* PASO 4 — CONFIRMAR */}
        {step === 3 && service && fecha && hora && (
          <Section title="Confirma tu cita">
            <div className="card divide-y divide-line">
              <SummaryRow
                icon={<ScissorsIcon className="h-5 w-5" />}
                label="Servicio"
                value={SERVICES.find((s) => s.id === service)!.nombre}
              />
              <SummaryRow
                icon={<UserIcon className="h-5 w-5" />}
                label="Peluquero"
                value={
                  barberChoice === ANY
                    ? "Sin preferencia"
                    : (selectedBarber?.nombre ?? "—")
                }
              />
              <SummaryRow
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Fecha"
                value={
                  <span className="capitalize">
                    {formatDateLong(fromDateKey(fecha))}
                  </span>
                }
              />
              <SummaryRow
                icon={<ClockIcon className="h-5 w-5" />}
                label="Hora"
                value={hora}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface/50 px-6 py-5">
              <span className="text-sm uppercase tracking-[0.16em] text-muted">
                Total
              </span>
              <span className="font-serif text-4xl leading-none">
                {SERVICES.find((s) => s.id === service)!.precio}
                <span className="ml-0.5 text-xl text-muted">€</span>
              </span>
            </div>

            <button
              onClick={confirm}
              disabled={pending}
              className="btn-primary mt-8 w-full"
            >
              {pending ? "Confirmando…" : "Confirmar reserva"}
            </button>
          </Section>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <div className="mt-10 flex items-center justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
        ) : (
          <span />
        )}

        {step < 3 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="btn-primary"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors",
              i < step
                ? "border-text bg-text text-bg"
                : i === step
                  ? "border-text text-text"
                  : "border-line text-muted",
            )}
          >
            {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={cn(
              "hidden text-center text-[0.7rem] uppercase tracking-wider sm:block",
              i === step ? "text-text" : "text-muted",
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-medium">{title}</h2>
      {children}
    </div>
  );
}

function BarberOption({
  selected,
  onClick,
  label,
  fotoUrl,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  fotoUrl?: string | null;
  icon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card flex flex-col items-center gap-3 p-5 transition-colors",
        selected ? "border-text" : "hover:border-text/40",
      )}
    >
      {icon ? (
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-line text-muted">
          <UserIcon className="h-7 w-7" />
        </span>
      ) : (
        <BarberAvatar nombre={label} fotoUrl={fotoUrl} size={64} />
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
