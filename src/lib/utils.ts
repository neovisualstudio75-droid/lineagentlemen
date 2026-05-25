export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Devuelve YYYY-MM-DD en hora local (sin desfase por UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parsea YYYY-MM-DD como fecha local (evita el shift de new Date(str)). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Fecha y hora actuales en la zona horaria de la barbería (Europe/Madrid),
 * independientemente de la zona del servidor (Vercel corre en UTC).
 */
export function madridNow(): {
  dateKey: string;
  minutes: number;
  weekday: number;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const weekday = fromDateKey(dateKey).getDay();

  return { dateKey, minutes, weekday };
}

/** Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Normaliza "HH:MM:SS" → "HH:MM". */
export function hhmm(t: string): string {
  return t.slice(0, 5);
}
