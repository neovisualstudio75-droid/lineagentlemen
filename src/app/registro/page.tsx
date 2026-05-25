"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, CheckIcon } from "@/components/icons";

function RegistroInner() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/reservar";
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!/^(\+34\s?)?[6-9]\d{8}$/.test(form.telefono.trim())) {
      setError("Introduce un número de teléfono español válido (ej. 600 123 456).");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim(),
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("Ya existe una cuenta con ese email. Inicia sesión.");
      } else if (msg.includes("password")) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Error al crear la cuenta. Inténtalo de nuevo.");
      }
      setLoading(false);
      return;
    }

    // Si la confirmación de email está desactivada en Supabase,
    // el usuario ya tiene sesión activa → creamos perfil y redirigimos.
    if (data.session && data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim(),
        rol: "cliente",
      });
      router.push(redirect);
      router.refresh();
      return;
    }

    // Confirmación de email activada → pedimos que revisen el correo.
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <AuthShell>
        <Logo className="mx-auto mb-10 h-10 lg:hidden" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-success/40 bg-success/10 text-success">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-4xl font-bold">Revisa tu email</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hemos enviado un enlace de confirmación a{" "}
          <span className="text-text">{form.email}</span>. Haz clic en él para
          activar tu cuenta y empezar a reservar.
        </p>
        <Link href="/login" className="btn-secondary mt-10 w-full">
          Volver al inicio de sesión
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Logo className="mx-auto mb-10 h-10 lg:hidden" />

      <p className="eyebrow">Únete a Línea Gentlemen</p>
      <h1 className="mt-3 text-4xl font-bold">Crear cuenta</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Rellena tus datos para reservar tu cita.
      </p>

      {error && (
        <p className="mt-8 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={signUp} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
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
              autoComplete="given-name"
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
              placeholder="García"
              required
              autoComplete="family-name"
            />
          </div>
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
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary group w-full"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
          {!loading && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-text underline underline-offset-4 transition-colors hover:text-muted"
        >
          Inicia sesión
        </Link>
      </p>

      <p className="mt-6 text-xs leading-relaxed text-muted/60">
        Al registrarte aceptas que guardemos tus datos de contacto para
        gestionar tus reservas.
      </p>
    </AuthShell>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroInner />
    </Suspense>
  );
}
