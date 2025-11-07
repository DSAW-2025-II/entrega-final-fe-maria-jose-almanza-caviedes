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

  const availableRoles = useMemo(() => user?.roles || [], [user?.roles]);

  useEffect(() => {
    if (!user) {
      setForm(emptyForm);
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
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </footer>
      </article>
    </section>
  );
}
