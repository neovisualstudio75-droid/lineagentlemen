import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { madridNow } from "@/lib/utils";
import { getService } from "@/lib/constants";
import type { Barber } from "@/lib/types";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.rol !== "admin") redirect("/");

  const { data: barbersData } = await supabase
    .from("barbers")
    .select("*")
    .order("nombre");
  const barbers = (barbersData ?? []) as Barber[];

  // --- Estadísticas del mes en curso ---
  const now = madridNow();
  const [y, m] = now.dateKey.split("-");
  const first = `${y}-${m}-01`;
  const lastDay = new Date(Number(y), Number(m), 0).getDate();
  const last = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

  const { data: monthData } = await supabase
    .from("appointments")
    .select("barber_id, service, estado")
    .gte("fecha", first)
    .lte("fecha", last)
    .neq("estado", "cancelada");

  const month = monthData ?? [];
  const countBy = (key: "barber_id" | "service") => {
    const map = new Map<string, number>();
    for (const r of month) map.set(r[key], (map.get(r[key]) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
  };
  const topBarberEntry = countBy("barber_id");
  const topServiceEntry = countBy("service");

  const stats = {
    total: month.length,
    topBarber: topBarberEntry
      ? (barbers.find((b) => b.id === topBarberEntry[0])?.nombre ?? "—")
      : "—",
    topService: topServiceEntry
      ? (getService(topServiceEntry[0])?.nombre ?? "—")
      : "—",
  };

  return (
    <main className="mx-auto max-w-content px-6 py-12">
      <h1 className="mb-10 text-3xl font-medium sm:text-4xl">
        Panel de administración
      </h1>
      <AdminDashboard
        barbers={barbers}
        stats={stats}
        today={now.dateKey}
      />
    </main>
  );
}
