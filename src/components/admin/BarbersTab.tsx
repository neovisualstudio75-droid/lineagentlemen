"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Barber } from "@/lib/types";
import { createBarber, updateBarber } from "@/actions/admin";
import { BarberAvatar } from "@/components/booking/BarberAvatar";

export function BarbersTab({ barbers }: { barbers: Barber[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!nuevo.trim()) return;
    startTransition(async () => {
      const res = await createBarber(nuevo);
      if (res.ok) {
        toast.success("Peluquero añadido");
        setNuevo("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {barbers.map((b) => (
          <BarberRow key={b.id} barber={b} onChanged={() => router.refresh()} />
        ))}
      </div>

      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="Nombre del nuevo peluquero"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} disabled={pending} className="btn-primary">
          Añadir
        </button>
      </div>
    </div>
  );
}

function BarberRow({
  barber,
  onChanged,
}: {
  barber: Barber;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(barber.nombre);
  const [foto, setFoto] = useState(barber.foto_url ?? "");

  function save() {
    startTransition(async () => {
      const res = await updateBarber(barber.id, {
        nombre: nombre.trim(),
        foto_url: foto.trim() || null,
      });
      if (res.ok) {
        toast.success("Actualizado");
        setEditing(false);
        onChanged();
      } else toast.error(res.error);
    });
  }

  function toggle() {
    startTransition(async () => {
      const res = await updateBarber(barber.id, { activo: !barber.activo });
      if (res.ok) onChanged();
      else toast.error(res.error);
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <BarberAvatar
          nombre={barber.nombre}
          fotoUrl={barber.foto_url}
          size={48}
        />
        <div className="flex-1">
          <p className="font-medium">{barber.nombre}</p>
          <p className="text-xs text-muted">
            {barber.activo ? "Activo" : "Inactivo"}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          className="btn-ghost"
        >
          {barber.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className="btn-ghost"
        >
          {editing ? "Cerrar" : "Editar"}
        </button>
      </div>

      {editing && (
        <div className="mt-5 space-y-3 border-t border-line pt-5">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="label">URL de la foto</label>
            <input
              className="input"
              placeholder="https://…"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
            />
          </div>
          <button onClick={save} disabled={pending} className="btn-primary">
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}
