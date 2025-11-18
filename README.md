[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/jRa9bpsE)
# Entrega final DSAW:

## Nombre estudiante 1: María José Almanza Caviedes

# Wheels Sabana

## BackEnd: https://wheels-unisabana-2.onrender.com/api-docs/
## FrontEnd: https://wheels-unisabana-2-frontend.vercel.app/
## DataBase: https://cloud.mongodb.com/v2/690d48668e20073984e8eaec#/metrics/replicaSet/690d494f41a0ef38cc01aba4/explorer/wheels/users/find
## Repo: https://github.com/Majo7-613/Wheels-Unisabana-2.git


Plataforma de movilidad universitaria: React + Node + Express + MongoDB + Redis.

## Flujo principal (según reglas y tickets)
1) Autenticación institucional (registro/login con correo @unisabana.edu.co).
2) Configuración del conductor: vehículo y puntos de recogida.
3) Publicación de viajes y reservas (decremento atómico de cupos).
4) Cálculo de distancia/ETA (Google Distance Matrix con caché).
5) Navegación (Waze deep link) y calificaciones.

Autenticación primero: un usuario no autenticado solo debe ver Login/Registro; el resto de rutas son protegidas.

## Requisitos
- Node 18+
- Docker (opcional para MongoDB y Redis)
- PowerShell (Windows) para ejecutar script

## Estructura (resumen)
- frontend: Vite + Tailwind + Router + Tests
- backend: Express + Mongoose + Redis + Swagger + Jest/Supertest

## Endpoints principales (backend)
- Auth:
  - POST /auth/register
  - POST /auth/login
  - GET /auth/me  (Bearer <JWT>)
- Vehículos:
  - CRUD /vehicles
  - POST /vehicles/pickup-points
- Trips:
  - CRUD /trips
  - POST /trips/:id/reservations  (decremento cupos)
  - POST /trips/:id/pickup-suggestions  (pasajeros proponen nuevos puntos de recogida)
- Integraciones:
  - GET /maps/distance?origin=..&destination=..  (OpenRouteService)
  - GET /maps/transmilenio/routes                (GeoJSON de trazados oficiales)
  - GET /maps/transmilenio/stations              (GeoJSON de estaciones oficiales)
  - GET /navigation/waze?lat=..&lng=..           (deep link)
- Swagger: http://localhost:4000/api-docs
- Health: /health


# Reglas
- Recuerde subir su código antes del 17 de noviembre de 2025, 11:59PM
- No se adminten entregas tardías
- Si la entrega final no está desplegada, no se califica
- Si hay modificaciones luego de la fecha establecida, no se calificará la parte técnica

  
