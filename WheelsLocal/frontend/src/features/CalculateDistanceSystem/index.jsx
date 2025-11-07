import { useState } from "react";
import api from "../../utils/api";
const hero = "/Designs/Calculate Distance (System).png";

export default function CalculateDistanceSystem() {
  // Inputs de origen/destino
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const calculate = async () => {
    setStatus("Calculando...");
    try {
      const { data } = await api.get("/maps/distance", {
        params: { origin, destination }
      });
      setResult(data);
      setStatus("OK");
    } catch {
      setStatus("Error");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Calculate Distance (System)</h1>
      <img src={hero} alt="Diseño base" className="rounded shadow max-w-xl" onError={(e)=>{e.currentTarget.style.display='none';}} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl">
        <input className="border p-2 rounded" placeholder="Origen (dir o lat,lng)"
          value={origin} onChange={(e)=>setOrigin(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Destino (dir o lat,lng)"
          value={destination} onChange={(e)=>setDestination(e.target.value)} />
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded w-fit" onClick={calculate}>
        Calcular
      </button>
      {status && <span className="text-sm text-gray-500">{status}</span>}
      {result && (
        <pre className="bg-gray-100 p-3 rounded max-w-xl overflow-auto text-sm">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
