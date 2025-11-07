import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyVehicle = {
  plate: "",
  brand: "",
  model: "",
  capacity: "",
  vehiclePhotoUrl: "",
  soatPhotoUrl: "",
  soatExpiration: "",
  licenseNumber: "",
  licenseExpiration: ""
};

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function isDocumentValid(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date >= new Date();
}

export default function VehiclesPage() {
  const { user, refreshProfile } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyVehicle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activatingId, setActivatingId] = useState("");

  const isDriver = useMemo(() => (user?.roles || []).includes("driver"), [user?.roles]);
  const activeVehicleId = user?.activeVehicle?.toString?.() || user?.activeVehicle || "";

  async function fetchVehicles() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/vehicles");
      const list = Array.isArray(data) ? data : [];
      setVehicles(list);
    } catch (err) {
      console.error("vehicles fetch", err);
      setError("No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setMode("create");
    setSelectedId("");
    setForm(emptyVehicle);
    setError("");
    setSuccess("");
  }

  function openEdit(vehicle) {
    setMode("edit");
    setSelectedId(vehicle._id);
    setForm({
      plate: vehicle.plate || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      capacity: String(vehicle.capacity ?? ""),
      vehiclePhotoUrl: vehicle.vehiclePhotoUrl || "",
      soatPhotoUrl: vehicle.soatPhotoUrl || "",
      soatExpiration: formatDateInput(vehicle.soatExpiration),
      licenseNumber: vehicle.licenseNumber || "",
      licenseExpiration: formatDateInput(vehicle.licenseExpiration)
    });
    setError("");
    setSuccess("");
  }

  function resetToList(message = "") {
    setMode("list");
    setSelectedId("");
    setForm(emptyVehicle);
    if (message) setSuccess(message);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.plate || !form.brand || !form.model || !form.capacity) {
      setError("Completa los campos obligatorios marcados con *");
      return;
    }
    if (!form.soatExpiration || !form.licenseNumber || !form.licenseExpiration) {
      setError("Debes registrar la información del SOAT y la licencia");
      return;
    }

    const payload = {
      plate: form.plate.trim().toUpperCase(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      capacity: Number(form.capacity),
      vehiclePhotoUrl: form.vehiclePhotoUrl || undefined,
      soatPhotoUrl: form.soatPhotoUrl || undefined,
      soatExpiration: form.soatExpiration,
      licenseNumber: form.licenseNumber.trim(),
      licenseExpiration: form.licenseExpiration
    };

    if (!Number.isInteger(payload.capacity) || payload.capacity < 1 || payload.capacity > 8) {
      setError("La capacidad debe ser un número entre 1 y 8");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "edit" && selectedId) {
        await api.put(`/vehicles/${selectedId}`, payload);
        resetToList("Vehículo actualizado correctamente");
      } else {
        await api.post("/vehicles", payload);
        resetToList("Vehículo registrado correctamente");
      }
      await fetchVehicles();
      await refreshProfile();
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo guardar el vehículo";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(vehicleId) {
    if (!window.confirm("¿Eliminar este vehículo? Esta acción no se puede deshacer.")) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      await fetchVehicles();
      await refreshProfile();
      resetToList("Vehículo eliminado");
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo eliminar el vehículo";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(vehicleId) {
    if (!vehicleId || vehicleId === activeVehicleId) return;
    setActivatingId(vehicleId);
    setError("");
    setSuccess("");
    try {
      await api.put(`/vehicles/${vehicleId}/activate`, {});
      await refreshProfile();
      setSuccess("Vehículo activado para futuros viajes");
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo activar el vehículo";
      setError(message);
    } finally {
      setActivatingId("");
    }
  }

  const validVehicles = vehicles.filter(
    (vehicle) => isDocumentValid(vehicle.soatExpiration) && isDocumentValid(vehicle.licenseExpiration)
  );

  if (!isDriver && vehicles.length === 0) {
    return (
      <section className="py-6">
        <h1 className="text-2xl font-semibold text-slate-900">Mis vehículos</h1>
        <p className="mt-3 text-sm text-slate-600">
          Cambia al rol de conductor para registrar tu vehículo y compartir viajes.
        </p>
      </section>
    );
  }

  return (
    <section className="py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mis vehículos</h1>
          <p className="text-sm text-slate-600">Gestiona todos los vehículos que usarás para ofrecer viajes.</p>
          {vehicles.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Documentos vigentes: {validVehicles.length}/{vehicles.length}. Solo los vehículos con documentos vigentes podrán usarse al crear viajes.
            </p>
          )}
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          onClick={openCreate}
          disabled={!isDriver || submitting}
        >
          Registrar vehículo
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <>
          {vehicles.length === 0 && mode === "list" && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
              Aún no has registrado vehículos. Registra al menos uno con documentos vigentes para ofrecer viajes.
            </div>
          )}

          {vehicles.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {vehicles.map((vehicle) => {
                const vehicleId = String(vehicle._id);
                const isActive = vehicleId === activeVehicleId;
                const soatValid = isDocumentValid(vehicle.soatExpiration);
                const licenseValid = isDocumentValid(vehicle.licenseExpiration);
                const docsOk = soatValid && licenseValid;
                return (
                  <article key={vehicle._id} className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {vehicle.brand} {vehicle.model}
                          {isActive && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Activo
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-slate-600">Placa: {vehicle.plate}</p>
                        <p className="text-sm text-slate-600">Capacidad: {vehicle.capacity} puestos</p>
                        <p className={`mt-2 text-xs font-medium ${docsOk ? "text-emerald-600" : "text-red-600"}`}>
                          Documentos {docsOk ? "vigentes" : "con vencimiento"}
                        </p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-500">
                          <li>SOAT vence: {vehicle.soatExpiration ? formatDateInput(vehicle.soatExpiration) : "Sin fecha"}</li>
                          <li>Licencia vence: {vehicle.licenseExpiration ? formatDateInput(vehicle.licenseExpiration) : "Sin fecha"}</li>
                          <li>Número de licencia: {vehicle.licenseNumber || "No registrado"}</li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            isActive
                              ? "border border-blue-200 bg-blue-50 text-blue-700"
                              : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                          }`}
                          onClick={() => handleActivate(vehicleId)}
                          disabled={isActive || activatingId === vehicleId || submitting}
                        >
                          {activatingId === vehicleId ? "Activando..." : isActive ? "Vehículo activo" : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          onClick={() => openEdit({ ...vehicle, _id: vehicleId })}
                          disabled={submitting}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
                          onClick={() => handleDelete(vehicleId)}
                          disabled={submitting}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {(vehicle.vehiclePhotoUrl || vehicle.soatPhotoUrl) && (
                      <div className="mt-4 grid gap-2 text-xs text-blue-600">
                        {vehicle.vehiclePhotoUrl && (
                          <a href={vehicle.vehiclePhotoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                            Ver foto del vehículo
                          </a>
                        )}
                        {vehicle.soatPhotoUrl && (
                          <a href={vehicle.soatPhotoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                            Ver SOAT
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <div className="mt-8 rounded-xl border border-white/60 bg-white/80 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {mode === "create" ? "Registrar nuevo vehículo" : "Editar vehículo"}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Placa *
                <input
                  type="text"
                  value={form.plate}
                  onChange={(event) => setForm((prev) => ({ ...prev, plate: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm uppercase"
                  disabled={submitting}
                />
              </label>
              <label className="text-sm text-slate-600">
                Capacidad (puestos) *
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={form.capacity}
                  onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Marca *
                <input
                  type="text"
                  value={form.brand}
                  onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
              <label className="text-sm text-slate-600">
                Modelo *
                <input
                  type="text"
                  value={form.model}
                  onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                SOAT vence *
                <input
                  type="date"
                  value={form.soatExpiration}
                  onChange={(event) => setForm((prev) => ({ ...prev, soatExpiration: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
              <label className="text-sm text-slate-600">
                Licencia vence *
                <input
                  type="date"
                  value={form.licenseExpiration}
                  onChange={(event) => setForm((prev) => ({ ...prev, licenseExpiration: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Número de licencia *
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </label>
              <label className="text-sm text-slate-600">
                URL foto del vehículo
                <input
                  type="url"
                  value={form.vehiclePhotoUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, vehiclePhotoUrl: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://"
                  disabled={submitting}
                />
              </label>
            </div>

            <label className="text-sm text-slate-600">
              URL SOAT
              <input
                type="url"
                value={form.soatPhotoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, soatPhotoUrl: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="https://"
                disabled={submitting}
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => resetToList()}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? "Guardando..." : mode === "create" ? "Registrar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
