import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: String(form.email || "").trim().toLowerCase(),
        password: form.password,
      });
      login(data.token);
      const dest = loc.state?.from?.pathname || "/";
      nav(dest, { replace: true });
    } catch {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[100svh] grid place-items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Inicia sesión</h1>
        <p className="text-sm text-gray-600 mb-5">Accede a Wheels Sabana</p>

        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Correo institucional
            </label>
            <input
              className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nombre@unisabana.edu.co"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="******"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-blue-600">
            Registrarse
          </Link>
        </p>
      </div>
    </section>
  );
}
