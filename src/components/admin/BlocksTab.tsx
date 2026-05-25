"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Barber } from "@/lib/types";
import { getBlocks, blockSlot, unblockSlot } from "@/actions/admin";
import { slotsForWeekday } from "@/lib/constants";
import { fromDateKey, formatDateLong, hhmm } from "@/lib/utils";
import { XIcon } from "@/components/icons";

export function BlocksTab({
  barbers,
  today,
}: {
  barbers: Barber[];
  today: string;
}) {
  const qc = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "");
  const [fecha, setFecha] = useState(today);
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");

  const { data: blocks } = useQuery({
    queryKey: ["admin-blocks", today],
    queryFn: () => getBlocks(today),
  });

  const horasDelDia = useMemo(() => {
    if (!fecha) return [];
    return slotsForWeekday(fromDateKey(fecha).getDay());
  }, [fecha]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-blocks", today] });
  }

  function add() {
    if (!barberId || !fecha || !hora) {
      toast.error("Completa peluquero, fecha y hora.");
      return;
    }
    startTransition(async () => {
      const res = await blockSlot({ barberId, fecha, hora, motivo });
      if (res.ok) {
        toast.success("Hueco bloqueado");
        setHora("");
        setMotivo("");
        refresh();
      } else toast.error(res.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await unblockSlot(id);
      if (res.ok) {
        toast.success("Desbloqueado");
        refresh();
      } else toast.error(res.error);
    });
  }

  const barberName = (id: string) =>
    barbers.find((b) => b.id === id)?.nombre ?? "—";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Formulario */}
      <div className="card space-y-4 p-6">
        <h3 className="text-lg font-medium">Bloquear un hueco</h3>
        <p className="text-sm text-muted">
          Vacaciones, ausencias o descansos puntuales.
        </p>

        <div>
          <label className="label">Peluquero</label>
          <select
            className="input"
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            className="input"
            value={fecha}
            min={today}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora("");
            }}
          />
        </div>

        <div>
          <label className="label">Hora</label>
          {horasDelDia.length === 0 ? (
            <p className="text-sm text-muted">Día cerrado, elige otra fecha.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {horasDelDia.map((h) => (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  className={
                    "border py-2 text-sm transition-colors " +
                    (hora === h
                      ? "border-text bg-text text-bg"
                      : "border-line hover:border-text/40")
                  }
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Motivo (opcional)</label>
          <input
            className="input"
            placeholder="Vacaciones, médico…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <button onClick={add} disabled={pending} className="btn-primary w-full">
          Bloquear hueco
        </button>
      </div>

      {/* Listado */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Próximos bloqueos</h3>
        {!blocks || blocks.length === 0 ? (
          <p className="card p-8 text-center text-sm text-muted">
            No hay bloqueos programados.
          </p>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="card flex items-center gap-4 p-4 text-sm"
              >
                <div className="flex-1">
                  <p className="capitalize">
                    {formatDateLong(fromDateKey(b.fecha))} · {hhmm(b.hora_inicio)}
                  </p>
                  <p className="text-muted">
                    {barberName(b.barber_id)}
                    {b.motivo ? ` — ${b.motivo}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  disabled={pending}
                  className="text-muted transition-colors hover:text-danger"
                  aria-label="Desbloquear"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
