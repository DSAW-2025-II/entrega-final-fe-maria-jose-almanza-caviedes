# Carpeta de documentación del proyecto

Coloca aquí los documentos base del proyecto (planeación, tickets, criterios de aceptación, checklists).

Archivos esperados:
- Wheels Sabana - Planeacion.pdf
- WHEELS UNISABANA.pdf
- wheels-sabana.json  (checklists y prioridades)
- api-contracts.md (contratos de integración por historia)
- backlog/roadmap en project-plan.json
- business-rules.md (reglas de negocio, flujos e integraciones)

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

## Nuevos entregables
- `api-contracts.md` consolida las secciones “API Contract” de cada historia con endpoint, método y payload.
- `project-plan.json` contiene todas las historias priorizadas con criterios de aceptación, checklists y referencias de contrato.
- Diseños de estados de error: exporta los PNG siguiendo `error_state_[form_name].png` y súbelos tanto a esta carpeta como a `Designs/` cuando estén listos.
- `business-rules.md` resume reglas de negocio, flujos, integraciones y requisitos no funcionales.

Nota:
- No subas datos sensibles (credenciales, llaves). Variables reales deben ir en backend/.env (ignorado en Git).
