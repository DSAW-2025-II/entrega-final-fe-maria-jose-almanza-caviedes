import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingTripId, setPendingTripId] = useState("");
  const [passengerModal, setPassengerModal] = useState({ open: false, passengers: [], trip: null });
  const [pendingReservationId, setPendingReservationId] = useState("");

  const userId = user?.id;
  const isDriver = useMemo(() => (user?.roles || []).includes("driver"), [user?.roles]);

  useEffect(() => {
    let ignore = false;
    async function fetchTrips() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/trips");
        if (!ignore) setTrips(Array.isArray(data?.trips) ? data.trips : []);
      } catch (err) {
        console.error("reservations fetch", err);
        if (!ignore) setError("No se pudieron cargar las reservas");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchTrips();
    return () => {
      ignore = true;
    };
  }, []);

  const myReservations = useMemo(() => {
    if (!userId) return [];
    const items = [];
    for (const trip of trips) {
      if (!Array.isArray(trip.reservations)) continue;
      for (const reservation of trip.reservations) {
        if ((reservation.passenger || "").toString() === userId) {
          items.push({ trip, reservation });
        }
      }
    }
    return items
      .filter(({ reservation }) => !["cancelled", "rejected"].includes(reservation.status))
      .sort((a, b) => new Date(a.trip.departureAt) - new Date(b.trip.departureAt));
  }, [trips, userId]);

  const myDriverTrips = useMemo(() => {
    if (!isDriver || !userId) return [];
    return trips.filter((trip) => (trip.driver || "").toString() === userId);
  }, [trips, userId, isDriver]);

  async function cancelTrip(tripId) {
    setPendingTripId(tripId);
    setActionError("");
    try {
      const { data } = await api.put(`/trips/${tripId}/cancel`);
      if (data?.trip) {
        setTrips((prev) => prev.map((trip) => (trip._id === tripId ? data.trip : trip)));
      }
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo cancelar el viaje";
      setActionError(message);
    } finally {
      setPendingTripId("");
    }
  }

  async function cancelReservation(tripId, reservationId) {
    setPendingReservationId(`${tripId}-${reservationId}`);
    setActionError("");
    try {
      const { data } = await api.put(`/trips/${tripId}/reservations/${reservationId}/cancel`);
      if (data?.trip) {
        setTrips((prev) => prev.map((trip) => (trip._id === tripId ? data.trip : trip)));
      }
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo cancelar la reserva";
      setActionError(message);
    } finally {
      setPendingReservationId("");
    }
  }

  async function loadPassengers(trip) {
    setPendingTripId(trip._id);
    setActionError("");
    try {
      const { data } = await api.get(`/trips/${trip._id}/passengers`);
      setPassengerModal({ open: true, passengers: data?.passengers || [], trip });
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudieron cargar los pasajeros";
      setActionError(message);
    } finally {
      setPendingTripId("");
    }
  }

  async function updateReservationStatus({ tripId, reservationId, action }) {
    setPendingReservationId(`${tripId}-${reservationId}`);
    setActionError("");
    try {
      const endpoint =
        action === "confirm"
          ? `/trips/${tripId}/reservations/${reservationId}/confirm`
          : `/trips/${tripId}/reservations/${reservationId}/reject`;
      const { data } = await api.put(endpoint);
      if (data?.trip) {
        setTrips((prev) => prev.map((trip) => (trip._id === tripId ? data.trip : trip)));
        if (passengerModal.open && passengerModal.trip?._id === tripId) {
          const passengersResponse = await api.get(`/trips/${tripId}/passengers`);
          setPassengerModal({
            open: true,
            passengers: passengersResponse.data?.passengers || [],
            trip: data.trip
          });
        }
      }
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo actualizar la reserva";
      setActionError(message);
    } finally {
      setPendingReservationId("");
    }
  }

  return (
    <section className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Mis reservas</h1>
        <p className="text-sm text-slate-600">Consulta tus cupos confirmados y el estado de tus viajes.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Reservas como pasajero</h2>
            {myReservations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Aún no tienes reservas activas.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {myReservations.map(({ trip, reservation }) => (
                  <li key={`${trip._id}-${reservation._id}`} className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500">{formatDate(trip.departureAt)}</p>
                        <h3 className="text-base font-semibold text-slate-900">
                          {trip.origin} → {trip.destination}
                        </h3>
                        <p className="mt-1 text-sm">
                          Cupos reservados: <span className="font-medium">{reservation.seats}</span>
                        </p>
                        {reservation.pickupPoints?.length > 0 && (
                          <p className="text-xs text-slate-500">
                            Punto de recogida: {reservation.pickupPoints[0].name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {reservation.status === "pending"
                            ? "Pendiente"
                            : reservation.status === "confirmed"
                            ? "Confirmada"
                            : ""}
                        </span>
                        {!["cancelled", "rejected"].includes(reservation.status) && (
                          <button
                            type="button"
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
                            onClick={() => cancelReservation(trip._id, reservation._id)}
                            disabled={pendingReservationId === `${trip._id}-${reservation._id}`}
                          >
                            {pendingReservationId === `${trip._id}-${reservation._id}` ? "Cancelando..." : "Cancelar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isDriver && (
            <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Viajes publicados</h2>
              {myDriverTrips.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Aún no has publicado viajes.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {myDriverTrips.map((trip) => (
                    <li key={trip._id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-500">{formatDate(trip.departureAt)}</p>
                          <h3 className="text-base font-semibold text-slate-900">
                            {trip.origin} → {trip.destination}
                          </h3>
                          <p className="mt-1 text-sm">
                            Cupos disponibles: <span className="font-medium">{trip.seatsAvailable}</span>
                          </p>
                          <p className="text-xs text-slate-500">Estado actual: {trip.status}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            onClick={() => loadPassengers(trip)}
                            disabled={pendingTripId === trip._id}
                          >
                            Ver pasajeros
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:bg-red-100"
                            onClick={() => cancelTrip(trip._id)}
                            disabled={trip.status === "cancelled" || pendingTripId === trip._id}
                          >
                            {pendingTripId === trip._id ? "Actualizando..." : "Cancelar viaje"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {actionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      {passengerModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/60 bg-white p-6 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pasajeros confirmados</h2>
                <p className="text-sm text-slate-600">
                  {passengerModal.trip.origin} → {passengerModal.trip.destination} · {formatDate(passengerModal.trip.departureAt)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setPassengerModal({ open: false, passengers: [], trip: null })}
              >
                Cerrar
              </button>
            </header>

            {passengerModal.passengers.length === 0 ? (
              <p className="text-sm text-slate-500">No hay pasajeros confirmados aún.</p>
            ) : (
              <ul className="space-y-3 text-sm text-slate-600">
                {passengerModal.passengers.map((item, index) => (
                  <li key={item.id || item.passenger?._id || index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-medium text-slate-900">
                      {item.passenger?.firstName} {item.passenger?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{item.passenger?.email} · {item.passenger?.phone}</p>
                    <p className="mt-1 text-sm">
                      Cupos: <span className="font-medium">{item.seats}</span> · Pago: {item.paymentMethod === "nequi" ? "Nequi" : "Efectivo"}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Estado: {item.status === "pending" ? "Pendiente" : item.status === "confirmed" ? "Confirmada" : item.status === "rejected" ? "Rechazada" : "Cancelada"}
                    </p>
                    {item.pickupPoints?.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Punto de recogida: {item.pickupPoints[0].name}
                      </p>
                    )}
                    {item.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                          onClick={() =>
                            updateReservationStatus({
                              tripId: passengerModal.trip._id,
                              reservationId: item.id,
                              action: "confirm"
                            })
                          }
                          disabled={pendingReservationId === `${passengerModal.trip._id}-${item.id}`}
                        >
                          {pendingReservationId === `${passengerModal.trip._id}-${item.id}` ? "Procesando..." : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:bg-red-100"
                          onClick={() =>
                            updateReservationStatus({
                              tripId: passengerModal.trip._id,
                              reservationId: item.id,
                              action: "reject"
                            })
                          }
                          disabled={pendingReservationId === `${passengerModal.trip._id}-${item.id}`}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
