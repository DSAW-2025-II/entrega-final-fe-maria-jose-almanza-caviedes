import { useState } from "react";
import api from "../../utils/api";

// Nota: si la imagen existe en public/Designs se mostrará; si no, se ignora.
const hero = "/Designs/Add Pickup Points (Driver).png";

export default function AddPickupPointsDriver() {
  // Estado local para un punto de recogida de ejemplo
  const [point, setPoint] = useState({ name: "", lat: "", lng: "" });
  const [status, setStatus] = useState("");

  // Handler para enviar al backend (placeholder)
  const savePoint = async () => {
    setStatus("Guardando...");
    try {
      // Llamada a un endpoint futuro /vehicles/pickup-points (placeholder)
      await api.post("/vehicles/pickup-points", point);
      setStatus("Punto guardado");
    } catch {
      setStatus("Error al guardar");
    }
  };

  // Render principal del módulo
  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Add Pickup Points (Driver)</h1>
      <img src={hero} alt="Diseño base" className="rounded shadow max-w-xl" onError={(e)=>{e.currentTarget.style.display='none';}} />
      <p className="text-gray-600">
        Este componente permite a los conductores agregar y editar puntos de recogida.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-xl">
        <input className="border p-2 rounded" placeholder="Nombre"
          value={point.name} onChange={(e)=>setPoint({...point, name:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Latitud"
          value={point.lat} onChange={(e)=>setPoint({...point, lat:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Longitud"
          value={point.lng} onChange={(e)=>setPoint({...point, lng:e.target.value})}/>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-fit" onClick={savePoint}>
        Guardar punto
      </button>
      <span className="text-sm text-gray-500">{status}</span>
    </div>
  );
}
