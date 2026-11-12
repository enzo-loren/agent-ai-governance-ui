# Auditoría integral de experiencia y modelo de datos · 11 noviembre 2026

**Objeto:** interfaz de `agent-ai-governance-ui` después de PR #10. Esta revisión confronta los recorridos desde Inicio, el código de simulación, los datos iniciales y el YAML normativo `insumo/requisitos.yaml` de `agentic-ai-governance-platform`. Se distingue una acción navegable de la garantía técnica exigida por un requisito.

## Evaluación desde la tarea del cliente

Un cliente espera que una misma operación conserve el agente, tenga un resultado que se refleje en otras pantallas y permita retroceder sin perder el contexto. La revisión no considera suficiente que haya un botón o que un test solo compruebe texto. Se examinaron Home, Catalog (Agents/Tools/People/Models), Agent details, Connections, Rules, Activity, Approvals, Spending y Audit; se incluyeron las variantes de rol, cancelación, conexiones A/B/C y múltiples agentes.

**Hallazgo transversal:** la UI era una mezcla de datos de fixture, decisiones calculadas en `domain.js`, mutaciones directas en `app.js` y formularios en `operations.js`. `localStorage` actuaba a la vez como «base de datos» y como mecanismo de sincronización, sin versión. Esto permitió varios problemas de coherencia y promovió descripciones redundantes para explicar que cada pantalla era una demostración.

### Hallazgos y tratamiento

| ID | Severidad | Evidencia observada | Efecto para el cliente | Tratamiento en esta PR | Requisito |
| --- | --- | --- | --- | --- | --- |
| D01 | Alta | Un borrador de Cedar se guardaba mediante `addRule` como regla de tipo `Any` y sin condición ejecutable. | Una condición sobre `amount > 10` podía afectar solicitudes que no la cumplían. | **Corregido:** `cedarDrafts` se guarda aparte; no cambia `state.rules` ni las decisiones. | POL-04 |
| D02 | Alta | La traza `TRC-1044` afirmaba que Atlas *estaba* en Observe mientras el agente inicial estaba en Enforce. | El usuario interpretaba incorrectamente decisiones históricas usando la configuración actual. | **Corregido:** el registro declara `modeAtEvent=observe`; el modo actual es independiente. | EVD-05, CON-02 |
| D03 | Alta | La aprobación `APR-202` apuntaba a `TRC-1033`, ausente del fixture. | Desde una aprobación no se podía explicar la solicitud de origen. | **Corregido:** fixture de la solicitud anterior y reparación selectiva al migrar v2. | CON-05, EVD-05 |
| D04 | Alta | Un evento de ejecución de tool almacenaba USD positivos como si fuera inferencia. | Podía confundirse el cargo del modelo con el resultado de ejecutar una tool. | **Corregido en fixtures nuevos:** coste cero para eventos solo de ejecución MCP. | FIN-01 |
| D05 | Alta | `appendScenario` añadía inferencias sin actualizar los totales `agent.requests` y `agent.spent`. | Overview, Spending y Activity se contradecían después de «Test request». | **Corregido para solicitudes nuevas:** incrementa volumen y coste en la misma mutación. | FIN-01, CON-06 |
| D06 | Media | Los filtros de Spending → Activity / Audit vivían únicamente en `ui`, fuera de la URL. | Al compartir o recargar una ruta se perdía la persona, el modelo o la traza. | **Corregido:** parámetros de ruta y pruebas de recuperación/limpieza. | CON-06, EVD-02 |
| D07 | Media | `localStorage` no tenía contrato de lectura/escritura ni control de revisiones. | Dos pestañas podían sobrescribir configuraciones sin aviso. | **Corregido para el demo:** `createMockBackend` entrega snapshots, versiones y rechaza escrituras obsoletas. | Consistencia de UX; no sustituye CON-01 |
| D08 | Alta | La UI ofrecía un falso `403 AccessDenied` como ejemplo de prueba S3. | Podía interpretarse como evidencia material de retención. | **Corregido:** muestra `Not verified` y `Unavailable`, sin rechazo inventado. | EVD-06 |
| D09 | Media | «Connected» se usaba para campos OIDC/MCP almacenados, sin comprobación del destino. | Daba a entender que un control estaba conectado y verificándose. | **Corregido editorialmente:** `Configured` separa la configuración de una comprobación real. | IDN-01, MCP-01 |
| D10 | Media | El simulador de nuevas solicitudes tenía tarifa fija y no usaba las tarifas editables. | Cambiar el precio de un modelo no afectaba la siguiente solicitud. | **Corregido:** nuevos costes se calculan desde el catálogo de tarifas y tokens del escenario; no reescribe el histórico. | FIN-01 |
| D11 | Media | Los actores, las acciones de los agentes y el supuesto token aparecían en código de presentación. | Cada pantalla podía divergir de los datos iniciales. | **Corregido:** `src/mock/fixtures.js`, con roles, escenarios, catálogos y credencial no enrutable. | Consistencia de UX |
| D12 | Media | «Today» se mostraba junto a agregados precargados sin calendario continuo. | La fecha y el alcance del gasto resultaban ambiguos fuera del día del fixture. | **Corregido en vistas principales:** «reporting period» y fecha fuente asociada al fixture. | CON-06 |
| D13 | Alta | La UI ofrecía «throttle / block» configurables, pero no había limitador temporal ni HTTP 429/403. | Un operador podría esperar bloqueo real después de guardar el límite. | **Pendiente del backend**; se eliminó cualquier frase de aplicación efectiva en la UI. | FIN-02, FIN-03 |
| D14 | Alta | El selector «View as» cambia el rol dentro del mismo cliente. | No es autenticación ni autorización de API; puede modificarse desde DevTools. | **Pendiente del backend**. El único distintivo de entorno ahora es «Demo». | CON-01, HITL-03 |
| D15 | Alta | Una conexión se representa como toggle/configuración, no como un servidor MCP/JWKS comprobado. | No demuestra intercepción ni atribución de identidad válidas. | **Pendiente del backend**. La UI evita afirmar «verificado». | MCP-01, IDN-01 |
| D16 | Alta | El timeline agrupa por agente y acción, no por identificadores causales de transacción. | No es reconstrucción forense de todos los pasos. | **Pendiente del backend**; el detalle ya señala «transaction ID needed». | EVD-05 |
| D17 | Alta | Hay una ventana de expiración representada, sin reloj o expiración autoritativa. | La aprobación podría parecer pendiente indefinidamente. | **Pendiente del backend**; no se presenta como cuenta regresiva real. | HITL-02, CON-05 |
| D18 | Alta | El consumo agregado inicial proviene de fixtures sin un ledger completo de cada solicitud. | El detalle reciente no suma exactamente el total de período. | **Pendiente de datos transaccionales**. Se presenta como histórico parcial, sin fabricar movimientos. | FIN-01, FIN-03 |
| D19 | Media | El volumen de DOM está limitado, pero no hay consultas paginadas de servidor. | Escalar a miles de agentes o flujos requiere un API de búsqueda/paginación. | **Pendiente del backend**; no equivale a cumplimiento de SLO. | CON-03, EVD-02 |
| D20 | Normativa | `CON-04` sigue exigiendo índice ponderado pese a la decisión explícita de omitirlo. | Riesgo de interpretar una decisión de UX como cambio aprobado del requisito. | **Desviación abierta**, sin modificar YAML ni inventar aprobación. | CON-04 |

