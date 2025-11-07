import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!token) setError("Token inválido");
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("Token inválido");
    if (!password || password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => nav("/login"), 1500);
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo resetear la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="min-h-[100svh] grid place-items-center px-4 py-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Contraseña actualizada</h2>
          <p className="text-sm text-gray-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link to="/login" className="mt-4 inline-block text-blue-600">Ir a login</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[100svh] grid place-items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
        <p className="text-sm text-gray-600 mb-5">Introduce una nueva contraseña para tu cuenta.</p>

        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirmar contraseña</label>
            <input type="password" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2">
            {loading ? "Procesando..." : "Actualizar contraseña"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          <Link to="/login" className="text-blue-600">Volver al login</Link>
        </p>
      </div>
    </section>
  );
}
