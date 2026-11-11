# Auditoría de recorridos de usuario · Agent Governance UI

**Versión revisada:** `main` del 11 de noviembre de 2026, antes de esta PR. **Unidad de análisis:** tareas completas desde la pantalla **Inicio**, no pantallas aisladas. **Fuentes normativas:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml) (fuente única), [`03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) y [`04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md).

## 1. Qué se probó y qué significa el resultado

Se diseñaron y ejecutaron **93 recorridos y variantes** mediante Chromium contra los módulos reales de la UI. Cada caso parte de Inicio; el navegador interactúa con botones, enlaces, campos o selectores, y después verifica ruta, contenido, estado o ausencia de la acción requerida. El inventario completo está en [la matriz](journey-matrix.md), los casos reproducibles en [`qa/journeys.json`](../qa/journeys.json) y las mediciones en [`qa/journey-results.json`](../qa/journey-results.json).

| Resultado | Recorridos | Interpretación |
| --- | ---: | --- |
| Funcional en el prototipo | **56** | El usuario termina la tarea visible. Los efectos son simulados y locales; no implican cumplimiento del backend. |
| Parcial | **6** | Hay una pantalla o acción inicial, pero falta una condición central del requisito. |
| Sin recorrido | **31** | El usuario llega al punto de trabajo, pero no dispone de una acción para completar la tarea. |

**Un test que confirma un recorrido ausente no aprueba el requisito.** La suite trata la ausencia como una brecha conocida, y obliga a actualizar el caso y probar su nuevo comportamiento cuando se implemente. Las 93 ejecuciones coinciden con la clasificación de partida; no equivalen a 93 requisitos satisfechos.

### Definición de «paso»

Una interacción deliberada cuenta como **un paso**: clic en enlace o botón, cambio de opción, escritura en un campo o envío de formulario. No se cuentan letras tecleadas, desplazamiento ni renderización. Todos los casos empiezan en `#/home`. Para una tarea incompleta se informa **pasos hasta el bloqueo**, nunca un número de pasos para terminarla. No se infieren tiempos ni esfuerzo cognitivo a partir del conteo.

| Tarea desde Inicio | Pasos observados | Resultado |
| --- | ---: | --- |
| Localizar un agente en Catálogo y abrir su ficha | 2 | Funcional (simulado) |
| Mostrar las tools que necesitan atención | 3 | Funcional (simulado) |
| **Revisar y aprobar una de esas tools** | **3 hasta el bloqueo** | **No existe** una ficha de revisión ni acciones de clasificación/aprobación |
| Cambiar un Preset con selección, aplicación y confirmación | 5 | Funcional (simulado) |
| Cancelar un cambio de Preset antes de guardar | 4 | Funcional (simulado) |
| Abrir la explicación de una decisión desde Activity | 2 | Funcional (simulado) |
| Aprobar una solicitud pendiente, cambiando a rol Approver | 4 | Funcional (simulado); identidad de revisor no autenticada |
| Rechazar la misma solicitud | 4 | Funcional (simulado) |
| Editar el presupuesto diario de un agente | 4 | Funcional **tras la corrección de esta PR** |
| Buscar un trace ID en Audit y abrir su explicación | 3 | Funcional (evento individual, sin ruta forense completa) |
| Llegar desde Catálogo a un detalle de evento | 3 | Parcial: **no** prueba evidencia inmutable |
| Abrir la guía de ejecución de tools del agente | 3 | Funcional (texto/ejemplo, no conexión efectiva) |

Los resultados se refieren a los agentes de muestra visibles en las primeras tarjetas; en un directorio de 100 agentes pueden ser necesarias búsqueda y carga progresiva adicionales. Esos pasos deben medirse por separado en pruebas con volumen.

## 2. Hallazgo principal: «Needs review» sin cierre operativo

`Catalog → Tools` informa estado de aprobación y manejo de ejecución, pero **no abre una ficha de tool**. En el código, `SEED_TOOLS` es un conjunto fijo; las filas no tienen `Review`, `Approve`, `Reject` ni `Edit supervision`, y no existe una acción que conserve la decisión administrativa. En consecuencia, el operador puede ver un problema sin resolverlo (INF-02, CON-07, HITL-01). Es un callejón sin salida funcional, no un asunto de color o copy.

### Recorrido objetivo propuesto: revisión de tool (máximo orientativo: 7 interacciones)

1. **Inicio → Catálogo**: entrar al inventario.
2. **Tools**: abrir la sección de herramientas.
3. **Needs action**: filtrar elementos pendientes de clasificación/aprobación (o buscar la tool directamente).
4. **Abrir tool**: ficha propia con nombre, agente, esquema de argumentos, versión, origen, clase **sugerida o confirmada**, estado, supervisión, ejecución por MCP o fuera de la puerta, uso reciente y cambios anteriores.
5. **Revisar clasificación y supervisión**: aceptar o corregir la clase y escoger `autónoma`, `notificar` o `requiere_aprobacion` según las reglas permitidas.
6. **Aprobar o rechazar**: ver un resumen del cambio y su consecuencia real según A/B/C, modo y Preset. Una tool local nunca debe aparecer como «ejecución protegida» solo por estar aprobada.
7. **Confirmar**: persistir clase/estado/supervisión versionados, registrar actor, anterior y nuevo, y volver al catálogo con el estado actualizado.

