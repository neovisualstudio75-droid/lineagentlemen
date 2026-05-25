import { cn } from "@/lib/utils";
import type { EstadoCita } from "@/lib/types";

const CONFIG: Record<EstadoCita, { label: string; className: string }> = {
  pendiente: { label: "Confirmada", className: "border-text/40 text-text" },
  completada: {
    label: "Completada",
    className: "border-success/40 text-success",
  },
  cancelada: { label: "Cancelada", className: "border-line text-muted" },
  no_presentado: {
    label: "No presentado",
    className: "border-danger/40 text-danger",
  },
};

export function StatusBadge({ estado }: { estado: EstadoCita }) {
  const { label, className } = CONFIG[estado];
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap border px-2.5 py-1 text-[0.65rem] uppercase tracking-wider",
        className,
      )}
    >
      {label}
    </span>
  );
}
