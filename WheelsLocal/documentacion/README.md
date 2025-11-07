# Carpeta de documentación del proyecto

Coloca aquí los documentos base del proyecto (planeación, tickets, criterios de aceptación, checklists).

Archivos esperados:
- Wheels Sabana - Planeacion.pdf
- WHEELS UNISABANA.pdf
- wheels-sabana.json  (checklists y prioridades)

Sugerencia de estructura:
- PDFs: documentación funcional (reglas de negocio, user stories).
- JSON: estructura para consolidar tickets y prioridades (consumible por tooling).
  - Ejemplo de campos:
    {
      "tickets": [
        {
          "id": "AUTH-001",
          "title": "Registro/Login institucional",
          "priority": "alta",
          "acceptance": ["Validación dominio", "JWT", "GET /auth/me"],
          "designRef": "Designs/Auth - Login (Mobile).png"
        }
      ]
    }

Cómo se usa:
- Esta carpeta es la fuente de verdad de negocio y UX.
- A partir de estos archivos se genera project-plan.json y las features en frontend/src/features/.
- Referencia cruzada con la carpeta /Designs para visualizar el mock en los componentes.

Nota:
- No subas datos sensibles (credenciales, llaves). Variables reales deben ir en backend/.env (ignorado en Git).