**Alternativas obligatorias:** cancelar sin escribir; rechazar la tool; clase incierta; tool destructiva; esquema modificado que requiere nueva revisión; tool descubierta en modo activo frente a descubrimiento; B ausente o parcialmente adoptado; C ausente si la regla depende de usuario; auditor de solo lectura; operación concurrente sobre una versión anterior; error al guardar y posibilidad de reintentar sin duplicar. La semántica de clases, aprobación inicial y supervisión sale de `03-politicas-y-estado-inicial.md` §§2–3 y de INF-02/HITL-01. Los pasos 4–7 son **propuesta de interacción**, no una pantalla ya implementada ni un número exigido literalmente por el YAML.

**No confundir con Approvals.** Aprobar una **tool del catálogo** significa permitir su uso bajo las reglas posteriores. Aprobar una **invocación concreta** significa liberar una solicitud MCP previamente retenida para ejecutar una sola operación; requiere revisor distinto y puede vencer (HITL-02/03, CON-05). Son dos objetos, permisos y evidencias diferentes.

## 3. Flujos que el producto necesita por área

La siguiente tabla sintetiza los **objetivos**; el desglose operativo y las variantes probadas están en la matriz. Las capacidades marcadas como pendientes no pueden acreditarse por tener una pantalla parecida.

| Área | Trabajo completo que debe permitir | Alternativas / bordes obligatorios | Estado |
| --- | --- | --- | --- |
| **Agentes** | Alta, completar campos, emitir token una vez, conectar, editar atributos, retirar | Duplicado; credencial inválida; rotar con solapamiento y revocar; sin responsable no pasar a activo | Alta de muestra; gestión de credenciales y edición real pendientes (REG-02) |
| **Catálogo de tools** | Descubrir schemas, confirmar clase, revisar/aprobar/rechazar, fijar supervisión, consultar cambios | Destructiva/sin clasificar; clase sugerida; esquema nuevo; tools fuera de B; permisos por rol | **Sin revisión operativa** (INF-02, CON-07, HITL-01) |
| **Modelos** | Consultar inventario, permitir/restringir por agente, editar tarifas | Modelo no permitido; actualizaciones de precio y reglas | Inventario fijo, sin edición (INF-03, CON-06) |
| **Connections** | Obtener credenciales reales A, registrar MCP targets por tool, configurar validación OIDC C y verificar tráfico | A, A+B, A+C, A+B+C; B parcial; token ausente/inválido; identidad solo_workload | Guías y toggles simulados; configuración real pendiente (OPS-01, MCP-01, IDN-01) |
| **Rules** | Inspeccionar Preset, comparar impactos, aplicar/descartar, activar, crear regla visual y Cedar versionado | Observe/Enforce; clase no aprobada; falta B/C; error sintáctico/tipo; conflictos y reversión | Cambio de Preset simulado; constructor y simulación histórica faltan (POL-04/05, REG-01) |
| **Activity** | Filtrar eventos en vivo por agente, usuario, decisión y canal; pausar sin perder eventos; abrir el porqué | Estado vacío; reconexión; alto volumen; huecos de evidencia | Filtros parciales y pausa de muestra; streaming, usuario/canal faltan (CON-03) |
| **Approvals** | Inspeccionar contexto y argumentos enmascarados; aprobar/rechazar con comentario; consultar resolución y vencimiento | Autoaprobación prohibida; expiración; aprobación duplicada; servicio caído; rol sin permiso | Aprobación local; revisión real y contexto incompletos (CON-05, HITL-02/03) |
| **Spending** | Consultar por agente/modelo/persona/período; configurar presupuesto, RPM, tokens, alertas, throttle/bloqueo y tarifas | Auditor sin edición; umbrales 50/80/100; sin C; gasto fuera del gateway | Presupuesto diario de muestra; límites y alertas faltan (CON-06, FIN-02/03) |
| **Audit** | Encontrar transacciones con filtros combinables; ruta forense completa; cambios administrativos; versión de regla; sello y prueba de retención | Regla modificada; herramienta fuera de puerta; evidencia ausente; intento de borrado denegado | Consulta de eventos individuales; correlación, historial y prueba S3 faltan (EVD-02/04/05/06) |
| **Workspace** | Roles, accesibilidad, estado vacío, configuración visual, reset y modo presentación | No mutar por exploración/cancelación; teclado; 1080p; pérdida de red | UI parcial; modo presentación pendiente (CON-01/02/08) |

### Reglas transversales

