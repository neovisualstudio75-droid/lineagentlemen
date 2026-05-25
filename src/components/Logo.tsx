import { cn } from "@/lib/utils";

/**
 * Logo oficial de Línea Gentlemen (imagen con fondo transparente).
 * - tone="light" (por defecto): versión blanca, para fondos oscuros.
 * - tone="dark": versión negra, para fondos claros.
 * El tamaño se controla con la clase de altura (p.ej. h-8) en `className`.
 */
export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const src = tone === "dark" ? "/logo-dark.png" : "/logo-white.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Línea Gentlemen"
      width={972}
      height={311}
      className={cn("h-8 w-auto select-none", className)}
    />
  );
}
