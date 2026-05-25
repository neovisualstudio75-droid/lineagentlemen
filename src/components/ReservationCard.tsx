"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AppointmentWithRelations } from "@/lib/types";
import { getService } from "@/lib/constants";
import { formatDateLong, fromDateKey, hhmm } from "@/lib/utils";
import { cancelBooking } from "@/actions/booking";
import { StatusBadge } from "./StatusBadge";
import { BarberAvatar } from "./booking/BarberAvatar";

export function ReservationCard({
  cita,
  cancelable = false,
}: {
  cita: AppointmentWithRelations;
  cancelable?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function cancel() {
    startTransition(async () => {
      const res = await cancelBooking(cita.id);
      if (res.ok) {
        toast.success("Reserva cancelada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setConfirming(false);
    });
  }

  const servicio = getService(cita.service)?.nombre ?? cita.service;

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <BarberAvatar
          nombre={cita.barbers?.nombre ?? "?"}
          fotoUrl={cita.barbers?.foto_url}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="font-medium">{servicio}</h3>
            <StatusBadge estado={cita.estado} />
          </div>
          <p className="text-sm capitalize text-muted">
            {formatDateLong(fromDateKey(cita.fecha))} · {hhmm(cita.hora_inicio)}
          </p>
          <p className="text-sm text-muted">
            con {cita.barbers?.nombre ?? "—"}
          </p>

          {cancelable && (
            <div className="mt-4">
              {confirming ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted">¿Cancelar la cita?</span>
                  <button
                    onClick={cancel}
                    disabled={pending}
                    className="text-danger hover:underline disabled:opacity-50"
                  >
                    {pending ? "Cancelando…" : "Sí, cancelar"}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-muted hover:text-text"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="text-sm text-muted transition-colors hover:text-danger"
                >
                  Cancelar cita
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
