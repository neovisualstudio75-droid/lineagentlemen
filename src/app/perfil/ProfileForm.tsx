"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProfile } from "@/actions/profile";

export function ProfileForm({
  initial,
  redirectTo,
}: {
  initial: { nombre: string; apellidos: string; telefono: string };
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveProfile(form);
      if (res.ok) {
        toast.success("Perfil guardado");
        router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="label" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          className="input"
          value={form.nombre}
          onChange={update("nombre")}
          placeholder="Juan"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="apellidos">
          Apellidos
        </label>
        <input
          id="apellidos"
          className="input"
          value={form.apellidos}
          onChange={update("apellidos")}
          placeholder="García López"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="telefono">
          Teléfono
        </label>
        <input
          id="telefono"
          className="input"
          type="tel"
          value={form.telefono}
          onChange={update("telefono")}
          placeholder="600 123 456"
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar y continuar"}
      </button>
    </form>
  );
}
