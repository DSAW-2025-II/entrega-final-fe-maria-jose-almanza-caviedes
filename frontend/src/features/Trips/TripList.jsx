import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";
import TransmilenioMap from "../../components/TransmilenioMap.jsx";

const initialFilters = {
  origin: "",
  destination: "",
  date: "",
  seats: ""
};

export default function TripList() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [reservationTrip, setReservationTrip] = useState(null);
  const [reservationForm, setReservationForm] = useState({ seats: 1, pickupPointIndex: 0, paymentMethod: "cash" });
  const [reservationError, setReservationError] = useState("");
  const [reservationSending, setReservationSending] = useState(false);
  const [customPickupEnabled, setCustomPickupEnabled] = useState(false);
  const [customPickup, setCustomPickup] = useState({ name: "", description: "", lat: "", lng: "" });

  useEffect(() => {
    let ignore = false;
    async function fetchTrips() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/trips");
        if (!ignore) {
          setTrips(Array.isArray(data?.trips) ? data.trips : []);
        }
      } catch (err) {
        console.error("trips list", err);
        if (!ignore) setError("No se pudieron cargar los viajes. Intenta nuevamente.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchTrips();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredTrips = useMemo(() => {
    const originFilter = filters.origin.trim().toLowerCase();
    const destinationFilter = filters.destination.trim().toLowerCase();
    const seatsFilter = Number(filters.seats);
    const dateFilter = filters.date ? new Date(filters.date) : null;
    return trips.filter((trip) => {
      const matchesOrigin = originFilter ? trip.origin.toLowerCase().includes(originFilter) : true;
      const matchesDestination = destinationFilter ? trip.destination.toLowerCase().includes(destinationFilter) : true;
      const matchesSeats = Number.isInteger(seatsFilter) && seatsFilter > 0 ? trip.seatsAvailable >= seatsFilter : true;
      const matchesDate = dateFilter ? new Date(trip.departureAt).toDateString() === dateFilter.toDateString() : true;
      return matchesOrigin && matchesDestination && matchesSeats && matchesDate;
    });
  }, [filters, trips]);

  function resetReservationState() {
    setReservationTrip(null);
    setReservationForm({ seats: 1, pickupPointIndex: 0, paymentMethod: "cash" });
    setReservationError("");
    setReservationSending(false);
    setCustomPickupEnabled(false);
    setCustomPickup({ name: "", description: "", lat: "", lng: "" });
  }

  async function handleReservationSubmit(event) {
    event.preventDefault();
    if (!reservationTrip) return;
    const seats = Number(reservationForm.seats);
    if (!Number.isInteger(seats) || seats < 1) {
      setReservationError("Selecciona una cantidad válida de puestos");
      return;
    }
    if (seats > reservationTrip.seatsAvailable) {
      setReservationError("No hay suficientes cupos disponibles");
      return;
    }
    let pickup;
    if (customPickupEnabled) {
      const name = customPickup.name.trim();
      const description = customPickup.description.trim();
      const lat = Number(customPickup.lat);
      const lng = Number(customPickup.lng);
      if (!name) {
        setReservationError("Describe el nuevo punto de recogida");
        return;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setReservationError("Selecciona coordenadas válidas en el mapa o ingrésalas manualmente");
        return;
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setReservationError("Las coordenadas están fuera del rango permitido");
        return;
      }
      pickup = { name, description: description || undefined, lat, lng };
    } else {
      pickup = availablePickupPoints[reservationForm.pickupPointIndex];
      if (!pickup) {
        setReservationError("Selecciona un punto de recogida");
        return;
      }
    }

    setReservationSending(true);
    setReservationError("");
    try {
      const payload = {
        seats,
        paymentMethod: reservationForm.paymentMethod,
        pickupPoints: Array.from({ length: seats }, () => ({
          name: pickup.name,
          description: pickup.description,
          lat: pickup.lat,
          lng: pickup.lng
        }))
      };
      const { data } = await api.post(`/trips/${reservationTrip._id}/reservations`, payload);
      let nextTrip = data?.trip || null;

      if (customPickupEnabled) {
        try {
          const suggestionRes = await api.post(`/trips/${reservationTrip._id}/pickup-suggestions`, pickup);
          if (suggestionRes.data?.trip) {
            nextTrip = suggestionRes.data.trip;
          }
        } catch (suggestionError) {
          console.error("pickup suggestion", suggestionError);
        }
      }

      if (nextTrip) {
        setTrips((prev) => prev.map((trip) => (trip._id === nextTrip._id ? nextTrip : trip)));
      }
      resetReservationState();
    } catch (err) {
      const message = err?.response?.data?.error || "No se pudo reservar el viaje";
      setReservationError(message);
      setReservationSending(false);
    }
  }

  const availablePickupPoints = reservationTrip?.pickupPoints?.filter((point) => point.status !== "rejected") || [];
  const selectedReservationPickup = !customPickupEnabled
    ? availablePickupPoints[reservationForm.pickupPointIndex] || null
    : null;
  const customPickupLat = Number(customPickup.lat);
  const customPickupLng = Number(customPickup.lng);
  const customPickupSelectedPoint =
    customPickupEnabled && Number.isFinite(customPickupLat) && Number.isFinite(customPickupLng)
      ? { lat: customPickupLat, lng: customPickupLng }
      : null;

  useEffect(() => {
    if (!reservationTrip) return;
    if (!availablePickupPoints.length) {
      if (reservationForm.pickupPointIndex !== 0) {
        setReservationForm((prev) => ({ ...prev, pickupPointIndex: 0 }));
      }
      return;
    }
    if (reservationForm.pickupPointIndex >= availablePickupPoints.length) {
      setReservationForm((prev) => ({ ...prev, pickupPointIndex: 0 }));
    }
  }, [availablePickupPoints.length, reservationForm.pickupPointIndex, reservationTrip]);

  return (
    <section className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Viajes disponibles</h1>
        <p className="text-sm text-slate-600">Filtra y reserva un cupo en las rutas activas de la comunidad.</p>
      </header>

      <form className="mb-6 grid gap-4 rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-slate-600">
          Origen
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Campus Puente del Común"
            value={filters.origin}
            onChange={(event) => setFilters((prev) => ({ ...prev, origin: event.target.value }))}
          />
        </label>
        <label className="text-sm text-slate-600">
          Destino
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Chía"
            value={filters.destination}
            onChange={(event) => setFilters((prev) => ({ ...prev, destination: event.target.value }))}
          />
        </label>
        <label className="text-sm text-slate-600">
          Fecha
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
          />
        </label>
        <label className="text-sm text-slate-600">
          Cupos mínimos
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={filters.seats}
            onChange={(event) => setFilters((prev) => ({ ...prev, seats: event.target.value }))}
          />
        </label>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando viajes...</p>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : filteredTrips.length === 0 ? (
        <p className="text-sm text-slate-500">No encontramos viajes que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTrips.map((trip) => {
            const departure = new Date(trip.departureAt);
            const displayDate = Number.isNaN(departure.getTime())
              ? trip.departureAt
              : departure.toLocaleString("es-CO", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
            const isOwner = user?.id && trip.driver?.toString() === user.id;
            const myReservation = user
              ? (trip.reservations || []).find((reservation) =>
                  (reservation.passenger || "").toString() === user.id &&
                  !["cancelled", "rejected"].includes(reservation.status)
                )
              : null;
            const myReservationStatus = myReservation?.status;
            return (
              <article key={trip._id} className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{displayDate}</p>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {trip.origin} → {trip.destination}
                    </h2>
                    {trip.routeDescription && (
                      <p className="text-sm text-slate-500">{trip.routeDescription}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Precio por puesto</p>
                    <p className="text-xl font-semibold text-slate-900">
                      ${trip.pricePerSeat?.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-slate-500">Cupos disponibles: {trip.seatsAvailable}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  {trip.distanceKm && (
                    <p>
                      Distancia estimada: <span className="font-medium">{trip.distanceKm} km</span>
                    </p>
                  )}
                  {trip.durationMinutes && (
                    <p>
                      Duración estimada: <span className="font-medium">{trip.durationMinutes} minutos</span>
                    </p>
                  )}
                  <p>
                    Estado: <span className="font-medium">{trip.status === "full" ? "Lleno" : trip.status}</span>
                  </p>
                </div>

                {trip.pickupPoints?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Puntos de recogida</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {trip.pickupPoints.map((pick, index) => (
                        <li key={`${trip._id}-pickup-${index}`}>
                          {(() => {
                            const latNum = Number(pick.lat);
                            const lngNum = Number(pick.lng);
                            const latDisplay = Number.isFinite(latNum) ? latNum.toFixed(4) : pick.lat;
                            const lngDisplay = Number.isFinite(lngNum) ? lngNum.toFixed(4) : pick.lng;
                            return `${pick.name} (${latDisplay}, ${lngDisplay})`;
                          })()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  {isOwner ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      Este viaje es tuyo
                    </span>
                  ) : myReservationStatus ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {myReservationStatus === "pending" ? "Reserva pendiente" : "Reserva confirmada"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                      disabled={trip.seatsAvailable === 0 || reservationSending}
                      onClick={() => {
                        setReservationTrip(trip);
                        setReservationForm({
                          seats: 1,
                          pickupPointIndex: 0,
                          paymentMethod: "cash"
                        });
                        setReservationError("");
                        const hasPickupPoints = Array.isArray(trip.pickupPoints) && trip.pickupPoints.length > 0;
                        setCustomPickupEnabled(!hasPickupPoints);
                        setCustomPickup({ name: "", description: "", lat: "", lng: "" });
                      }}
                    >
                      Reservar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {reservationTrip && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/60 bg-white p-6 shadow-lg">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Reservar viaje</h2>
              <p className="text-sm text-slate-600">
                {reservationTrip.origin} → {reservationTrip.destination} | {new Date(reservationTrip.departureAt).toLocaleString("es-CO")}
              </p>
            </header>
            {!availablePickupPoints.length && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                El conductor aún no ha definido puntos de recogida para este viaje. Selecciona uno en el mapa para sugerirlo al confirmar tu reserva.
              </div>
            )}

            <div className="mb-4 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={customPickupEnabled || !availablePickupPoints.length}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      const forceEnabled = !availablePickupPoints.length;
                      setCustomPickupEnabled(enabled || forceEnabled);
                      if (!enabled && !forceEnabled) {
                        setCustomPickup({ name: "", description: "", lat: "", lng: "" });
                      }
                      setReservationError("");
                    }}
                    disabled={!availablePickupPoints.length}
                  />
                  Sugerir un nuevo punto usando el mapa
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  {customPickupEnabled || !availablePickupPoints.length
                    ? "Haz clic en el mapa para fijar coordenadas y describe el punto para el conductor."
                    : "Puedes elegir uno de los puntos del conductor o activar la casilla para proponer uno nuevo."}
                </p>
              </div>

              <TransmilenioMap
                height={260}
                pickupPoints={availablePickupPoints}
                selectedPoint={customPickupEnabled ? customPickupSelectedPoint : selectedReservationPickup}
                onPickupSelect={(_point, index) => {
                  setCustomPickupEnabled(false);
                  setCustomPickup({ name: "", description: "", lat: "", lng: "" });
                  setReservationForm((prev) => ({ ...prev, pickupPointIndex: index }));
                }}
                onSelectPoint={
                  customPickupEnabled
                    ? ({ lat, lng }) =>
                        setCustomPickup((prev) => ({
                          ...prev,
                          lat: lat.toFixed(5),
                          lng: lng.toFixed(5)
                        }))
                    : undefined
                }
                interactive={customPickupEnabled}
              />
              <p className="text-xs text-slate-500">
                {customPickupEnabled
                  ? "Haz clic en el mapa para ajustar tu sugerencia. También puedes editar los campos manualmente."
                  : "Haz clic en un marcador verde para seleccionar el punto de recogida antes de confirmar tu reserva."}
              </p>
            </div>

            {(customPickupEnabled || !availablePickupPoints.length) && (
              <div className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
                <p className="text-sm font-medium text-slate-800">Describe el nuevo punto</p>
                <label className="block text-xs uppercase tracking-wide text-slate-500">
                  Nombre del punto *
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={customPickup.name}
                    onChange={(event) => setCustomPickup((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Portal Norte"
                  />
                </label>
                <label className="block text-xs uppercase tracking-wide text-slate-500">
                  Referencia o descripción
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={customPickup.description}
                    onChange={(event) => setCustomPickup((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Frente a la entrada principal"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-500">
                    Latitud *
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={customPickup.lat}
                      onChange={(event) => setCustomPickup((prev) => ({ ...prev, lat: event.target.value }))}
                      placeholder="4.76123"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wide text-slate-500">
                    Longitud *
                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={customPickup.lng}
                      onChange={(event) => setCustomPickup((prev) => ({ ...prev, lng: event.target.value }))}
                      placeholder="-74.04561"
                    />
                  </label>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleReservationSubmit}>
              <label className="block text-sm text-slate-600">
                Cantidad de cupos
                <input
                  type="number"
                  min={1}
                  max={reservationTrip.seatsAvailable}
                  value={reservationForm.seats}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, seats: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              {availablePickupPoints.length ? (
                <label className="block text-sm text-slate-600">
                  Punto de recogida del conductor
                  <select
                    value={reservationForm.pickupPointIndex}
                    onChange={(event) =>
                      setReservationForm((prev) => ({
                        ...prev,
                        pickupPointIndex: Number(event.target.value) || 0
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    disabled={customPickupEnabled}
                  >
                    {availablePickupPoints.map((pick, index) => (
                      <option key={`${reservationTrip._id}-pickup-option-${index}`} value={index}>
                        {pick.name}
                      </option>
                    ))}
                  </select>
                  {customPickupEnabled && (
                    <p className="mt-1 text-xs text-slate-500">Desactiva la sugerencia para volver a elegir un punto existente.</p>
                  )}
                </label>
              ) : null}

              <label className="block text-sm text-slate-600">
                Método de pago
                <select
                  value={reservationForm.paymentMethod}
                  onChange={(event) =>
                    setReservationForm((prev) => ({ ...prev, paymentMethod: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="cash">Efectivo</option>
                  <option value="nequi">Nequi</option>
                </select>
              </label>

              {reservationError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {reservationError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  onClick={resetReservationState}
                  disabled={reservationSending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={reservationSending}
                >
                  {reservationSending ? "Reservando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
