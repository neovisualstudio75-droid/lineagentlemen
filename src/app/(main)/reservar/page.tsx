import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";

export default async function ReservarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/reservar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/perfil?redirect=/reservar");

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, nombre, foto_url, activo")
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="mx-auto max-w-content px-6 py-12 sm:py-16">
      <BookingFlow barbers={barbers ?? []} />
    </main>
  );
}
