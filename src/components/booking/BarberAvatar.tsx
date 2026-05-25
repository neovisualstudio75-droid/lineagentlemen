import { cn } from "@/lib/utils";

export function BarberAvatar({
  nombre,
  fotoUrl,
  size = 64,
  className,
}: {
  nombre: string;
  fotoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface2 font-serif text-muted",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt={nombre}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        nombre.charAt(0).toUpperCase()
      )}
    </span>
  );
}
