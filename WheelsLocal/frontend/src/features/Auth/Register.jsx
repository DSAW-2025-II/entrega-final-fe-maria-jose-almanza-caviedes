import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";

const isInstitutionalEmail = (email) => {
  const e = String(email || "").trim().toLowerCase();
  if (!e.includes("@")) return false;
  const domain = e.split("@")[1] || "";
  return domain === "unisabana.edu.co" || domain.endsWith(".unisabana.edu.co");
};

export default function Register() {
  // Estado del formulario
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    email: "",
    password: ""
  });
  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isInstitutionalEmail(form.email)) {
      setError("Debes usar tu correo institucional @unisabana.edu.co");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      // Backend espera name/email/password; concatenamos nombre
      await api.post("/auth/register", {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: String(form.email || "").trim().toLowerCase(),
        password: form.password
      });
      setSuccess(true);
      // Redirigir a login tras un breve delay
      setTimeout(() => nav("/login"), 1200);
    } catch (e) {
      const msg =
        e?.response?.data?.error === "Email ya registrado"
          ? "Ese correo ya está registrado"
          : e?.response?.data?.error || "No se pudo registrar. Intenta más tarde.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito (similar al mock de diseño)
  if (success) {
    return (
      <section className="min-h-[100svh] grid place-items-center px-4">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none">
              <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-1">¡Registro exitoso!</h2>
          <p className="text-gray-600 mb-5">Te hemos enviado un correo de verificación a tu email institucional</p>
          <button
            onClick={() => nav("/login")}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2"
          >
            Ir a inicio de sesión
          </button>
        </div>
      </section>
    );
  }

  // Formulario (mobile-first)
  return (
    <section className="min-h-[100svh] grid place-items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="text-sm text-gray-600 mb-5">Únete a la comunidad Wheels Sabana</p>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nombre</label>
            <input
              className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Juan"
              value={form.firstName}
              onChange={onChange("firstName")}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Apellido</label>
            <input
              className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Pérez"
              value={form.lastName}
              onChange={onChange("lastName")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Cédula</label>
              <input
                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. 1234567890"
                inputMode="numeric"
                value={form.idNumber}
                onChange={onChange("idNumber")}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Teléfono</label>
              <input
                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3001234567"
                inputMode="tel"
                value={form.phone}
                onChange={onChange("phone")}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Correo institucional</label>
            <input
              className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${
                form.email && !isInstitutionalEmail(form.email)
                  ? "border-red-400 focus:ring-red-500"
                  : "focus:ring-blue-500"
              }`}
              placeholder="nombre@unisabana.edu.co"
              value={form.email}
              onChange={onChange("email")}
            />
            {!isInstitutionalEmail(form.email) && form.email && (
              <p className="text-xs text-red-600 mt-1">Debes usar tu correo @unisabana.edu.co</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="******"
              value={form.password}
              onChange={onChange("password")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}
