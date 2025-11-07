# Carpeta de diseños (UI)

Coloca aquí los assets de diseño (PNG/JPG) que sirven de referencia visual para las features del frontend.

Convenciones:
- Nombres descriptivos y consistentes con los tickets:
  - Add Pickup Points (Driver).png
  - Calculate Distance (System).png
  - Auth - Login (Mobile).png
  - Auth - Register (Mobile).png
  - error_state_registration.png
  - error_state_trip_reservation_mobile.png
- Usa resolución razonable (ej. 1440px máximo de ancho) para evitar repos muy pesados.
- Si un asset es muy grande, considera subir una versión optimizada.
- Para estados de error requeridos (Registro, Login, Password Recovery, Registro de Vehículo, Creación de Viaje, Reserva de Cupos) exporta versiones Desktop y Mobile siguiendo el formato `error_state_[form_name].png`.

Uso en frontend:
- Para visualizar directamente en los componentes de referencia, duplica los archivos necesarios en:
  - frontend/public/Designs/ (mismos nombres)
- Los componentes pueden referenciar: `/Designs/<NombreDelArchivo>.png`

Ejemplo:
- Designs/Add Pickup Points (Driver).png
- frontend/public/Designs/Add Pickup Points (Driver).png

Nota:
- Esta carpeta es de referencia; los componentes usan la copia en frontend/public/Designs para ser servida por Vite.
