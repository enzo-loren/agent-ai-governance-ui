# Trazabilidad de la UI de referencia

**Autoridad:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml) del proyecto de plataforma, más los contextos [`03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) y [`04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md). Esta tabla describe **interacciones representadas en una UI estática**, no cumplimiento del backend.

| Función de la consola | Requisitos de origen | Interfaz presente | Límite principal |
| --- | --- | --- | --- |
| Alta y configuración de agentes | REG-01/02/03, INF-03 | Catalog, Agent details; edición, modos, modelos permitidos, retiro y ejemplo de credencial | No hay token real, API ni IAM; cambios en localStorage |
| Catálogo de herramientas | INF-02, CON-07, HITL-01 | Tools → ficha → revisión, clasificación, aprobación/rechazo, supervisión, cambio de esquema e historial | Sin autodetección ni ejecución MCP real |
| Conexión de modelos | INF-01, OPS-01 | Agent → Connections; guía y ejemplo de configuración | No hay proxy de inferencia ni secret real |
| Conexión de herramientas | MCP-01, OPS-01 | Agent → Connections → destinos por herramienta; catálogo por ruta | No se verifica conexión a servidores MCP |
| Propagación de identidad | IDN-01, OPS-01 | Ajustes OIDC de ejemplo y actores identificados/sin identidad | No se valida JWT; C se mide por solicitud en el backend futuro |
| Políticas y reglas | POL-01/03/04/05, CON-07 | Rules → previsualizar, confirmar, constructor y editor de muestra; comparación de parámetros | El editor no interpreta Cedar completo y la estimación histórica no reevalúa evidencia |
| Actividad y decisiones | CON-02/03, INF-04 | Activity → filtros, muestra, pausa, explicación | Sin flujo real ni métricas de latencia/correlación |
| Supervisión de ejecuciones | CON-05, HITL-01/02/03 | Approvals → contexto de ejemplo, comentario, decisión, vencimiento ilustrativo | No hay identidad autenticada, timeout de servidor ni ejecución retenida |
| Consumo y límites | FIN-01/02/03, CON-06 | Spending → detalle por agente, rutas a Activity/Audit, límites, alertas, tarifas y gasto por modelo/persona | Sin facturación ni aplicación real de límites |
| Auditoría y evidencia | EVD-01/02/03/04/05/06 | Audit → filtros combinados, historial administrativo, detalle y línea de tiempo de ejemplo | No hay evidencia inmutable ni prueba S3 real |
| Roles, apariencia y presentación | CON-01/02/08 | Roles de vista, paletas, navegación responsive y presentación | Los roles visuales no son autorización de API |

## Fronteras conceptuales que se conservan

- **Model requests** (A): controla la ruta de inferencia y observa declaraciones de herramientas; no intercepta automáticamente su ejecución local.
- **Tool execution** (B): se aplica **por herramienta** y solo si su invocación pasa realmente por el gateway. Aprobar una herramienta en Catalog no demuestra que B esté activo.
- **User identity** (C): se evalúa **por solicitud** con token válido. Habilitar una configuración de identidad no garantiza que todas las solicitudes contengan usuario.
- Los modos Observe y Enforce tienen efectos distintos. Los eventos históricos no se reescriben al cambiar conexiones o reglas.
- Un registro visual o una pantalla de ejemplo no prueban S3 Object Lock, retención o ausencia de bypass.

## Desviación no resuelta: `CON-04`

La fuente normativa exige un índice numérico ponderado de cobertura y la guía `OPS-01` contiene referencias a puntos de ese índice. La decisión de diseño de esta UI es **no mostrar ese número**: se muestran estados de cada agente, herramienta e identidad de forma operativa. Eso no modifica el YAML ni satisface automáticamente el criterio de aceptación original. Si el diseño se adopta como producto, la desviación debe resolverse en la fuente normativa con el responsable de requisitos.

## Evidencia reproducible de la interfaz

La [auditoría de recorridos](user-journey-audit.md) y su [matriz de pasos](journey-matrix.md) distinguen recorridos completados en el navegador de los **20 casos parciales que siguen requiriendo backend**. Los oráculos se ejecutan en Chromium sobre la UI de muestra. No se extrapolan a AWS, OIDC, MCP, Cedar, OTLP ni S3.

## Continuidad de tareas de gasto

`Spending → agente → solicitud por persona/modelo → Activity` y `Spending → agente → trace_id → Audit → Spending del agente` se prueban como recorridos de trabajo, no como mera presencia de enlaces. Los IDs `S-10` a `S-18` en [`journey-matrix.md`](journey-matrix.md) y las verificaciones de navegador en `qa/test_spending_navigation.py` miden esa continuidad. No se afirma conciliación entre totales diarios y registros parciales de muestra.
