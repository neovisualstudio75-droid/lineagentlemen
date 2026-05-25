export const SLOT_MINUTES = 40;

export type ServiceId = "corte" | "corte_barba";

export interface Service {
  id: ServiceId;
  nombre: string;
  duracion: number;
  precio: number;
  descripcion: string;
}

export const SERVICES: Service[] = [
  {
    id: "corte",
    nombre: "Corte de pelo",
    duracion: 40,
    precio: 15,
    descripcion: "Asesoramiento, lavado, corte y peinado.",
  },
  {
    id: "corte_barba",
    nombre: "Corte de pelo + Barba",
    duracion: 40,
    precio: 18,
    descripcion: "Corte completo y arreglo de barba a navaja.",
  },
];

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

/** Tramos horarios por día de la semana (0 = domingo ... 6 = sábado). */
type Range = { start: string; end: string };
const WEEKDAY_RANGES: Range[] = [
  { start: "10:00", end: "14:00" },
  { start: "16:00", end: "20:00" },
];
const SATURDAY_RANGES: Range[] = [{ start: "10:00", end: "14:00" }];

export function rangesForWeekday(weekday: number): Range[] {
  if (weekday >= 1 && weekday <= 5) return WEEKDAY_RANGES;
  if (weekday === 6) return SATURDAY_RANGES;
  return []; // domingo cerrado
}

export function isOpenDay(weekday: number): boolean {
  return rangesForWeekday(weekday).length > 0;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Genera las horas de inicio de slot (HH:MM) para un día de la semana. */
export function slotsForWeekday(weekday: number): string[] {
  const result: string[] = [];
  for (const range of rangesForWeekday(weekday)) {
    const start = toMinutes(range.start);
    const end = toMinutes(range.end);
    for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
      result.push(toHHMM(t));
    }
  }
  return result;
}

export const SCHEDULE_TEXT = [
  { dias: "Lunes a viernes", horas: "10:00 – 14:00 · 16:00 – 20:00" },
  { dias: "Sábado", horas: "10:00 – 14:00" },
  { dias: "Domingo", horas: "Cerrado" },
];

/** Antelación mínima para cancelar (en horas). */
export const CANCEL_MIN_HOURS = 2;
