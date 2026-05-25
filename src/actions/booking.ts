"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getService,
  slotsForWeekday,
  isOpenDay,
  CANCEL_MIN_HOURS,
} from "@/lib/constants";
import { fromDateKey, madridNow, timeToMinutes, hhmm } from "@/lib/utils";
import { sendBookingConfirmation } from "@/lib/email";

export interface SlotInfo {
  hora: string; // HH:MM
  disponible: boolean;
}

/**
 * Devuelve los slots del día para un peluquero (o "sin preferencia" si
 * barberId es null), marcando cuáles están disponibles.
 */
export async function getAvailableSlots(
  barberId: string | null,
  fecha: string,
): Promise<SlotInfo[]> {
  const supabase = await createClient();

  const weekday = fromDateKey(fecha).getDay();
  if (!isOpenDay(weekday)) return [];

  const slots = slotsForWeekday(weekday);

  // Slots ocupados del día (citas activas + bloqueos), sin datos personales.
  const { data: taken } = await supabase.rpc("taken_slots", { p_fecha: fecha });
  const takenList = (taken ?? []) as { barber_id: string; hora_inicio: string }[];

  // Peluqueros activos (para "sin preferencia").
  const { data: barbers } = await supabase
    .from("barbers")
    .select("id")
    .eq("activo", true);
  const activeIds = (barbers ?? []).map((b) => b.id);

  const now = madridNow();
  const isToday = fecha === now.dateKey;

  return slots.map((hora) => {
    const slotMin = timeToMinutes(hora);
    const inPast = isToday && slotMin <= now.minutes;

    let disponible: boolean;
    if (barberId) {
      const ocupado = takenList.some(
        (t) => t.barber_id === barberId && hhmm(t.hora_inicio) === hora,
      );
      disponible = !ocupado && !inPast;
    } else {
      // Disponible si algún peluquero activo está libre en ese slot.
      const libreAlguno = activeIds.some(
        (id) =>
          !takenList.some(
            (t) => t.barber_id === id && hhmm(t.hora_inicio) === hora,
          ),
      );
      disponible = libreAlguno && !inPast;
    }

    return { hora, disponible };
  });
}

export type BookingResult =
  | { ok: true; codigo: string }
  | { ok: false; error: string };

export async function createBooking(input: {
  service: string;
  barberId: string | null;
  fecha: string;
  hora: string;
}): Promise<BookingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellidos, telefono")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Completa tu perfil primero." };

  // --- Validaciones de dominio ---
  const service = getService(input.service);
  if (!service) return { ok: false, error: "Servicio no válido." };

  const weekday = fromDateKey(input.fecha).getDay();
  const validSlots = slotsForWeekday(weekday);
  if (!validSlots.includes(input.hora)) {
    return { ok: false, error: "Ese horario no está disponible." };
  }

  const now = madridNow();
  if (
    input.fecha < now.dateKey ||
    (input.fecha === now.dateKey && timeToMinutes(input.hora) <= now.minutes)
  ) {
    return { ok: false, error: "No puedes reservar en el pasado." };
  }

  // --- Determinar peluquero ---
  const { data: taken } = await supabase.rpc("taken_slots", {
    p_fecha: input.fecha,
  });
  const takenList = (taken ?? []) as { barber_id: string; hora_inicio: string }[];
  const ocupadoPor = (id: string) =>
    takenList.some(
      (t) => t.barber_id === id && hhmm(t.hora_inicio) === input.hora,
    );

  let barberId = input.barberId;
  if (barberId) {
    if (ocupadoPor(barberId)) {
      return { ok: false, error: "Ese horario acaba de ocuparse." };
    }
  } else {
    const { data: barbers } = await supabase
      .from("barbers")
      .select("id, nombre")
      .eq("activo", true);
    const libre = (barbers ?? []).find((b) => !ocupadoPor(b.id));
    if (!libre) {
      return { ok: false, error: "No hay peluqueros libres a esa hora." };
    }
    barberId = libre.id;
  }

  // --- Insertar (el índice único evita la doble reserva de forma atómica) ---
  const { data: inserted, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      barber_id: barberId,
      service: service.id,
      fecha: input.fecha,
      hora_inicio: input.hora,
    })
    .select("codigo_reserva, barber_id")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") {
      return { ok: false, error: "Ese horario acaba de ocuparse." };
    }
    return { ok: false, error: "No se pudo crear la reserva." };
  }

  // --- Email de confirmación (best-effort) ---
  const { data: barber } = await supabase
    .from("barbers")
    .select("nombre")
    .eq("id", inserted.barber_id)
    .maybeSingle();

  if (user.email) {
    await sendBookingConfirmation({
      to: user.email,
      nombre: profile.nombre,
      service: service.id,
      barbero: barber?.nombre ?? "—",
      fecha: input.fecha,
      hora: input.hora,
      codigo: inserted.codigo_reserva,
    });
  }

  revalidatePath("/mis-reservas");
  return { ok: true, codigo: inserted.codigo_reserva };
}

export async function cancelBooking(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data: cita } = await supabase
    .from("appointments")
    .select("fecha, hora_inicio, estado, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!cita || cita.user_id !== user.id) {
    return { ok: false, error: "Reserva no encontrada." };
  }
  if (cita.estado === "cancelada") {
    return { ok: false, error: "La reserva ya está cancelada." };
  }

  // Regla: cancelar con al menos CANCEL_MIN_HOURS de antelación.
  const now = madridNow();
  const sameDay = cita.fecha === now.dateKey;
  const minutesUntil =
    cita.fecha < now.dateKey
      ? -1
      : sameDay
        ? timeToMinutes(hhmm(cita.hora_inicio)) - now.minutes
        : // días futuros: siempre cumple el margen
          CANCEL_MIN_HOURS * 60 + 1;

  if (minutesUntil < CANCEL_MIN_HOURS * 60) {
    return {
      ok: false,
      error: `Debes cancelar con al menos ${CANCEL_MIN_HOURS}h de antelación.`,
    };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ estado: "cancelada" })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo cancelar." };

  revalidatePath("/mis-reservas");
  return { ok: true };
}
