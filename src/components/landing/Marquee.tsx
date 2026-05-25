const WORDS = [
  "Reserva online en segundos",
  "Sin esperas",
  "Atención personalizada",
  "Acabado profesional",
  "Producto premium",
  "Tu estilo, nuestra firma",
];

function Row() {
  return (
    <div className="flex shrink-0 animate-marquee items-center gap-8 whitespace-nowrap pr-8">
      {WORDS.map((w, i) => (
        <span key={i} className="flex items-center gap-8">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            {w}
          </span>
          <span className="text-[6px] text-text/40">✦</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="relative flex overflow-hidden border-y border-line py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <Row />
      <Row />
    </div>
  );
}
