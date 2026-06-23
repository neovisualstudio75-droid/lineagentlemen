"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight } from "@/components/icons";

function LoginInner() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/reservar";
  const authError = params.get("error");
  const confirmed = params.get("message") === "confirm";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <AuthShell>
      <Logo className="mx-auto mb-10 h-10 lg:hidden" />

      <p className="eyebrow">Bienvenido de nuevo</p>
      <h1 className="mt-3 text-4xl font-bold">Inicia sesión</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Accede para gestionar y reservar tus citas.
      </p>

      {confirmed && (
        <p className="mt-8 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          Cuenta confirmada. Ya puedes iniciar sesión.
        </p>
      )}

      {(authError || error) && (
        <p className="mt-8 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error ?? "No se pudo iniciar sesión. Inténtalo de nuevo."}
        </p>
      )}

      <form onSubmit={signIn} className="mt-8 space-y-5">
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

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0" htmlFor="password">
              Contraseña
            </label>
            <Link
              href="/recuperar"
              className="text-[0.7rem] text-muted underline underline-offset-4 transition-colors hover:text-text"
            >
              Restablecer contraseña
            </Link>
          </div>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary group w-full"
        >
          {loading ? "Conectando…" : "Iniciar sesión"}
          {!loading && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link
          href={`/registro?redirect=${encodeURIComponent(redirect)}`}
          className="text-text underline underline-offset-4 transition-colors hover:text-muted"
        >
          Regístrate aquí
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
