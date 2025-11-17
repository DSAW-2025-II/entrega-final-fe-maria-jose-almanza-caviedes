# TransMilenio ArcGIS Viewer

Aplicación Vite + Leaflet que consume los servicios públicos de ArcGIS para dibujar rutas troncales y estaciones de TransMilenio en un mapa interactivo.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Ejecución en desarrollo

```bash
npm run dev
```

La app estará disponible en http://localhost:5173.

## Comandos disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo de Vite |
| `npm run build` | Genera la versión optimizada para producción |
| `npm run preview` | Sirve la build resultante para verificación |

## Fuentes de datos

- Rutas: `consulta_trazados_troncales` (GeoJSON)
- Estaciones: `consulta_estaciones_troncales` (GeoJSON)

Los endpoints se configuran en `src/main.js` y pueden actualizarse según necesites.

## Personalización

- Edita `src/style.css` para ajustar el layout.
- Ajusta los estilos de capas dentro de `createRoutesLayer` y `createStationsLayer` en `src/main.js`.
- Agrega más capas duplicando el patrón `fetchGeoJson` + `L.geoJSON`.
