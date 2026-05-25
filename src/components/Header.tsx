import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export async function Header() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" aria-label="Inicio" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/reservar"
            className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
          >
            Reservar
          </Link>

          {profile && (
            <Link
              href="/mis-reservas"
              className="hidden rounded-full px-4 py-2 text-muted transition-colors hover:bg-white/[0.04] hover:text-text sm:block"
            >
              Mis reservas
            </Link>
          )}

          {profile?.rol === "admin" && (
            <Link
              href="/admin"
              className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
            >
              Admin
            </Link>
          )}

          {profile ? (
            <form action="/auth/signout" method="post" className="ml-1">
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-2 text-muted transition-all hover:border-text/60 hover:text-text active:scale-[0.97]"
              >
                Salir
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn-secondary ml-1 px-5 py-2">
              Acceso
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
