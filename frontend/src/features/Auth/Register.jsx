import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { useTheme } from "../../context/ThemeContext.jsx";
import { pageTransition } from "../../theme/motion.js";

const isInstitutionalEmail = (email) => {
  const e = String(email || "").trim().toLowerCase();
  if (!e.includes("@")) return false;
  const domain = e.split("@")[1] || "";
  return domain === "unisabana.edu.co" || domain.endsWith(".unisabana.edu.co");
};

export default function Register() {
  const { palette } = useTheme();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    email: "",
    password: "",
    photoUrl: ""
  });
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
    if (!form.password || form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!form.firstName || !form.lastName || !form.idNumber || !form.phone) {
      setError("Completa todos los datos personales requeridos");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        universityId: form.idNumber.trim(),
        phone: form.phone.trim(),
        email: String(form.email || "").trim().toLowerCase(),
        password: form.password,
        role: "passenger",
        photoUrl: form.photoUrl?.trim() || undefined
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
  const fields = [
    {
      label: "Nombre",
      placeholder: "Ej. Juan",
      value: form.firstName,
      onChange: onChange("firstName"),
      type: "text"
    },
    {
      label: "Apellido",
      placeholder: "Ej. Pérez",
      value: form.lastName,
      onChange: onChange("lastName"),
      type: "text"
    },
    {
      label: "Cédula",
      placeholder: "Ej. 1234567890",
      value: form.idNumber,
      onChange: onChange("idNumber"),
      type: "text",
      inputMode: "numeric"
    },
    {
      label: "Teléfono",
      placeholder: "3001234567",
      value: form.phone,
      onChange: onChange("phone"),
      type: "tel",
      inputMode: "tel"
    },
    {
      label: "Correo institucional",
      placeholder: "nombre@unisabana.edu.co",
      value: form.email,
      onChange: onChange("email"),
      type: "email"
    },
    {
      label: "Contraseña",
      placeholder: "********",
      value: form.password,
      onChange: onChange("password"),
      type: "password"
    },
    {
      label: "URL foto de perfil",
      placeholder: "https://",
      value: form.photoUrl,
      onChange: onChange("photoUrl"),
      type: "url"
    }
  ];

  if (success) {
    return (
      <motion.section
        className="relative grid min-h-[80vh] place-items-center text-white"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
      >
        <motion.div
          className={`w-full max-w-lg rounded-3xl p-10 text-center shadow-2xl ${palette.card}`}
          animate={{ scale: [0.95, 1, 0.97, 1], opacity: [0.6, 1] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20">
            <svg className="h-10 w-10 text-emerald-300" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 7L9 18l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">¡Registro exitoso!</h2>
          <p className="mt-3 text-sm text-white/70">
            Te enviamos un correo de verificación a tu email institucional. Activa tu cuenta y comienza a planear tu
            próximo viaje futurista.
          </p>
          <button
            onClick={() => nav("/login")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/30"
          >
            Ir a inicio de sesión
          </button>
        </motion.div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] text-white"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <motion.div
        className={`relative overflow-hidden rounded-3xl p-10 shadow-2xl ${palette.card}`}
        animate={{ opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">Bienvenido a Wheels Sabana</p>
          <h1 className="mt-5 text-4xl font-bold text-white">Crea tu cuenta futurista</h1>
          <p className="mt-4 text-sm text-white/70">
            Conecta con compañeros, comparte viajes seguros y personaliza tu identidad digital con un perfil vibrante.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            <li>• Autenticación protegida con correo institucional.</li>
            <li>• Personaliza tu avatar y tema desde el primer día.</li>
            <li>• Accede a notificaciones en tiempo real y chat integrado.</li>
          </ul>
        </div>
        <motion.div
          aria-hidden
          className="absolute inset-0 z-0"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-20 right-[-10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-15%] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </motion.div>
      </motion.div>

      <motion.div className={`relative rounded-3xl p-10 shadow-2xl ${palette.card}`} variants={pageTransition}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Registro</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Únete hoy</h2>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
            Paso 1/3
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          {fields.map((field) => (
            <label key={field.label} className="text-xs uppercase tracking-[0.3em] text-white/50">
              {field.label}
              <input
                {...("inputMode" in field ? { inputMode: field.inputMode } : {})}
                type={field.type}
                value={field.value}
                onChange={field.onChange}
                placeholder={field.placeholder}
                className={`mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 ${
                  field.label === "Correo institucional" && field.value && !isInstitutionalEmail(field.value)
                    ? "border-red-400/60 focus:ring-red-300/60"
                    : ""
                }`}
              />
              {field.label === "Correo institucional" && field.value && !isInstitutionalEmail(field.value) && (
                <p className="mt-2 text-[0.65rem] text-red-200/80">Debes usar tu correo @unisabana.edu.co</p>
              )}
            </label>
          ))}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-white/30 disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-white/60">
          ¿Ya tienes cuenta? <Link to="/login" className="text-white/90 underline">Inicia sesión</Link>
        </p>
      </motion.div>
    </motion.section>
  );
}
