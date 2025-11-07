# Wheels Sabana – Reglas de Negocio y Contexto Operativo

## Visión General
- Plataforma de carpooling universitario enfocada en la comunidad de la Universidad de La Sabana.
- Permite coordinar viajes compartidos seguros entre estudiantes con rutas predefinidas hacia/desde el campus.
- Objetivos clave: reducir costos individuales, optimizar ocupación vehicular, disminuir huella ambiental y ofrecer una alternativa confiable a servicios tradicionales como Uber o buses privados.

## Flujo Funcional Resumido
1. **Registro e inicio de sesión**
   - Solo admite correos institucionales `@unisabana.edu.co`.
   - Permite recuperación de contraseña y cierre de sesión seguro.
2. **Gestión de perfil y roles**
   - El usuario es pasajero por defecto.
   - Para activar el modo conductor debe registrar al menos un vehículo válido.
3. **Definición de rutas fijas (PRs)**
   - Rutas preconfiguradas por la institución (ej. Bogotá Norte → Sabana, Chía → Sabana, Cajicá → Sabana).
   - Incluyen puntos de recogida oficiales (Puente Madera, Ad Portas, etc.).
4. **Publicación de viajes (Conductor)**
   - Selecciona ruta, puntos de recogida, horario, vehículo y tarifa.
   - Puede lanzar navegación en Waze o Google Maps.
5. **Reserva de cupos (Pasajero)**
   - Selecciona viaje disponible, punto de recogida y cupos (individual o múltiples).
   - Recibe confirmación/estado de la reserva.
6. **Viaje en curso y seguimiento**
   - Notificaciones cuando el conductor está cerca.
   - Opcional: tracking en tiempo real vía Socket.IO/Firebase.
7. **Pagos fuera de la app**
   - Pasajero acuerda pago en efectivo o Nequi directamente con el conductor.
8. **Cierre y retroalimentación**
   - Pasajero y conductor se califican mutuamente.
   - Se conserva historial de viajes y pagos manuales.

## Integraciones Clave
- **Google Maps Platform**: geocoding, autocompletado, Distance Matrix, Directions y visualización de rutas.
- **Waze Deep Links / Transport SDK**: navegación en tiempo real con tráfico actualizado.
- **TransMilenio (datos abiertos Bogotá)**: paraderos y rutas oficiales para viajes multimodales.
- **Firebase** (opcional): autenticación, notificaciones push y sincronización en tiempo real.
- **Socket.IO** (opcional con MongoDB): actualizaciones instantáneas de cupos, cancelaciones y tracking.
- **Nequi / Daviplata APIs** (futuro): registro de pagos digitales.
- **Twilio / WhatsApp API** (opcional): mensajería de emergencia o confirmaciones.
- **Weather / IDEAM** (opcional): contexto climático en ruta.

## Modelo de Datos (Colecciones principales)
- **Usuarios**: información básica, rol dinámico (pasajero/conductor), método de pago preferido, contacto de emergencia.
- **Vehículos**: placa única, marca, modelo, capacidad, fotos, fechas de SOAT/licencia y relación con el conductor.
- **Viajes**: conductor, vehículo, ruta fija, puntos de recogida, horario, tarifa, cupos disponibles, estado.
- **Reservas**: pasajero, viaje, cupos reservados, puntos de recogida, estado, método de pago elegido.
- **Calificaciones** (opcional): referencias cruzadas entre viajes, conductores y pasajeros.

> Nota: para MVP se recomiendan colecciones en MongoDB Atlas o Firebase Firestore; ambas soportan consultas geoespaciales y sincronización en tiempo real.

## Reglas de Negocio (Resumen)
1. **Usuarios y Roles**
   - Registro estrictamente con email institucional y código universitario.
   - Todos los usuarios son pasajeros por defecto.
   - Conductores deben tener al menos un vehículo registrado con documentos vigentes.
   - No se permite desempeñar ambos roles en un mismo viaje.
2. **Vehículos**
   - Placa única, capacidad mínima 1 pasajero adicional, SOAT vigente obligatorio.
   - El conductor puede registrar múltiples vehículos pero solo usar uno por viaje activo.
