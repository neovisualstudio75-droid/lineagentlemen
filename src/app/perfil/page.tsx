import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirectTo = searchParams.redirect;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Prefill desde perfil existente, metadatos de registro por email o Google OAuth.
  const meta = user.user_metadata ?? {};
  const initial = {
    nombre:
      profile?.nombre ??
      (meta.nombre as string) ??
      (meta.given_name as string) ??
      "",
    apellidos:
      profile?.apellidos ??
      (meta.apellidos as string) ??
      (meta.family_name as string) ??
      "",
    telefono: profile?.telefono ?? (meta.telefono as string) ?? "",
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="animate-fade-in">
        <h1 className="mb-2 text-3xl font-medium">
          {profile ? "Tu perfil" : "Completa tu perfil"}
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-muted">
          {profile
            ? "Mantén tus datos actualizados."
            : "Necesitamos estos datos para gestionar tus reservas."}
        </p>
        <ProfileForm initial={initial} redirectTo={redirectTo ?? "/reservar"} />
      </div>
    </main>
  );
}
