# API Contracts – Wheels Sabana

Consolidated API contract per user story. Cada sección incluye endpoint(s), método(s) y la forma del payload solicitado en la corrección.

## Registration & Authentication

### Registration with University Email
- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Request Payload:**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "universityId": "string",
    "phone": "string",
    "email": "string",
    "password": "string",
    "role": "passenger" | "driver",
    "photoUrl": "string",
    "vehicle": {
      "plate": "string",
      "brand": "string",
      "model": "string",
      "capacity": number,
      "vehiclePhotoUrl": "string",
      "soatPhotoUrl": "string"
    }
  }
  ```
- **Response Payload (201):** `{ "user": { ... }, "vehicle": { ... } | null }`
- **Notes:** Rechazar correos que no sean `@unisabana.edu.co`. Contraseña siempre hasheada.

### Login with Credentials
- **Endpoint:** `/auth/login`
- **Method:** `POST`
- **Request Payload:** `{ "email": "string", "password": "string" }`
- **Response Payload (200):** `{ "token": "jwt", "user": { ... } }`
- **Notes:** Retornar 401 con mensaje amigable si las credenciales fallan.

### Logout
- **Endpoint:** `/auth/logout`
- **Method:** `POST`
- **Request Payload:** `{}`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Si existen refresh tokens deben invalidarse en backend.

### Password Recovery
- **Endpoint:** `/auth/forgot-password`
- **Method:** `POST`
- **Request Payload:** `{ "email": "string" }`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Siempre devolver OK para evitar enumeración de usuarios.
- **Endpoint:** `/auth/reset-password`
- **Method:** `POST`
- **Request Payload:** `{ "token": "string", "password": "string" }`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Token de un solo uso con expiración corta.

### View & Edit Profile
- **Endpoint:** `/users/me`
- **Method:** `GET`
- **Response Payload (200):** `{ "user": { ... }, "vehicle": { ... } | null }`
- **Endpoint:** `/users/me`
- **Method:** `PUT`
- **Request Payload:** `{ "firstName?": "string", "lastName?": "string", "phone?": "string", "photoUrl?": "string" }`
- **Response Payload (200):** `{ "user": { ... } }`
- **Notes:** El email institucional es inmutable.

### Validate Institutional Email (System Rule)
- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Notes:** Validación del dominio institucional en backend; retornar 400 con mensaje "Email no institucional".

## Vehicles & Driver Management

### Register Vehicle
- **Endpoint:** `/vehicles`
- **Method:** `POST`
- **Request Payload:** `{ "plate": "string", "brand": "string", "model": "string", "capacity": number, "vehiclePhotoUrl": "string", "soatPhotoUrl": "string", "licensePhotoUrl": "string" }`
- **Response Payload (201):** `{ "vehicle": { ... } }`
- **Notes:** Asociar vehículo al usuario autenticado y validar campos obligatorios.

### Switch between Passenger and Driver Roles
- **Endpoint:** `/users/role`
- **Method:** `PUT`
- **Request Payload:** `{ "role": "passenger" | "driver" }`
- **Response Payload (200):** `{ "user": { ... } }`
- **Notes:** Bloquear cambio a conductor si no existe vehículo válido.

### Manage Multiple Vehicles
- **Endpoint:** `/vehicles`
- **Method:** `GET`
- **Response Payload (200):** `[ { ...vehicle... } ]`
- **Endpoint:** `/vehicles/:id`
- **Method:** `PUT`
- **Request Payload:** `Partial vehicle fields`
- **Response Payload (200):** `{ "vehicle": { ... } }`
- **Endpoint:** `/vehicles/:id`
- **Method:** `DELETE`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Impedir eliminación si hay viajes activos asociados.

### Validate Vehicle Data
- **Endpoint:** `/vehicles/validate`
- **Method:** `POST`
- **Request Payload:** `{ "plate": "string", "capacity": number }`
- **Response Payload (200):** `{ "ok": true, "errors": [ ... ] }`
- **Notes:** Validar formato de placa y rango de capacidad.

### Validate Documents (SOAT & License)
- **Endpoint:** `/vehicles/documents/validate`
- **Method:** `POST`
- **Request Payload:** `{ "vehicleId": "string" }`
- **Response Payload (200):** `{ "ok": true, "expiresAt": "ISO", "errors": [ ... ] }`
- **Notes:** Bloquear creación de viajes cuando documentos estén vencidos.

## Trip Management

### Create Trip (Driver)
- **Endpoint:** `/trips`
- **Method:** `POST`
- **Request Payload:**
  ```json
  {
    "vehicleId": "string",
    "origin": "string",
    "destination": "string",
    "routeDescription": "string",
    "departureAt": "ISO",
    "seatsRequested": number,
    "pricePerSeat": number,
    "pickupPoints": [ { "name": "string", "description": "string", "lat": number, "lng": number } ],
    "distanceKm": number,
    "durationMinutes": number
  }
  ```
- **Response Payload (201):** `{ "trip": { ... } }`
- **Notes:** Validar capacidad y documentos del conductor.

### Add Pickup Points (Driver)
- **Endpoint:** `/trips/:id/pickups`
- **Method:** `POST`
- **Request Payload:** `{ "points": [ { "name": "string", "description": "string", "lat": number, "lng": number } ] }`
- **Response Payload (200):** `{ "trip": { ... } }`
- **Notes:** Usar `PUT` para reemplazar puntos existentes.

### Calculate Distance & Estimated Time (System)
- **Endpoint:** `/maps/calculate`
- **Method:** `POST`
- **Request Payload:**
  ```json
  {
    "origin": { "lat": number, "lng": number } | "string",
    "destination": { "lat": number, "lng": number } | "string",
    "mode": "driving" | "walking" | "bicycling" | "transit"
  }
  ```
- **Response Payload (200):**
  ```json
  {
    "distanceKm": number,
    "durationMinutes": number,
    "providerMeta": {
      "originAddress": "string",
      "destinationAddress": "string",
      "distanceText": "string",
      "durationText": "string",
      "status": "OK",
      "cacheHit": boolean,
      "mode": "string"
    }
  }
  ```
- **Notes:** Cachear resultados (Redis), propagar `cacheHit` en la respuesta y traducir límites de Google a HTTP 429.

### Suggest Tariff (System)
- **Endpoint:** `/trips/tariff/suggest`
- **Method:** `POST`
- **Request Payload:** `{ "distanceKm": number, "durationMinutes": number, "demandFactor": number }`
- **Response Payload (200):**
  ```json
  {
    "suggestedTariff": number,
    "range": { "min": number, "max": number },
    "breakdown": {
      "baseBoarding": number,
      "distanceComponent": number,
      "durationComponent": number,
      "demandFactor": number,
      "minimumFare": number
    }
  }
  ```
- **Notes:** Fórmula documentada, `demandFactor` se acota entre 0.5 y 2.0, conductor puede ajustar precio dentro del rango ±20%.

### View Available Trips (Passenger)
- **Endpoint:** `/trips`
- **Method:** `GET`
- **Query Params:** `departure_point`, `min_seats`, `max_price`, `start_time`, `end_time`, `page`, `pageSize`
- **Response Payload (200):** `{ "trips": [ { ... } ], "paging": { ... } }`
- **Notes:** Solo listar viajes con cupos disponibles salvo que se pida explícitamente.

### Reserve Seats (Passenger)
- **Endpoint:** `/reservations`
- **Method:** `POST`
- **Request Payload:** `{ "tripId": "string", "seats": number, "pickupPointId": "string", "paymentMethod": "cash" | "nequi" }`
- **Response Payload (201):** `{ "reservation": { ... }, "trip": { ... } }`
- **Notes:** Debe decrementar cupos de forma atómica y emitir notificaciones.

### Reserve Multiple Seats (Passenger)
- **Endpoint:** `/reservations`
- **Method:** `POST`
- **Request Payload:** `{ "tripId": "string", "seats": number, "pickupPoints": [ { "seat": number, "pickupPointId": "string" } ], "paymentMethod": "cash" | "nequi" }`
- **Response Payload (201):** `{ "reservation": { ... } }`
- **Notes:** Comparte endpoint con reserva simple, validar cantidad.

### Block Full Trips (System)
- **Endpoint:** `/trips/:id/status`
- **Method:** `PUT`
- **Request Payload:** `{ "status": "full" }`
- **Response Payload (200):** `{ "trip": { ... } }`
- **Notes:** Disparar evento para actualizar UI y notificar conductor.

### Driver Views Passenger List
- **Endpoint:** `/trips/:id/passengers`
- **Method:** `GET`
- **Response Payload (200):** `{ "passengers": [ { "passenger": { ... }, "seats": number, "pickupPoints": [ ... ], "paymentMethod": "string" } ] }`
- **Notes:** Solo disponible para el dueño del viaje.

## Search & Filters

### Filter by Departure Point
- **Endpoint:** `/trips`
- **Method:** `GET`
- **Query Param:** `departure_point`
- **Response Payload (200):** `{ "trips": [ { ... } ] }`
- **Notes:** Mostrar filtro activo en UI.

### Filter by Seats Available
- **Endpoint:** `/trips`
- **Method:** `GET`
- **Query Param:** `min_seats`
- **Response Payload (200):** `{ "trips": [ { ... } ] }`
- **Notes:** Solo viajes con cupos iguales o mayores al mínimo.

### Filter by Time Range
- **Endpoint:** `/trips`
- **Method:** `GET`
- **Query Params:** `start_time`, `end_time`
- **Response Payload (200):** `{ "trips": [ { ... } ] }`
- **Notes:** Usar formato ISO y manejar zona horaria.

### Filter by Maximum Price
- **Endpoint:** `/trips`
- **Method:** `GET`
- **Query Param:** `max_price`
- **Response Payload (200):** `{ "trips": [ { ... } ] }`
- **Notes:** Puede combinarse con paginación y ordenamientos.

## Notifications & Communication

### Trip Cancellation Notification (Driver cancels)
- **Endpoint:** `/trips/:id/cancel`
- **Method:** `PUT`
- **Request Payload:** `{ "reason": "string" }`
- **Response Payload (200):** `{ "trip": { ... } }`
- **Notes:** Debe disparar notificaciones push/email a pasajeros.

### Trip Time Change Notification
- **Endpoint:** `/trips/:id`
- **Method:** `PUT`
- **Request Payload:** `{ "departureAt": "ISO", ... }`
- **Response Payload (200):** `{ "trip": { ... } }`
- **Notes:** Detectar cambios en la hora para avisar a pasajeros.

### Notify Driver of New Reservation
- **Endpoint:** `/notifications/driver`
- **Method:** `POST`
- **Request Payload:** `{ "driverId": "string", "reservationId": "string" }`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Endpoint interno disparado cuando se crea una reserva.

### Passenger Cancels Reservation
- **Endpoint:** `/reservations/:id`
- **Method:** `DELETE`
- **Request Payload:** `{ "reason": "string" }`
- **Response Payload (200):** `{ "ok": true, "trip": { ... } }`
- **Notes:** Liberar cupos y notificar al conductor.

### Driver Cancels Trip
- **Endpoint:** `/trips/:id/cancel`
- **Method:** `PUT`
- **Request Payload:** `{ "reason": "string" }`
- **Response Payload (200):** `{ "trip": { ... } }`
- **Notes:** Marcar reservas como canceladas y bloquear nuevas reservas.

### Trip Reminder Notifications
- **Endpoint:** `/notifications/reminder`
- **Method:** `POST`
- **Request Payload:** `{ "tripId": "string", "sendAt": "ISO", "channel": "push" | "email" }`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Consumido por scheduler/worker para programar recordatorios.

## Ratings & Safety

### Rate Driver
- **Endpoint:** `/ratings/driver`
- **Method:** `POST`
- **Request Payload:** `{ "tripId": "string", "rating": number (1-5), "comments": "string" }`
- **Response Payload (201):** `{ "rating": { ... } }`
- **Notes:** Solo después de completar el viaje.

### Rate Passengers (Driver)
- **Endpoint:** `/ratings/passenger`
- **Method:** `POST`
- **Request Payload:** `{ "tripId": "string", "passengerId": "string", "rating": number, "comments": "string" }`
- **Response Payload (201):** `{ "rating": { ... } }`
- **Notes:** Una calificación por pasajero por viaje.

### Display Average Rating on Profiles
- **Endpoint:** `/ratings/average/:userId`
- **Method:** `GET`
- **Response Payload (200):** `{ "userId": "string", "averageRating": number, "votes": number }`
- **Notes:** Cachear resultado y actualizar al crear nueva calificación.

### Encrypt Passwords & Protect PII
- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Notes:** Garantiza que las contraseñas se almacenen hasheadas y que la respuesta no exponga PII sensible.

### System Availability (Uptime)
- **Endpoint:** `/health`
- **Method:** `GET`
- **Response Payload (200):** `{ "ok": true }`
- **Notes:** Usado por monitoreo para trackers de SLA.

## Payments (Future)

### Cash / Nequi Payment Option (Informational)
- **Endpoint:** `/reservations/:id/payment`
- **Method:** `PUT`
- **Request Payload:** `{ "paymentMethod": "cash" | "nequi" }`
- **Response Payload (200):** `{ "reservation": { ... } }`
- **Notes:** Solo registra el método de pago, no procesa transacciones.

### Driver Payment History (Manual)
- **Endpoint:** `/drivers/:id/payments`
- **Method:** `GET`
- **Query Params:** `from`, `to`, `paymentStatus`
- **Response Payload (200):** `{ "payments": [ { "reservationId": "string", "amount": number, "method": "cash" | "nequi", "received": boolean, "date": "ISO" } ] }`
- **Notes:** Requiere autenticación del conductor.

### Online Payments Integration (Future)
- **Endpoint:** `/payments/checkout`
- **Method:** `POST`
- **Request Payload:** `{ "provider": "nequi" | "mercadopago", "amount": number, "currency": "COP", "reservationId": "string", "returnUrl": "string" }`
- **Response Payload (200):** `{ "checkoutUrl": "string", "sessionId": "string" }`
- **Notes:** Preparado para integrar proveedor externo sin refactor mayor.

## Infra & Performance

### API Integrations (Maps, Waze, TransMilenio)
- **Endpoint:** `/integrations/maps`
- **Method:** `POST`
- **Request Payload:** `{ "origin": { "lat": number, "lng": number }, "destination": { "lat": number, "lng": number }, "mode": "driving" | "transit", "provider": "google" | "waze" }`
- **Response Payload (200):** `{ "routes": [ ... ], "eta": number, "provider": "string" }`
- **Endpoint:** `/integrations/transmilenio`
- **Method:** `GET`
- **Query Params:** `stopId`
- **Response Payload (200):** `{ "stops": [ ... ], "schedules": [ ... ] }`
- **Notes:** Manejar llaves de API y flujos de fallback.

### Real-time Updates & Sockets (Seat availability)
- **Endpoint:** `/socket.io`
- **Method:** `WebSocket / Event`
- **Events:**
  - `reservation:created` → `{ "tripId": "string", "seats": number }`
  - `reservation:cancelled` → `{ "tripId": "string", "seats": number }`
  - `trip:updated` → `{ "tripId": "string", "changes": { ... } }`
- **Notes:** Autenticar conexiones y sincronizar UI en tiempo real.

---

Este documento se debe mantener alineado con `project-plan.json` y con los contratos expuestos en Swagger/README.
