import { useMemo, useState } from "react";
import api from "../../utils/api";

const hero = "/Designs/Calculate Distance (System).png";
const MODES = [
  { label: "Conduciendo", value: "driving" },
  { label: "Caminando", value: "walking" },
  { label: "Bicicleta", value: "bicycling" }
];

function parseCoordinate(input, label) {
  if (!input) throw new Error(`Ingresa coordenadas para ${label}`);
  const trimmed = input.trim();
  if (!trimmed) throw new Error(`Ingresa coordenadas para ${label}`);
  const parts = trimmed.split(",");
  if (parts.length !== 2) {
    throw new Error(`Usa formato lat,lng para ${label}`);
  }
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Coordenadas inválidas para ${label}`);
  }
  return { lat, lng };
}

export default function CalculateDistanceSystem() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("driving");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const cacheLabel = useMemo(() => {
    if (!result?.providerMeta) return "";
    return result.providerMeta.cacheHit ? "(desde caché)" : "(solicitud en vivo)";
  }, [result?.providerMeta]);

  const calculate = async () => {
    setError("");
    setFeedback("");
    if (!origin.trim() || !destination.trim()) {
      setError("Ingresa origen y destino para calcular la ruta");
      return;
    }

    let parsedOrigin;
    let parsedDestination;

    try {
      parsedOrigin = parseCoordinate(origin, "el origen");
      parsedDestination = parseCoordinate(destination, "el destino");
    } catch (coordinateError) {
      setLoading(false);
      setError(coordinateError.message);
      return;
    }

    const payload = {
      origin: parsedOrigin,
      destination: parsedDestination,
      mode
    };

    setLoading(true);
    try {
      const { data } = await api.post("/maps/calculate", payload);
      setResult(data);
      setFeedback("Distancia estimada actualizada");
    } catch (err) {
      const message = err?.response?.data?.error || "No pudimos calcular la distancia. Intenta más tarde.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Calculate Distance (System)</h1>
      <img
        src={hero}
        alt="Diseño base"
        className="max-w-xl rounded shadow"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />

      {error && (
        <div className="max-w-xl rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {feedback && (
        <div className="max-w-xl rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      )}

      <div className="grid max-w-xl gap-3 md:grid-cols-2">
        <input
          className="rounded border border-slate-200 p-2"
          placeholder="Origen (lat,lng ej: 4.65,-74.05)"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
        />
        <input
          className="rounded border border-slate-200 p-2"
          placeholder="Destino (lat,lng ej: 4.86,-74.03)"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        />
        <select
          className="rounded border border-slate-200 p-2 text-sm md:col-span-2 md:w-fit"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          {MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="w-fit rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
        onClick={calculate}
        disabled={loading}
      >
        {loading ? "Calculando..." : "Calcular"}
      </button>

      {result && (
        <section className="max-w-xl space-y-2 rounded border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
          <header className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Resultado</h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">{cacheLabel}</span>
          </header>
          <p>
            <span className="font-medium">Distancia:</span> {result.distanceKm} km
          </p>
          <p>
            <span className="font-medium">Duración:</span> {result.durationMinutes} minutos
          </p>
          {result.providerMeta?.origin && (
            <p>
              <span className="font-medium">Origen:</span> {result.providerMeta.origin.lat},{" "}
              {result.providerMeta.origin.lng}
            </p>
          )}
          {result.providerMeta?.destination && (
            <p>
              <span className="font-medium">Destino:</span> {result.providerMeta.destination.lat},{" "}
              {result.providerMeta.destination.lng}
            </p>
          )}
          {result.providerMeta?.provider && (
            <p className="text-xs text-slate-500">
              Fuente: {result.providerMeta.provider} · Perfil {result.providerMeta.profile}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
