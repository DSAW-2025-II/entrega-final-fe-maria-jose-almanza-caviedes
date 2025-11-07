# Roadmap de Implementación y Validación

## Roadmap de Implementación

### Ola 1 – Autenticación y Perfil (Semana 1)
- Backend: consolidar `/auth/register`, `/auth/login`, `/auth/me`, validación de dominio y hash seguro.
- Frontend: formularios de registro/login, ProtectedRoute, manejo de errores (desktop/mobile).
- UX: pantallas de registro/login + estados de error entregados en Figma.
- QA: unit tests de validación y e2e básico (registro/login feliz).

### Ola 2 – Vehículos y Roles (Semana 2)
- Backend: `/vehicles` CRUD, validaciones, `/users/role`, verificación de documentos.
- Frontend: gestión de vehículos, toggle de roles, alertas por documentos vencidos.
- UX: formularios de vehículo y estados de error.
- QA: pruebas unitarias de validadores y flujos de integración (Supertest).

### Ola 3 – Viajes y Reservas (Semanas 3–4)
- Backend: `/trips`, cálculo de ruta `/maps/calculate`, `/reservations`, control de cupos, sockets iniciales.
- Frontend: creación de viaje, listado, filtros básicos, reserva de cupos.
- Infra: configurar Redis + caching para distancia/tarifa.
- QA: pruebas de concurrencia, escenarios de múltiples reservas, coverage de sockets.

### Ola 4 – Notificaciones y Calificaciones (Semanas 5–6)
- Backend: eventos de cancelación, recordatorios, calificaciones drivers/pasajeros.
- Frontend: UI de notificaciones, dashboards de conductor, componentes de rating.
- Ops: integrar proveedor de correo/push y monitoreo de colas.
- QA: pruebas de workers/schedulers, validación de notificaciones en ambientes de staging.

### Ola 5 – Pagos (futuro) e Infra avanzada (Post-MVP)
- Preparar `/payments/checkout`, historial de pagos, integración a proveedores.
- Optimizar tiempos de carga (<2s), responsive completo, monitoreo SLA 99%.
- Explorar despliegue en Cloud Run/ECS con autoscaling.

## Plan de Validación y Pruebas

### Cobertura Automatizada
- **Unit Tests:** validar reglas de dominio (emails, placas, cálculos de tarifa, expiración de documentos).
- **Integration/API Tests:** Supertest para `/auth`, `/vehicles`, `/trips`, `/reservations`, asegurando respuestas según contratos.
- **Socket Tests:** validar eventos `reservation:created`, `reservation:cancelled`, `trip:updated` usando clientes mock.

### QA Manual / E2E
- **Flujo MVP:** registro → login → registrar vehículo → crear viaje → reservar → cancelar.
- **Errores UI:** validar cada formulario con datos inválidos y revisar feedback visual.
- **Multi-dispositivo:** prueba responsive en breakpoints móvil/tablet/desktop.

### Observabilidad
- Configurar dashboard de uptime (Prometheus/Grafana o equivalente).
- Alertas de colas retrasadas (notificaciones y recordatorios).
- Logs estructurados con correlación por `requestId`.

### Criterios de Aceptación para Releases
- Contratos en `api-contracts.md` alineados con Swagger.
- Sin regresiones en suite de tests (CI verde).
- Checklist por ticket completado en `project-plan.json`.
