import { useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (e) {
      setError("No se pudo enviar el correo. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="min-h-[100svh] grid place-items-center px-4 py-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Solicitud recibida</h2>
          <p className="text-sm text-gray-600">Si existe una cuenta con ese correo, te enviaremos un enlace para restablecer la contraseña.</p>
          <Link to="/login" className="mt-4 inline-block text-blue-600">Volver al inicio de sesión</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[100svh] grid place-items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="text-sm text-gray-600 mb-5">Introduce tu correo institucional y te enviaremos un enlace para resetear tu contraseña.</p>

        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Correo institucional</label>
            <input className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="nombre@unisabana.edu.co" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2">
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          <Link to="/login" className="text-blue-600">Volver al login</Link>
        </p>
      </div>
    </section>
  );
}