- Toda tarea administrativa necesita **objeto explícito** (agente/tool), confirmación para acciones sensibles, resultado verificable e historial con actor, antes y después (EVD-04). En la muestra las decisiones administrativas no se incorporan a Audit.
- El estado de una conexión **no prueba cobertura completa**: B se evalúa por tool y C por solicitud. La aprobación de catálogo no equivale a autorización de ejecución; A ve la intención del modelo pero no detiene una ejecución local fuera de B.
- La interfaz puede mostrar solo los comandos del rol correspondiente, pero la seguridad final exige 403 de API (CON-01). El selector `View as` es un recurso de la muestra, no una identidad autenticada.
- En conjuntos grandes, la lista acotada sin paginación/cursor del servidor no demuestra latencia, consistencia ni búsqueda exhaustiva. El contrato debe incluir búsqueda por identificador estable, filtros combinables, permisos y paginación.
- Un evento con `trace_id` individual no es una ruta forense: se necesitan identificadores de correlación de inferencias, tool_calls, ejecuciones y aprobaciones (INF-04, EVD-05), además de sello S3 real (EVD-06).

## 4. Defectos y brechas priorizadas

| Prioridad | Hallazgo | Evidencia | Criterio de cierre |
| --- | --- | --- | --- |
| **P0** | **Tool marcada «Needs review» sin ficha ni revisión ejecutable** | Casos `C-11` a `C-15`; `SEED_TOOLS` fijo | Revisar/confirmar clase, aprobar/rechazar y supervisar; guardar con auditoría y alternativas por modo/rol |
| **P0** | No existe constructor visual ni editor de reglas por parámetros | `R-08`, `R-09`, POL-04 | Crear regla `denegar si p > 10`, validar esquema, probar p=8/p=25 y versionar |
| **P0** | No hay ruta forense de una transacción completa ni prueba de evidencia | `E-03` a `E-06`; EVD-02/04/05/06 | Consulta combinable, correlación y sello S3 verificable; demostrar rechazo de borrado |
| **P0** | Autenticación y separación de funciones solo simuladas | `H-05`, `I-06`, CON-01/HITL-03 | Identity provider real, 403 por rol y por autoaprobación, auditoría del rechazo |
| **P1** | Gestión de credenciales y configuración real de agentes ausente | `C-06` a `C-09`, `I-07` | Alta completa, token una vez, rotación y revocación verificadas |
| **P1** | Approvals carece de argumentos, enlace de trace, comentario y vencimiento real | `H-06` a `H-08` | Vistas y temporizadores desde backend, resolución atómica y prueba de expiración |
| **P1** | Límites sin RPM/tokens/acciones ni alertas por umbral; no hay tarifas | `S-05`, `S-06`, `S-08` | Controles de FIN-02/03 y CON-06 con pruebas de bloqueo/throttle/alerta |
| **P1** | Activity no implementa streaming, filtros de usuario/canal ni pausa con buffer probado | `V-04` a `V-06` | Publicación p95 de eventos y reanudación sin pérdida con dataset real |
| **P1** | Connections muestra configuración simulada aunque las tools locales siguen fuera de B | `I-03`, `I-05`, `I-06` | Registro/validación de destinos y estado medido por tool/solicitud |
| **P1** | `POL-05` pide impacto calculado contra evidencia; actualmente solo se describe el Preset candidato | `R-10` | Reevaluar contextos históricos y presentar recuento y ejemplos de decisiones modificadas |
| **P1** | **El formulario de límite diario enviaba el documento en vez de guardar** | Prueba real `S-02`; colisión de `HTMLFormElement.id` con `input[name=id]` | **Corregido en esta PR:** obtener ID con `getAttribute('id')`; repetir guardar y cancelar desde Inicio |
| **P2** | No hay modo presentación real | `G-05` | Tipografía/contraste y estados de 1080p de CON-08 |

### Desviación de producto que no se debe ocultar

El usuario pidió explícitamente **no presentar un índice porcentual de cobertura**, sino estados operativos de catálogo. `CON-04` todavía exige formalmente un índice calculado y `OPS-01` lo referencia. Esto **no** se marca como cumplido. Requiere modificar el criterio de aceptación en la fuente normativa o decidir una ubicación diagnóstica secundaria. No altera las demás obligaciones de B/C por tool/solicitud.

## 5. Reproducción y límites de las pruebas

```bash
npm run check
npm run build
python -m pip install playwright==1.57.0
python -m playwright install chromium
python qa/run_journeys.py
python qa/generate_matrix.py
```

El job de **Quality checks** ejecuta las 93 rutas en Chromium, falla si una ruta esperada deja de funcionar o si un hueco cambia sin actualizar su caso, y comprueba la consistencia del informe generado. En entornos restringidos se cargan los mismos módulos JS/CSS en una página inline sin solicitudes de red; no se alteran los handlers ni los datos, salvo un accessor de inspección de estado en la suite. El código se contrasta además con `tests/journey-audit.test.mjs`.

**No verificado por este repositorio:** AWS/CDK, OIDC real, Cedar, MCP, token de producción, evidencia S3 Object Lock, OTLP, latencias p95, RBAC de API, concurrencia distribuida, accesibilidad WCAG completa y funcionamiento de un agente real. Esas pruebas corresponden al backend y a la integración; sus contratos se encuentran en `requisitos.yaml`. Los resultados de la UI no los sustituyen.
