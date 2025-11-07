import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function Dashboard() {
  const { user, loadingProfile, refreshProfile } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        await refreshProfile();
      } catch {
        /* best effort */
      }
      try {
        const [tripsRes, vehiclesRes] = await Promise.allSettled([
          api.get("/trips"),
          api.get("/vehicles")
        ]);
        if (ignore) return;
        if (tripsRes.status === "fulfilled") {
          setTrips(tripsRes.value?.data?.trips || []);
        } else {
          setTrips([]);
          setError("No se pudieron cargar los viajes disponibles");
        }
        if (vehiclesRes.status === "fulfilled") {
          setVehicles(Array.isArray(vehiclesRes.value?.data) ? vehiclesRes.value.data : []);
        } else {
          setVehicles([]);
        }
      } catch (err) {
        if (ignore) return;
        console.error("dashboard fetch", err);
        setError("Error cargando información");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (user && !loadingProfile) {
      fetchData();
    }
    return () => {
      ignore = true;
    };
  }, [user, loadingProfile, refreshProfile]);

  const userId = user?.id;
  const myDriverTrips = useMemo(
    () =>
      trips.filter((trip) => (trip.driver || "").toString() === (userId || "") && trip.status !== "cancelled"),
    [trips, userId]
  );

  const upcomingDriverTrips = useMemo(
    () =>
      myDriverTrips
        .map((trip) => ({ ...trip, departureDate: new Date(trip.departureAt) }))
        .filter((t) => !Number.isNaN(t.departureDate.getTime()) && t.departureDate >= new Date())
        .sort((a, b) => a.departureDate - b.departureDate)
        .slice(0, 3),
    [myDriverTrips]
  );

  const myReservations = useMemo(() => {
    if (!userId) return [];
    const items = [];
    for (const trip of trips) {
      if (!Array.isArray(trip.reservations)) continue;
      for (const reservation of trip.reservations) {
        if ((reservation?.passenger || "").toString() === userId) {
          items.push({ trip, reservation });
        }
      }
    }
    return items
      .filter(({ reservation }) => !["cancelled", "rejected"].includes(reservation.status))
      .map(({ trip, reservation }) => ({
        trip,
        reservation,
        departureDate: new Date(trip.departureAt)
      }))
      .sort((a, b) => a.departureDate - b.departureDate);
  }, [trips, userId]);

  const metrics = useMemo(() => {
    const base = [
      { label: "Viajes disponibles", value: trips.length },
  { label: "Mis reservas", value: myReservations.length }
    ];
    if ((user?.roles || []).includes("driver")) {
      base.push({ label: "Mis viajes publicados", value: myDriverTrips.length });
      base.push({ label: "Vehículos registrados", value: vehicles.length });
    }
    return base;
  }, [trips.length, myReservations.length, myDriverTrips.length, vehicles.length, user?.roles]);

  return (
    <section className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Hola, {user?.firstName || user?.email}</h1>
        <p className="text-sm text-slate-600">
          Gestiona tus viajes, reservas y vehículos desde este panel. La información se actualiza en tiempo real con el backend.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {(user?.roles || []).includes("driver") && (
          <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Próximos viajes como conductor</h2>
            {loading && upcomingDriverTrips.length === 0 ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : upcomingDriverTrips.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no tienes viajes programados. Crea uno desde la opción "Crear viaje".
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingDriverTrips.map((trip) => (
                  <li key={trip._id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{formatDateTime(trip.departureAt)}</p>
                        <h3 className="text-base font-medium text-slate-900">
                          {trip.origin} → {trip.destination}
                        </h3>
                        <p className="text-sm text-slate-500">{trip.routeDescription || "Ruta estándar"}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>Estado: {trip.status === "full" ? "Lleno" : "Programado"}</p>
                        <p>Cupos: {trip.seatsAvailable}/{trip.seatsTotal}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Mis reservas</h2>
          {loading && myReservations.length === 0 ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : myReservations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Cuando reserves un cupo verás el resumen aquí.
            </p>
          ) : (
            <ul className="space-y-3">
              {myReservations.slice(0, 4).map(({ trip, reservation }) => (
                <li
                  key={`${trip._id}-${reservation._id ?? reservation.pickupPoints?.[0]?.name ?? "pickup"}`}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{formatDateTime(trip.departureAt)}</p>
                      <h3 className="text-base font-medium text-slate-900">
                        {trip.origin} → {trip.destination}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Cupos reservados: <span className="font-medium">{reservation.seats}</span>
                      </p>
                      {reservation.pickupPoints?.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Punto de recogida: {reservation.pickupPoints[0].name}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-500 uppercase tracking-wide">
                      {reservation.status === "pending"
                        ? "Pendiente"
                        : reservation.status === "confirmed"
                        ? "Confirmada"
                        : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
