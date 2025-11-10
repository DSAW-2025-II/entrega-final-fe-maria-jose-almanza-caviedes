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

export async function sendPasswordResetEmail({ email, firstName, resetLink, token, expiresInMinutes }) {
  if (!email || !resetLink || !token) return;

  const expirationText = typeof expiresInMinutes === "number" && Number.isFinite(expiresInMinutes)
    ? expiresInMinutes
    : 15;

  const mail = {
    to: email,
    from: process.env.MAIL_FROM || "no-reply@wheels-sabana.dev",
    subject: "Restablece tu contraseña de Wheels Sabana",
    text: [
      `Hola ${firstName || ""},`,
      "\n",
      "Recibimos una solicitud para restablecer tu contraseña.",
      "Si fuiste tú, abre el siguiente enlace:",
      resetLink,
      "\n",
      `Este enlace vence en ${expirationText} minutos.`,
      "Si no funciona, copia y pega este token en la aplicación:",
      token,
      "\n",
      "Si no solicitaste este cambio, ignora este mensaje."
    ].join(" "),
    html: `
      <table style="max-width:480px;width:100%;font-family:Helvetica,Arial,sans-serif;color:#0f172a">
        <tr>
          <td style="padding:24px 24px 8px;font-size:20px;font-weight:600;">Hola ${firstName || ""},</td>
        </tr>
        <tr>
          <td style="padding:0 24px 16px;font-size:15px;line-height:1.5;color:#1e293b;">
            Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, usa el siguiente botón.
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;">
            <a href="${resetLink}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#02A0C6;color:#fff;text-decoration:none;font-weight:600;">Sí, restablecer contraseña</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;font-size:14px;line-height:1.5;color:#334155;">
            Si el botón no funciona, copia y pega este token en la aplicación:
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 16px;">
            <code style="display:inline-block;padding:8px 12px;border-radius:12px;background:#f1f5f9;font-size:14px;letter-spacing:0.08em;">${token}</code>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;font-size:13px;line-height:1.6;color:#64748b;">
            Este enlace vence en ${expirationText} minutos. Si no solicitaste este cambio, ignora este mensaje.
          </td>
        </tr>
      </table>
    `
  };

  try {
    const info = await getTransporter().sendMail(mail);
    if (info?.message && process.env.NODE_ENV !== "test") {
      console.log("password reset email (json)", info.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error("sendPasswordResetEmail error", err.message || err);
    }
  }
}
