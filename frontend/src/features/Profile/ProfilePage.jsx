import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const avatarFallback = (firstName = "", lastName = "") => {
  const first = firstName.trim().charAt(0) || "";
  const last = lastName.trim().charAt(0) || "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "WS";
};

function InfoRow({ label, value }) {
  const display = value ?? "—";
  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-left">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{display || "—"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile, loadingProfile } = useAuth();
  const navigate = useNavigate();
  const [updatingRole, setUpdatingRole] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      // Enviar el rol exactamente como está en user.roles
      const { data } = await api.put("/auth/role", { role });
      if (data?.user) {
        await refreshProfile();
        setSuccess(
          `Rol activo actualizado a ${role === "conductor" ? "Conductor" : "Pasajero"}`
        );
      }
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo actualizar el rol";
      setError(message);
    } finally {
      setUpdatingRole(false);
    }
  }

  const passengerActive = user?.activeRole === "pasajero";
  const driverActive = user?.activeRole === "conductor";
  const availableRoles = useMemo(() => user?.roles || [], [user?.roles]);

  return (
    <section className="py-6">
      {!user ? (
        <p className="text-sm text-slate-500">Inicia sesión para ver tu perfil.</p>
      ) : (
        <div className="grid gap-6">
          {/* Info principal */}
          <article className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-b from-[#003366] to-[#001a33] p-8 text-white shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/40 bg-white/10">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-semibold">
                    {avatarFallback(user.firstName, user.lastName)}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-white/80">{user.email}</p>
              <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                Rol actual: {driverActive ? "Conductor" : "Pasajero"}
              </span>
            </div>
          </article>

          {/* Toggle de roles */}
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Modo de usuario</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cambia entre pasajero y conductor en cualquier momento.
            </p>
            <div className="flex gap-4">
              {/* Pasajero */}
              <button
                className={`flex-1 p-4 rounded-2xl border ${
                  passengerActive ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-slate-50"
                }`}
                disabled={updatingRole || passengerActive}
                onClick={() => changeRole("pasajero")}
              >
                Pasajero {passengerActive && "· Activo"}
              </button>
              {/* Conductor */}
              <button
                className={`flex-1 p-4 rounded-2xl border ${
                  driverActive ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}
                disabled={updatingRole || driverActive || !availableRoles.includes("conductor")}
                onClick={() => changeRole("conductor")}
              >
                Conductor {driverActive && "· Activo"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            {success && (
              <p className="mt-2 text-xs text-green-600">{success}</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
