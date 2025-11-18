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
  return `${first}${last}`.toUpperCase() || "WS";
};

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-left">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value ?? "—"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile, loadingProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const availableRoles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const rolesKey = useMemo(() => availableRoles.join("|"), [availableRoles]);

  const passengerActive = user?.activeRole === "pasajero";
  const driverActive = user?.activeRole === "conductor";
  const hasDriverRole = rolesKey.includes("driver");

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

  useEffect(() => {
    let cancelled = false;
    async function loadVehicles() {
      if (!user?.id || !hasDriverRole) {
        if (!cancelled) setVehicles([]);
        return;
      }
      try {
        setLoadingVehicles(true);
        const { data } = await api.get("/vehicles");
        if (!cancelled) setVehicles(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setVehicles([]);
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    }
    loadVehicles();
    return () => { cancelled = true; };
  }, [user?.id, rolesKey]);

  async function changeRole(role) {
    if (!role || role === user?.activeRole) return;
    setUpdatingRole(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.put("/auth/role", { role });
      if (data?.user) {
        await refreshProfile();
        setSuccess(`Rol activo actualizado a ${role === "conductor" ? "Conductor" : "Pasajero"}`);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo actualizar el rol");
    } finally {
      setUpdatingRole(false);
    }
  }

  if (!user) return <p className="text-white p-4">Inicia sesión para ver tu perfil.</p>;

  const driverReady = hasDriverRole && vehicles.length > 0;

  return (
    <section className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Mi perfil</h1>
      </header>

      {error && <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* Perfil básico */}
      <article className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-b from-[#003366] to-[#001a33] p-8 text-white shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/40 bg-white/10">
            {form.photoUrl ? <img src={form.photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> :
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold">{avatarFallback(user.firstName, user.lastName)}</span>
            }
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-white/80">{user.email}</p>
          <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
            Rol actual: {user.activeRole === "conductor" ? "Conductor" : "Pasajero"}
          </span>
        </div>
      </article>

      {/* Toggle roles */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 mt-6 shadow-sm">
        <div className="grid gap-4">
          <article className={`rounded-3xl border p-5 transition-all duration-200 ${passengerActive ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Pasajero</p>
              </div>
              <button
                type="button"
                onClick={() => changeRole("pasajero")}
                disabled={updatingRole || passengerActive}
                className={`h-7 w-12 rounded-full ${passengerActive ? "bg-cyan-500" : "bg-slate-300"}`}
              >
                <span className={`block h-5 w-5 bg-white rounded-full transition-transform ${passengerActive ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </article>

          <article className={`rounded-3xl border p-5 transition-all duration-200 ${driverActive ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Conductor</p>
              </div>
              <button
                type="button"
                onClick={() => changeRole("conductor")}
                disabled={updatingRole || driverActive || !driverReady}
                className={`h-7 w-12 rounded-full ${driverActive ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`block h-5 w-5 bg-white rounded-full transition-transform ${driverActive ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
