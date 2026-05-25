import { Resend } from "resend";
import { getService } from "@/lib/constants";
import { formatDateLong, fromDateKey, hhmm } from "@/lib/utils";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Línea Gentlemen <onboarding@resend.dev>";

interface ConfirmationData {
  to: string;
  nombre: string;
  service: string;
  barbero: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  codigo: string;
}

/** Envío best-effort: si no hay API key, no rompe la reserva. */
export async function sendBookingConfirmation(data: ConfirmationData) {
  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada; se omite el email.");
    return;
  }

  const resend = new Resend(apiKey);
  const servicio = getService(data.service)?.nombre ?? data.service;
  const fechaLarga = formatDateLong(fromDateKey(data.fecha));

  try {
    await resend.emails.send({
      from,
      to: data.to,
      subject: "Confirmación de tu cita · Línea Gentlemen",
      html: `
        <div style="background:#0A0A0A;color:#F5F5F5;font-family:Arial,sans-serif;padding:40px 24px">
          <div style="max-width:480px;margin:0 auto">
            <h1 style="font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Línea Gentlemen</h1>
            <p style="color:#888;margin:0 0 32px">Tu cita está confirmada.</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #2A2A2A">
              <tr><td style="padding:14px 18px;color:#888;border-bottom:1px solid #2A2A2A">Servicio</td><td style="padding:14px 18px;text-align:right;border-bottom:1px solid #2A2A2A">${servicio}</td></tr>
              <tr><td style="padding:14px 18px;color:#888;border-bottom:1px solid #2A2A2A">Peluquero</td><td style="padding:14px 18px;text-align:right;border-bottom:1px solid #2A2A2A">${data.barbero}</td></tr>
              <tr><td style="padding:14px 18px;color:#888;border-bottom:1px solid #2A2A2A">Fecha</td><td style="padding:14px 18px;text-align:right;border-bottom:1px solid #2A2A2A;text-transform:capitalize">${fechaLarga}</td></tr>
              <tr><td style="padding:14px 18px;color:#888">Hora</td><td style="padding:14px 18px;text-align:right">${hhmm(data.hora)}</td></tr>
            </table>
            <p style="color:#888;margin:24px 0 4px;font-size:13px">Código de reserva</p>
            <p style="font-size:18px;letter-spacing:2px;margin:0 0 32px">${data.codigo.slice(0, 8).toUpperCase()}</p>
            <p style="color:#666;font-size:12px;line-height:1.6">Para cancelar, hazlo desde la app con al menos 2 horas de antelación. Te esperamos.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error enviando email de confirmación:", err);
  }
}
