"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight } from "@/components/icons";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError("No se pudo actualizar. El enlace puede haber expirado.");
      return;
    }

    router.push("/login?message=password-updated");
  }

  return (
    <AuthShell>
      <Logo className="mx-auto mb-10 h-10 lg:hidden" />

      <p className="eyebrow">Acceso</p>
      <h1 className="mt-3 text-4xl font-bold">Nueva contraseña</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Elige una contraseña segura para tu cuenta.
      </p>

      {error && (
        <p className="mt-8 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="password">
            Nueva contraseña
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary group w-full"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
          {!loading && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </button>
      </form>
    </AuthShell>
  );
}
