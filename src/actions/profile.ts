"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveProfile(input: {
  nombre: string;
  apellidos: string;
  telefono: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sesión no válida." };

  const nombre = input.nombre.trim();
  const apellidos = input.apellidos.trim();
  const telefono = input.telefono.trim();

  if (!nombre || !apellidos) {
    return { ok: false, error: "Nombre y apellidos son obligatorios." };
  }
  // Teléfono español: 9 dígitos, opcional prefijo +34.
  const phoneOk = /^(\+34\s?)?[6-9]\d{8}$/.test(telefono.replace(/\s/g, ""));
  if (!phoneOk) {
    return { ok: false, error: "Introduce un teléfono español válido." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      nombre,
      apellidos,
      telefono,
      email: user.email ?? null,
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: "No se pudo guardar el perfil." };

  revalidatePath("/", "layout");
  return { ok: true };
}
