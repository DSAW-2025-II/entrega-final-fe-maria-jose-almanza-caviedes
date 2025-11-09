import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setError("Token inválido o expirado");
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError("Token inválido o expirado");
      return;
    }
    if (!password || password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: password.trim() });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo restablecer la contraseña");
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h3a2.25 2.25 0 012.25 2.25V9m-7.5 0h7.5m-7.5 0A2.25 2.25 0 006 11.25v7.5A2.25 2.25 0 008.25 21h7.5A2.25 2.25 0 0018 18.75v-7.5A2.25 2.25 0 0015.75 9m-7.5 0h7.5" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900">Nueva contraseña</h1>
              <p className="text-sm text-slate-600">Ingresa tu nueva contraseña</p>
            </div>

            {success ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Tu contraseña fue actualizada correctamente. Estamos redirigiéndote al inicio de sesión.
                </p>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-[#02A0C6] px-6 py-2 text-sm font-semibold text-[#02A0C6] transition hover:bg-[#02A0C6]/10">
                  Ir al login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 text-left">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Nueva contraseña
                    <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-4 py-3 focus-within:border-[#02A0C6] ${error?.includes("contrase") ? "border-red-400" : "border-slate-200"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        className="flex-1 border-none bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                        placeholder="********"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (error) setError("");
                        }}
                        disabled={loading}
                      />
                    </div>
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Confirmar contraseña
                    <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-4 py-3 focus-within:border-[#02A0C6] ${error === "Las contraseñas no coinciden" ? "border-red-400" : "border-slate-200"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        className="flex-1 border-none bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                        placeholder="********"
                        value={confirm}
                        onChange={(event) => {
                          setConfirm(event.target.value);
                          if (error) setError("");
                        }}
                        disabled={loading}
                      />
                    </div>
                  </label>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-full bg-[#02A0C6] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0291b2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Restableciendo..." : "Restablecer contraseña"}
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
