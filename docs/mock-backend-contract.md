# Contrato de datos de demostración

El sitio publicado con GitHub Pages sigue siendo estático. El «backend simulado» no abre un servidor; separa los datos de origen del renderizado y ofrece un contrato reproducible de lectura/escritura que luego podrá reemplazarse por transporte HTTP.

## Límites de los módulos

| Módulo | Responsabilidad |
| --- | --- |
| `src/mock/fixtures.js` | Agentes, tools, personas, trazas, aprobaciones y escenarios iniciales, todos sintéticos; valores de token no enrutables |
| `src/data.js` | Navegación, presets y descripciones generales de la UI; exportaciones de compatibilidad para tests anteriores |
| `src/domain.js` | Cálculo del estado y decisiones de la simulación: A/B/C, revisión de tool, regla de parámetros, gasto de inferencia |
| `src/mock/backend.js` | `read()` y `save(state, revision)`; instantáneas independientes, esquema de almacenamiento v3, migración desde v2 y rechazo de escrituras de revisión obsoleta |
| `src/router.js` | Enlaces reproducibles que conservan `agent`, `person`, `model` y `trace` |
| `src/app.js` | Entrada de eventos, estado transitorio y coordinación de guardados; no conoce claves de `localStorage` ni contiene fixtures de escenarios |
| `src/views.js` y `src/operations.js` | Presentación del estado y formularios; sin almacenamiento directo |

## Operaciones de almacenamiento

```js
const backend = createMockBackend();
let {state, revision} = backend.read();
// Solo al confirmar una acción válida:
({state, revision} = backend.save(state, revision));
```

`read` clona los datos; `save` valida relaciones básicas, clona de nuevo, incrementa versión y rechaza `expectedRevision` anticuado cuando detecta un guardado previo. Esta comprobación es de mejor esfuerzo: la secuencia lectura-escritura sobre `localStorage` no es atómica y **no garantiza aislamiento de transacciones** si dos pestañas escriben simultáneamente. `MemoryStorage` permite tests y sesiones sin almacenamiento disponible. Una sesión previa con `agent-governance-preview-v2` conserva cambios y repara únicamente vínculos conocidos de fixtures; el nuevo formato se almacena en `agent-governance-mock-v3`.

Esto **no** equivale a transacciones servidoras seguras: la lógica de simulación y la autorización de roles siguen en el navegador y un usuario puede manipular sus datos locales. El módulo es deliberadamente sustituible, no una demostración de seguridad del backend de la plataforma.

## Reglas de integridad de la demostración

1. Un borrador Cedar se guarda en `cedarDrafts` con estado `draft`; no se transforma en una regla general ejecutable ni se publica.
2. Los eventos de tool registran coste de inferencia cero. Un nuevo evento de inferencia calcula coste según tarifa configurable y uso de tokens del escenario; incrementa el total de solicitudes y gasto del agente.
3. Las trazas históricas mantienen su contexto del momento; cambiar una conexión no reescribe eventos antiguos.
4. Los vínculos de aprobaciones iniciales resuelven a trazas existentes; no se fabrican pruebas inmutables ni respuestas `403 AccessDenied`.
5. Los enlaces de investigación llevan filtros en la URL para que una navegación compartida pueda recuperar su estado.
6. La UI solo muestra el distintivo global «Demo». No repite advertencias de prototipo en cada formulario, pero las condiciones semánticas importantes siguen siendo visibles: conexión configurada ≠ conexión verificada; borrador ≠ regla aplicada; evento ≠ evidencia inmutable.

## Migración posterior a API de producción

El siguiente paso arquitectónico no es esconder aún más el mock, sino sustituirlo por un cliente HTTP versionado. Ese cliente debe recuperar catálogos paginados, editar operaciones por recurso con ETags/`If-Match`, ejecutar comandos con autorización por sesión, emitir decisiones y métricas del gateway, y suministrar pruebas de evidencia. Solo después puede retirarse el distintivo «Demo». Hasta entonces la experiencia ilustra el producto, no el cumplimiento de los controles AWS.
