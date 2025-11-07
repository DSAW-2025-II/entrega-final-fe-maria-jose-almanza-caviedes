# Carpeta de diseños (UI)

Coloca aquí los assets de diseño (PNG/JPG) que sirven de referencia visual para las features del frontend.

Convenciones:
- Nombres descriptivos y consistentes con los tickets:
  - Add Pickup Points (Driver).png
  - Calculate Distance (System).png
  - Auth - Login (Mobile).png
  - Auth - Register (Mobile).png
- Usa resolución razonable (ej. 1440px máximo de ancho) para evitar repos muy pesados.
- Si un asset es muy grande, considera subir una versión optimizada.

Uso en frontend:
- Para visualizar directamente en los componentes de referencia, duplica los archivos necesarios en:
  - frontend/public/Designs/ (mismos nombres)
- Los componentes pueden referenciar: `/Designs/<NombreDelArchivo>.png`

Ejemplo:
- Designs/Add Pickup Points (Driver).png
- frontend/public/Designs/Add Pickup Points (Driver).png

Nota:
- Esta carpeta es de referencia; los componentes usan la copia en frontend/public/Designs para ser servida por Vite.
