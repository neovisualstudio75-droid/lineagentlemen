"use client";

import { useState } from "react";
import type { Barber } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgendaTab } from "./AgendaTab";
import { BarbersTab } from "./BarbersTab";
import { BlocksTab } from "./BlocksTab";

type Tab = "agenda" | "peluqueros" | "bloqueos";

export function AdminDashboard({
  barbers,
  stats,
  today,
}: {
  barbers: Barber[];
  stats: { total: number; topBarber: string; topService: string };
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("agenda");

  return (
    <div>
      {/* Estadísticas del mes */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reservas este mes" value={String(stats.total)} />
        <StatCard label="Peluquero top" value={stats.topBarber} />
        <StatCard label="Servicio top" value={stats.topService} />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-line">
        {(
          [
            ["agenda", "Agenda"],
            ["peluqueros", "Peluqueros"],
            ["bloqueos", "Bloqueos"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm transition-colors",
              tab === id
                ? "border-text text-text"
                : "border-transparent text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "agenda" && <AgendaTab barbers={barbers} today={today} />}
      {tab === "peluqueros" && <BarbersTab barbers={barbers} />}
      {tab === "bloqueos" && <BlocksTab barbers={barbers} today={today} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-6">
      <p className="label mb-2">{label}</p>
      <p className="font-serif text-3xl">{value}</p>
    </div>
  );
}
