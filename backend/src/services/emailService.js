// Lightweight email service placeholder. In production, replace with real provider integration.
import nodemailer from "nodemailer";

// Provide a shared transporter lazily to avoid creating connections when not configured.
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    return transporter;
  }

  // Fallback: use JSON transport which just logs the message for development/testing.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

export async function sendWelcomeEmail({ email, firstName }) {
  if (!email) return;

  const mail = {
    to: email,
    from: process.env.MAIL_FROM || "no-reply@wheels-sabana.dev",
    subject: "Bienvenido a Wheels Sabana",
    text: `Hola ${firstName || ""}, tu cuenta está lista. Ingresa y reserva tus viajes.`,
    html: `<p>Hola <strong>${firstName || ""}</strong>,</p><p>Tu cuenta de Wheels Sabana está lista. Ingresa y reserva tus viajes.</p>`
  };

  try {
    const info = await getTransporter().sendMail(mail);
    if (info?.message && process.env.NODE_ENV !== "test") {
      console.log("welcome email (json)", info.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error("sendWelcomeEmail error", err.message || err);
    }
  }
}
