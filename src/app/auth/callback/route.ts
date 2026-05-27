import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/reservar";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ¿Tiene perfil completo? Si no, va a completarlo.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) {
          // Intenta crear el perfil a partir de los metadatos guardados en el registro.
          const meta = user.user_metadata ?? {};
          if (meta.nombre && meta.apellidos && meta.telefono) {
            await supabase.from("profiles").upsert({
              user_id: user.id,
              nombre: meta.nombre as string,
              apellidos: meta.apellidos as string,
              telefono: meta.telefono as string,
              email: user.email ?? null,
              rol: "cliente",
            });
          } else {
            // Sin metadatos (flujo OAuth u otro): pedir datos manualmente.
            return NextResponse.redirect(
              `${origin}/perfil?redirect=${encodeURIComponent(redirect)}`,
            );
          }
        }
      }
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
