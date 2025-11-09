import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

function isInstitutionalEmail(value) {
  const norm = String(value || "").trim().toLowerCase();
  if (!norm.includes("@")) return false;
  const [, domain] = norm.split("@");
  return domain === "unisabana.edu.co" || domain?.endsWith(".unisabana.edu.co");
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Ingresa tu correo institucional");
      return;
    }
    if (!isInstitutionalEmail(trimmedEmail)) {
      setError("Usa tu correo @unisabana.edu.co");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: trimmedEmail });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo enviar el correo. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[100svh] bg-gradient-to-b from-[#04142D] via-[#07234A] to-[#04142D] px-4 py-14">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center text-white/70">
          <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-xl">
          <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E1F9FF] text-[#02A0C6]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0v7.5A2.25 2.25 0 0014.25 21h-4.5A2.25 2.25 0 007.5 18V10.5m9 0h1.125A1.125 1.125 0 0018.75 9.375V8.25a1.125 1.125 0 00-1.125-1.125H6.375A1.125 1.125 0 005.25 8.25v1.125A1.125 1.125 0 006.375 10.5H7.5" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900">Recuperar contraseña</h1>
              <p className="text-sm text-slate-600">Ingresa tu correo institucional para recibir instrucciones</p>
            </div>

            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa la bandeja de entrada y el spam.
                </p>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-[#02A0C6] px-6 py-2 text-sm font-semibold text-[#02A0C6] transition hover:bg-[#02A0C6]/10">
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Correo institucional
                  <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-4 py-3 focus-within:border-[#02A0C6] ${error ? "border-red-400" : "border-slate-200"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${error ? "text-red-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2.25 2.25 0 002.22 0L21 8m-18 8h18a2.25 2.25 0 002.25-2.25V8.25A2.25 2.25 0 0021 6H3a2.25 2.25 0 00-2.25 2.25v5.5A2.25 2.25 0 003 16z" />
                    </svg>
                    <input
                      type="email"
                      className="flex-1 border-none bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      placeholder="nombre@unisabana.edu.co"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </label>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-full bg-[#02A0C6] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0291b2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Enviando instrucciones..." : "Enviar instrucciones"}
                </button>
                <Link to="/login" className="text-center text-xs font-medium text-[#02A0C6] transition hover:text-[#0291b2]">
                  Volver al inicio de sesión
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