## Arquitectura aplicada al prototipo

`src/mock/fixtures.js` → `src/domain.js` (lógica y reglas simplificadas) → `src/mock/backend.js` (snapshots/versiones/almacenamiento) → `src/app.js` (navegación y eventos) → `src/views.js` y `src/operations.js` (presentación).

Es un **adaptador in-browser**, compatible con GitHub Pages; no un servidor. Por eso no proporciona control de acceso confiable, persistencia multiusuario, validación OIDC/JWKS, Cedar oficial, MCP, SSE, retención S3 ni límites de tasa. El contrato se documenta en [`mock-backend-contract.md`](mock-backend-contract.md). La respuesta de la UI solo utiliza la etiqueta global discreta **Demo**; los estados técnicos conservan la información indispensable (`Outside gateway`, `Not verified`, `Draft`, etc.).

### Qué debe comprobarse cuando haya un backend real

- Los cambios se confirman mediante API con rol autenticado y auditoría durable; una selección nunca aplica una política por accidente.
- Una tool detectada por inferencia aparece sin necesidad de un botón que «descubre» datos, y el cambio de esquema invalida aprobaciones anteriores.
- Aprobaciones incluyen solicitante verificable, plazo real, argumentos enmascarados y rechazo autoritativo de autoaprobación.
- Costes por modelo, agente y usuario cuadran con la suma de solicitudes facturables, manteniendo la versión de tarifa vigente en cada evento.
- Los enlaces desde Spending conservan filtros y muestran un subconjunto coherente con el período solicitado.
- Retención, identidad, bloqueo MCP y límites no se anuncian como verificados sin una respuesta verificable de servicios externos.

## Método y pruebas

Se conservaron **124 recorridos de Chromium** desde Inicio con sus alternativas, pero el cambio de texto no se considera un cambio de capacidad. La clasificación de la matriz anterior sigue siendo **104 recorridos operativos dentro de la simulación** y **20 parciales por garantías externas**. Esto no equivale a 104 requisitos cumplidos. Se añadieron tests de contrato de almacenamiento/versionado, coherencia de fixtures, aislamiento Cedar, coste agregado y deep links, además de una suite de navegador específica para el adaptador. La compilación estática verifica que `src/mock/` se incluya en `dist`.

**Límite de esta auditoría:** no hay investigación con usuarios reales, tests de carga del backend ni API AWS desplegada. Las propuestas de diseño son decisiones de producto; los requisitos citados tienen autoridad independiente en `insumo/requisitos.yaml`.