3. **Viajes y Rutas**
   - Deben adherirse a rutas pautadas con puntos de recogida predefinidos.
   - Horario fijo; no se puede crear un viaje en el pasado ni modificar la hora tras publicación.
   - Un conductor no puede tener dos viajes activos simultáneamente.
   - Capacidad del viaje ≤ capacidad del vehículo.
4. **Reservas**
   - Un pasajero puede reservar múltiples cupos (para acompañantes).
   - Cada cupo debe asociarse a un punto de recogida.
   - Estados: pendiente, confirmada, rechazada, cancelada.
   - Cancelaciones liberan cupos y deben notificar al conductor.
5. **Tarifas**
   - Fórmula sugerida: tarifa base + costo_por_km * distancia + costo_por_minuto * duración.
   - El conductor puede ajustar dentro de un rango permitido (p. ej., ±20 %).
   - Historial de pagos manuales (efectivo/Nequi) se almacena con la reserva.
6. **Notificaciones**
   - Eventos clave: creación/confirmación de reserva, viaje lleno, cancelaciones, cambios de horario, recordatorios 30–60 minutos antes, llegada cercana.
   - Canales: push, email institucional y opcionalmente SMS/WhatsApp.
7. **Seguridad y Confianza**
   - Perfiles públicos con nombre, foto y calificación promedio.
   - Calificaciones bidireccionales; comentarios moderables.
   - Usuarios con baja reputación pueden ser bloqueados.
8. **Puntos de acceso universitarios**
   - Puente Madera y Ad Portas con coordenadas predefinidas.
   - Viajes y filtros deben indicar explícitamente el punto de salida/entrada.

## Requisitos No Funcionales
- **Usabilidad**: UI responsiva (320px a 1920px), accesibilidad básica (contraste, etiquetas ARIA), componentes reutilizables.
- **Rendimiento**: LCP < 2.5 s (objetivo 1.5 s), TTI < 2 s, endpoints críticos con mediana < 500 ms. Uso de SSR (Next.js), lazy load de mapas, CDN y caching (Redis).
- **Escalabilidad & Disponibilidad**: Arquitectura stateless, autoscaling cloud (Cloud Run/ECS/GKE), replicas de base de datos, health checks, circuit breakers, DR plan con RTO < 2 h, SLA ≥ 99 %.
- **Seguridad**: HTTPS/TLS obligatorio, contraseñas con bcrypt/Argon2, rate limiting en endpoints sensibles, WAF básico, logs de auditoría, backups diarios, cumplimiento de Habeas Data.
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Edge, Safari), mobile web iOS/Android, tolerancia a fallos de APIs externas.
- **Observabilidad**: Logging estructurado, métricas (Prometheus/Grafana), error tracking (Sentry), synthetic monitoring, pruebas regulares de carga (k6/JMeter).
- **CI/CD**: Pipelines automáticos con pruebas unitarias, integración, e2e (Cypress/Playwright) y despliegues canary/blue-green.

## Historias de Usuario (Resumen)
- 43 historias agrupadas en 8 epics (Registro, Vehículos, Viajes, Búsqueda, Notificaciones, Reputación, Pagos futuros, Infraestructura).
- Cada historia tiene criterios de aceptación, checklist y contrato de API documentados en `project-plan.json` y `api-contracts.md`.

## Arquitectura Recomendada
- **Frontend**: React + Next.js (SSR/ISR), TypeScript, Tailwind, PWA opcional.
- **Backend**: Node.js (NestJS/Express) o Python (FastAPI) con Swagger/OpenAPI.
- **Base de datos**: PostgreSQL (transaccional) o MongoDB/Firestore (flexible y tiempo real) + Redis (cache/locks).
- **Autenticación**: Firebase Auth, Auth0, o implementación JWT own + verificación de dominio institucional.
- **Infra**: AWS/GCP con CDN (CloudFront/Cloudflare), storage de objetos para fotos/documentos, colas para notificaciones.

## Artefactos Relacionados
- `project-plan.json` : backlog completo con epics, historias y contratos.
- `api-contracts.md` : contratos de integración por historia.
- `roadmap.md` : plan de entregas y validación.
- `Designs/` : lineamientos de UI y estados de error (formato `error_state_[form_name].png`).

---
Este documento centraliza las reglas de negocio y el contexto funcional para asegurar que el desarrollo, la UX y la infraestructura avancen alineados con los objetivos de Wheels Sabana.
