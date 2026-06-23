"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, CheckIcon } from "@/components/icons";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });

    setLoading(false);
    if (error) {
      setError("No se pudo enviar el email. Comprueba la dirección.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
      <Logo className="mx-auto mb-10 h-10 lg:hidden" />

      <p className="eyebrow">Acceso</p>
      <h1 className="mt-3 text-4xl font-bold">Restablecer contraseña</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Te enviaremos un enlace para crear una nueva contraseña.
      </p>

      {sent ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-success/40 bg-success/10">
            <CheckIcon className="h-7 w-7 text-success" />
          </div>
          <p className="text-sm text-muted">
            Si existe una cuenta con{" "}
            <span className="text-text">{email}</span>, recibirás un email
            en breve con el enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" className="mt-4 text-sm text-text underline underline-offset-4 hover:text-muted">
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-8 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary group w-full"
            >
              {loading ? "Enviando…" : "Enviar enlace"}
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted">
            <Link
              href="/login"
              className="text-text underline underline-offset-4 transition-colors hover:text-muted"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
