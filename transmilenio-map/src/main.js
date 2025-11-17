import L from "leaflet";

const ROUTES_URL =
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";
const STATIONS_URL =
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";

const statusEl = document.getElementById("status");
const reloadButton = document.getElementById("reload");

const map = L.map("map", {
  zoomControl: true,
  minZoom: 11,
  maxZoom: 18
}).setView([4.65, -74.08], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let routesLayer;
let stationsLayer;

function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#f87171" : "#38bdf8";
}

async function fetchGeoJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    if (!data || !data.features) {
      throw new Error("Respuesta GeoJSON inválida");
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function createRoutesLayer(geojson) {
  return L.geoJSON(geojson, {
    style: () => ({
      color: "#22d3ee",
      weight: 3,
      opacity: 0.75
    }),
    onEachFeature: (feature, layer) => {
      const { linea, sentido } = feature.properties || {};
      const title = [linea, sentido].filter(Boolean).join(" · ") || "Ruta troncal";
      layer.bindPopup(`<strong>${title}</strong>`);
    }
  });
}

function createStationsLayer(geojson) {
  return L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 6,
        fillColor: "#f43f5e",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      }),
    onEachFeature: (feature, layer) => {
      const {
        nombre_estacion: name,
        localidad,
        servicios_principales: services
      } = feature.properties || {};
      const html = `
        <div class="station-popup">
          <p class="station-label">${name ?? "Estación"}</p>
          ${localidad ? `<p>Localidad: ${localidad}</p>` : ""}
          ${services ? `<p>Servicios: ${services}</p>` : ""}
        </div>
      `;
      layer.bindPopup(html);
    }
  });
}

async function loadLayers() {
  reloadButton.disabled = true;
  updateStatus("Cargando capas...");

  try {
    const [routesGeoJson, stationsGeoJson] = await Promise.all([
      fetchGeoJson(ROUTES_URL),
      fetchGeoJson(STATIONS_URL)
    ]);

    if (routesLayer) {
      routesLayer.removeFrom(map);
    }
    if (stationsLayer) {
      stationsLayer.removeFrom(map);
    }

    routesLayer = createRoutesLayer(routesGeoJson).addTo(map);
    stationsLayer = createStationsLayer(stationsGeoJson).addTo(map);

    const group = L.featureGroup([routesLayer, stationsLayer]);
    map.fitBounds(group.getBounds(), { padding: [40, 40] });
    updateStatus(`Última carga: ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error("TransMilenio layers", error);
    updateStatus(`Error al cargar datos: ${error.message}`, true);
  } finally {
    reloadButton.disabled = false;
  }
}

reloadButton.addEventListener("click", () => {
  loadLayers();
});

loadLayers();
