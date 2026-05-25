import type { ServiceId } from "./constants";

export type Rol = "cliente" | "admin";
export type EstadoCita =
  | "pendiente"
  | "completada"
  | "cancelada"
  | "no_presentado";

// NOTA: estos tipos de fila se declaran como `type` (no `interface`)
// a propósito: @supabase/supabase-js exige que cada Row sea asignable a
// `Record<string, unknown>`, y las interfaces de TS no lo son (sí los `type`).
export type Profile = {
  id: string;
  user_id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  rol: Rol;
  created_at: string;
};

export type Barber = {
  id: string;
  nombre: string;
  foto_url: string | null;
  activo: boolean;
};

export type Appointment = {
  id: string;
  user_id: string;
  barber_id: string;
  service: ServiceId;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  estado: EstadoCita;
  codigo_reserva: string;
  created_at: string;
};

export type BlockedSlot = {
  id: string;
  barber_id: string;
  fecha: string;
  hora_inicio: string;
  motivo: string | null;
};

export type AppointmentWithRelations = Appointment & {
  barbers: Pick<Barber, "id" | "nombre" | "foto_url"> | null;
  profiles?: Pick<Profile, "nombre" | "apellidos" | "telefono"> | null;
};

/** Tipado de la base de datos para @supabase/supabase-js. */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "rol"> & { rol?: Rol };
        Update: Partial<Omit<Profile, "id" | "user_id">>;
        Relationships: [];
      };
      barbers: {
        Row: Barber;
        Insert: {
          nombre: string;
          foto_url?: string | null;
          activo?: boolean;
        };
        Update: Partial<Omit<Barber, "id">>;
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<
          Appointment,
          "id" | "created_at" | "codigo_reserva" | "estado"
        > & { estado?: EstadoCita };
        Update: Partial<Omit<Appointment, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      blocked_slots: {
        Row: BlockedSlot;
        Insert: Omit<BlockedSlot, "id">;
        Update: Partial<Omit<BlockedSlot, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      taken_slots: {
        Args: { p_fecha: string };
        Returns: { barber_id: string; hora_inicio: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
