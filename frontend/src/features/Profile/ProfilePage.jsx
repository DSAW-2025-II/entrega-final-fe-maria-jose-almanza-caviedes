import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  photoUrl: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  preferredPaymentMethod: "cash"
};

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile, logout, loadingProfile } = useAuth();
  const [updatingRole, setUpdatingRole] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const availableRoles = useMemo(() => user?.roles || [], [user?.roles]);

  useEffect(() => {
    if (!user) {
      setForm(emptyForm);
      setResetEmail("");
      return;
    }
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      photoUrl: user.photoUrl || "",
      emergencyContactName: user.emergencyContact?.name || "",
      emergencyContactPhone: user.emergencyContact?.phone || "",
      preferredPaymentMethod: user.preferredPaymentMethod || "cash"
    });
    setResetEmail(user.email || "");
  }, [user]);

  async function changeRole(role) {
    if (!role || role === user?.activeRole) return;
    setUpdatingRole(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.put("/auth/role", { role });
      if (data?.user) {
        await refreshProfile();
        setSuccess(`Rol activo actualizado a ${role === "driver" ? "Conductor" : "Pasajero"}`);
      }
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo actualizar el rol";
      setError(message);
    } finally {
      setUpdatingRole(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        photoUrl: form.photoUrl,
        preferredPaymentMethod: form.preferredPaymentMethod,
        emergencyContact:
          form.emergencyContactName || form.emergencyContactPhone
            ? {
                name: form.emergencyContactName,
                phone: form.emergencyContactPhone
              }
            : null
      };
      await updateProfile(payload);
      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "No se pudo actualizar el perfil";
      setError(message);
    } finally {
      setSavingProfile(false);
    }
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setResetStep("request");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetToken("");
    setResetError("");
    setResetMessage("");
    setResetLoading(false);
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    if (!resetEmail) {
      setResetError("Ingresa tu correo institucional");
      return;
    }
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      setResetMessage("Si el correo existe enviaremos instrucciones a tu bandeja institucional.");
      setResetStep("request-sent");
    } catch (err) {
      setResetError("No se pudo enviar el correo. Intenta de nuevo más tarde.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    if (!resetToken) {
      setResetError("Ingresa el código/token recibido por correo");
      return;
    }
    if (!resetPassword || resetPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError("Las contraseñas no coinciden");
      return;
    }
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", { token: resetToken, password: resetPassword });
      setResetStep("success");
      setResetMessage("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
    } catch (err) {
      setResetError(err?.response?.data?.error || "No se pudo restablecer la contraseña");
    } finally {
      setResetLoading(false);
    }
  }

  if (!user) {
    return (
      <section className="py-6">
        <p className="text-sm text-slate-500">Inicia sesión para ver tu perfil.</p>
      </section>
    );
  }

  return (
    <section className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-600">Consulta tu información básica y cambia entre roles disponibles.</p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <article className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-slate-600">{user.email}</p>
            <p className="text-sm text-slate-600">ID Universitario: {user.universityId}</p>
            {user.phone && <p className="text-sm text-slate-600">Teléfono: {user.phone}</p>}
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Rol activo: <span className="font-medium">{user.activeRole === "driver" ? "Conductor" : "Pasajero"}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Datos personales</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Nombre
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                />
              </label>
              <label className="text-sm text-slate-600">
                Apellido
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                />
              </label>
              <label className="text-sm text-slate-600">
                Teléfono de contacto
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                />
              </label>
              <label className="text-sm text-slate-600">
                URL foto de perfil
                <input
                  type="url"
                  value={form.photoUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, photoUrl: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://"
                  disabled={savingProfile}
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-800">Contacto de emergencia</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Nombre
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                />
              </label>
              <label className="text-sm text-slate-600">
                Teléfono
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-800">Preferencias</h3>
            <div className="mt-3 grid gap-4 sm:max-w-xs">
              <label className="text-sm text-slate-600">
                Método de pago preferido
                <select
                  value={form.preferredPaymentMethod}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, preferredPaymentMethod: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={savingProfile}
                >
                  <option value="cash">Efectivo</option>
                  <option value="nequi">Nequi</option>
                </select>
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
              disabled={savingProfile || loadingProfile}
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        {availableRoles.length > 1 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Cambiar rol</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`rounded-md px-4 py-2 text-sm font-medium ${
                    role === user.activeRole
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => changeRole(role)}
                  disabled={updatingRole || role === user.activeRole}
                >
                  {role === "driver" ? "Conductor" : "Pasajero"}
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            onClick={() => refreshProfile()}
            disabled={updatingRole || savingProfile}
          >
            Actualizar datos
          </button>
          <button
            type="button"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            onClick={() => setShowLogoutModal(true)}
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
            onClick={() => {
              setShowPasswordModal(true);
              setResetStep("request");
              setResetPassword("");
              setResetConfirmPassword("");
              setResetToken("");
              setResetError("");
              setResetMessage("");
            }}
          >
            Restablecer contraseña
          </button>
        </footer>
      </article>

      {showLogoutModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-slate-900 px-6 py-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">Configuración</p>
              <h2 className="mt-2 text-xl font-semibold">¿Cerrar sesión?</h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-slate-600">¿Estás seguro de que deseas salir de tu cuenta?</p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full rounded-full bg-red-500 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-red-600"
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                >
                  Sí, cerrar sesión
                </button>
                <button
                  type="button"
                  className="w-full rounded-full border border-slate-300 py-3 text-sm font-semibold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-slate-900 px-6 py-5 text-white">
              <button
                type="button"
                className="text-sm font-medium text-white/70 hover:text-white"
                onClick={closePasswordModal}
              >
                Volver
              </button>
              <h2 className="mt-3 text-xl font-semibold">
                {resetStep === "request" || resetStep === "request-sent" ? "Recuperar contraseña" : "Nueva contraseña"}
              </h2>
              <p className="text-sm text-white/70">
                {resetStep === "request" || resetStep === "request-sent"
                  ? "Ingresa tu correo institucional para recibir instrucciones"
                  : "Ingresa tu nueva contraseña"}
              </p>
            </div>
            <div className="px-6 py-6">
              {resetError && (
                <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resetError}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {resetMessage}
                </div>
              )}

              {(resetStep === "request" || resetStep === "request-sent") && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <label className="text-sm text-slate-600">
                    Correo institucional
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="nombre@unisabana.edu.co"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      disabled={resetLoading}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-full bg-teal-500 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-teal-600 disabled:opacity-60"
                  >
                    {resetLoading ? "Enviando..." : "Enviar instrucciones"}
                  </button>
                </form>
              )}

              {resetStep === "request-sent" && (
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>
                    Revisa tu correo institucional. Si ya tienes el token puedes avanzar para definir una nueva contraseña desde aquí mismo.
                  </p>
                  <button
                    type="button"
                    className="text-teal-600 hover:text-teal-700"
                    onClick={() => {
                      setResetStep("reset");
                      setResetError("");
                      setResetMessage("");
                    }}
                  >
                    Ya tengo el token, continuar
                  </button>
                </div>
              )}

              {resetStep === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <label className="text-sm text-slate-600">
                    Token de verificación
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(event) => setResetToken(event.target.value)}
                      placeholder="Pega aquí el código del correo"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      disabled={resetLoading}
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    Nueva contraseña
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      disabled={resetLoading}
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    Confirmar contraseña
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(event) => setResetConfirmPassword(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      disabled={resetLoading}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-full bg-teal-500 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-teal-600 disabled:opacity-60"
                  >
                    {resetLoading ? "Procesando..." : "Restablecer contraseña"}
                  </button>
                </form>
              )}

              {resetStep === "success" && (
                <div className="space-y-4 text-center text-sm text-slate-600">
                  <p>Contraseña actualizada. Puedes usarla la próxima vez que inicies sesión.</p>
                  <button
                    type="button"
                    className="w-full rounded-full bg-teal-500 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-teal-600"
                    onClick={closePasswordModal}
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
