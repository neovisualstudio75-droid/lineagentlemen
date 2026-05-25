import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { madridNow, timeToMinutes, hhmm } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/types";
import { ReservationCard } from "@/components/ReservationCard";

export const dynamic = "force-dynamic";

export default async function MisReservasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/mis-reservas");

  const { data } = await supabase
    .from("appointments")
    .select("*, barbers(id, nombre, foto_url)")
    .eq("user_id", user.id)
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false });

  const citas = (data ?? []) as AppointmentWithRelations[];
  const now = madridNow();

  const esFutura = (c: AppointmentWithRelations) =>
    c.estado === "pendiente" &&
    (c.fecha > now.dateKey ||
      (c.fecha === now.dateKey &&
        timeToMinutes(hhmm(c.hora_inicio)) > now.minutes));

  const proximas = citas
    .filter(esFutura)
    .sort((a, b) =>
      a.fecha === b.fecha
        ? a.hora_inicio.localeCompare(b.hora_inicio)
        : a.fecha.localeCompare(b.fecha),
    );
  const pasadas = citas.filter((c) => !esFutura(c));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-12 flex items-end justify-between">
        <h1 className="text-3xl font-medium sm:text-4xl">Mis reservas</h1>
        <Link href="/reservar" className="btn-secondary px-4 py-2 text-xs">
          Nueva cita
        </Link>
      </div>

      {citas.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="mb-6 text-muted">Aún no tienes ninguna reserva.</p>
          <Link href="/reservar" className="btn-primary">
            Reservar mi primera cita
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {proximas.length > 0 && (
            <section>
              <h2 className="label mb-4">Próximas</h2>
              <div className="space-y-3">
                {proximas.map((c) => (
                  <ReservationCard key={c.id} cita={c} cancelable />
                ))}
              </div>
            </section>
          )}

          {pasadas.length > 0 && (
            <section>
              <h2 className="label mb-4">Historial</h2>
              <div className="space-y-3">
                {pasadas.map((c) => (
                  <ReservationCard key={c.id} cita={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
