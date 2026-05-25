"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentWithRelations, EstadoCita, BlockedSlot } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };

  const { data } = await supabase
    .from("profiles")
    .select("rol")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, ok: data?.rol === "admin" };
}

export async function getDayAppointments(
  fecha: string,
): Promise<AppointmentWithRelations[]> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return [];

  const { data } = await supabase
    .from("appointments")
    .select(
      "*, barbers(id, nombre, foto_url), profiles(nombre, apellidos, telefono)",
    )
    .eq("fecha", fecha)
    .order("hora_inicio");

  return (data ?? []) as AppointmentWithRelations[];
}

export async function setAppointmentStatus(
  id: string,
  estado: EstadoCita,
): Promise<Result> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  const { error } = await supabase
    .from("appointments")
    .update({ estado })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar." };
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Peluqueros ----------

export async function createBarber(nombre: string): Promise<Result> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };
  if (!nombre.trim()) return { ok: false, error: "Nombre obligatorio." };

  const { error } = await supabase
    .from("barbers")
    .insert({ nombre: nombre.trim(), activo: true });
  if (error) return { ok: false, error: "No se pudo crear." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateBarber(
  id: string,
  patch: { nombre?: string; foto_url?: string | null; activo?: boolean },
): Promise<Result> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  const { error } = await supabase.from("barbers").update(patch).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar." };
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Bloqueos ----------

export async function getBlocks(desde: string): Promise<BlockedSlot[]> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return [];

  const { data } = await supabase
    .from("blocked_slots")
    .select("*")
    .gte("fecha", desde)
    .order("fecha")
    .order("hora_inicio");

  return (data ?? []) as BlockedSlot[];
}

export async function blockSlot(input: {
  barberId: string;
  fecha: string;
  hora: string;
  motivo: string;
}): Promise<Result> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  // No bloquear si ya hay una cita activa en ese hueco.
  const { data: cita } = await supabase
    .from("appointments")
    .select("id")
    .eq("barber_id", input.barberId)
    .eq("fecha", input.fecha)
    .eq("hora_inicio", input.hora)
    .neq("estado", "cancelada")
    .maybeSingle();
  if (cita) {
    return { ok: false, error: "Ya hay una cita en ese hueco." };
  }

  const { error } = await supabase.from("blocked_slots").insert({
    barber_id: input.barberId,
    fecha: input.fecha,
    hora_inicio: input.hora,
    motivo: input.motivo.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya está bloqueado." };
    return { ok: false, error: "No se pudo bloquear." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function unblockSlot(id: string): Promise<Result> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo desbloquear." };
  revalidatePath("/admin");
  return { ok: true };
}
