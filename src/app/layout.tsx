import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Fuente única tipo "Circular": Outfit (geométrica) con jerarquía de pesos:
// bold (700) títulos · medium (500) subtítulos · regular (400) texto.
const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Línea Gentlemen | Reserva tu cita",
  description:
    "Reserva tu cita en Línea Gentlemen. Corte de pelo y arreglo de barba con los mejores profesionales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={sans.variable}>
      <body className="min-h-[100dvh] bg-bg text-text antialiased selection:bg-text selection:text-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
