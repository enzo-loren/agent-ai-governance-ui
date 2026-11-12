# Auditoría requisito → recorrido de consola

**Fuente normativa:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), junto con [`contexto/03-politicas-y-estado-inicial.md` §5](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) y el [contrato de puerta](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/02-contrato.md). Revisión realizada el 12 de noviembre de 2026 contra las rutas y acciones de `src/views.js`, `src/operations.js`, `src/app.js` y el inventario de `qa/journeys.json`. Alcance: **Módulo A, requisito de pantalla/recorrido, no despliegue AWS**. El YAML tiene precedencia sobre documentos derivados.

## Conclusión ejecutiva

Una ficha creada con nombre y responsable no equivale a un agente conectado. `REG-02` obliga a emitir `agent_token` propio, mostrarlo una sola vez junto a `BASE_URL`, guardar únicamente el hash y permitir rotación con dos tokens activos y revocación individual. `INF-01` y el contrato indican que el **cliente cambia su SDK OpenAI**: `base_url={gateway}/inference/v1`, `api_key=agent_token`. La plataforma **no solicita ni sustituye una credencial de OpenAI/Bedrock proporcionada por el cliente**. El mismo token identifica al agente ante `/mcp` (conexión B). `OPS-01` pide una guía personalizada por agente.

Esta PR modela el recorrido en navegador para evaluación UX: formulario con ajustes iniciales, generación aleatoria Web Crypto, hash SHA-256 persistido, entrega una sola vez, listado de IDs y rotación/revocación **solo locales**, fragmento copiable y guía desde ficha. El endpoint `gateway.example.invalid` es intencionalmente no enrutable. **No hay autorización real, revocación de tokens desplegados, prueba de 401, backend seguro ni garantía de 60 s**. Es una implementación de interfaz y contrato a reemplazar por API, no cumplimiento de seguridad de `REG-02`.

## Inventario completo del Módulo A

**Lectura de la clasificación:** `UI parcial` = existe ruta pero falta un campo, una operación o un detalle normativo; `UI ausente` = el operador no puede completar esa tarea desde la consola; `UI ofrecida / backend pendiente` = hay recorrido navegable, sin evidencia de ejecución real; `Sin pantalla exigida` = el requisito es de servicios, protocolo, pruebas o infraestructura y no obliga a inventar una vista. La matriz **no asigna porcentajes de cumplimiento**.

| ID | Exigencia o componente visible | Estado de interfaz / siguiente acción |
| --- | --- | --- |
| `PLT-01` | Despliegue CDK y config inicial | **Sin pantalla exigida.** Infraestructura y schema de configuración, no wizard de cliente. |
| `PLT-03` | Modelo simulado opcional | **Sin pantalla exigida.** Configuración del despliegue y prueba de proveedor. |
| `REG-02` | Alta, credencial única, rotación/revocación | **UI extendida en esta PR** para formulario, recibo y lista de claves. Backend real pendiente: hash en servidor, 401, propagación ≤60 s. |
| `INF-01` | API OpenAI compatible y streaming | **Sin pantalla exigida.** El fragmento del SDK está en la guía; contrato y tráfico pertenecen a la puerta. |
| `EVD-01` | Registro durable inmutable | **Sin pantalla de configuración exigida.** Audit expone registros, no prueba durabilidad real. |
| `CON-01` | Login OIDC y roles con 403 | **UI ofrecida / backend pendiente.** Lectura/escritura por rol en componentes; no login ni autorización en API real. |
| `CON-02` | Estado visual y razón simple por decisión | **UI ofrecida.** Mantener prueba de todos los estados con motivos y versión. |
| `CON-03` | Flujo en vivo, conexiones y costo en cada fila, pausa sin perder eventos | **UI parcial.** Activity tiene filtros, pero faltan conexión/costo visibles por fila y pausa real; mover el botón a Request Studio dejó abierta una exigencia de cliente. |
| `NFR-02` | Independencia del Módulo B | **Sin pantalla exigida.** Restricción del código y configuración, evaluable en repositorios. |
| `NFR-03` | Actualización <3 s, vistas <2 s | **Sin pantalla nueva exigida.** Requiere métricas E2E reales, no cronómetro decorativo. |
| `NFR-04` | Seguridad de IaC | **Sin pantalla exigida.** Validar cfn-guard, Checkov, gitleaks e IAM. |
| `NFR-05` | Telemetría OTLP | **Sin pantalla exigida.** Contrato de observabilidad. |
| `INF-02` | Descubrir/classificar tools y revisiones de esquema | **UI parcial.** Catalog revisa tools; autodescubrimiento y pruebas con inferencia reales pendientes. |
| `INF-04` | Correlación por transacción | **UI parcial relacionada con `EVD-05`.** Sin relación causal estable ni trace_id compuesto. |
| `GRD-01` | Guardrail semántico por solicitud | **Sin pantalla nueva exigida.** Las decisiones deben reflejar intervenciones, sin simular evaluación AWS. |
| `GRD-02` | RUT, correo, teléfono enmascarados | **Sin pantalla específica exigida.** Visualizar condición/resultados en Audit; ejecución en gateway. |
| `FIN-01` | Tokens, costo, versión de tarifa y latencia | **UI parcial.** Spending permite desglose, no presenta íntegramente tokens, latencias y procedencia/versionado por evento. |
| `POL-01` | Motor Cedar común y Presets | **UI ofrecida / backend pendiente.** Rules configura presets; evaluación Cedar real no existe en frontend. |
| `POL-03` | Discover/Observe con sombra | **UI ofrecida / backend pendiente.** Los motivos se muestran, no se verifica shadow real. |
| `CON-04` | Índice de cobertura, máximo, días en modo y estados | **Desviación consciente y abierta.** El usuario solicitó catálogo operativo, sin índice. Se debe modificar el YAML o reconocer incumplimiento formal; no marcar como conforme. |
| `REG-01` | Activar con impacto y tools pendientes | **UI parcial.** Confirmación y recuento, pero faltan días en modo, tool list completa y validación en servidor. |
| `REG-03` | Pausa inmediata y restaurar modo previo | **UI ofrecida / backend pendiente.** Confirmaciones y estado; 403/60 s son del gateway. |
| `INF-03` | Modelos permitidos por agente | **UI ofrecida / backend pendiente.** Modal de selección; 403 real y actualización <10 s pendientes. |
| `INF-05` | Bloquear intención y estilo de respuesta | **UI extendida en esta PR** para ajuste `message/error_http`; bloqueo efectivo pertenece al gateway. |
| `FIN-02` | Límites de presupuesto día/mes, tokens, tasa, acciones y alertas | **UI parcial.** Hay presupuesto diario, tokens y RPM, pero no todos los períodos, medidores/umbrales por límite ni alertas en vivo. |
| `NFR-01` | Falla cerrada | **Sin pantalla exigida.** Casos de prueba por desconexión de servicios y evidencia. |
| `EVD-04` | Historial de cambios administrativos | **UI ofrecida / backend pendiente.** Audit/Change history registra cambios locales. |
| `CON-06` | Consumo por período, persona, modelos y límites con acción | **UI parcial.** Falta selección de período y panel completo de métricas/acciones por límite. |
| `CON-08` | Modo presentación 1080p | **Desviación abierta.** Control trasladado al entorno de prueba; el YAML exige un modo presentación en la consola. No basta un screenshot. |
| `POL-05` | Comparar Presets reevaluando contexto | **UI parcial.** Preview existe, conteo no equivale a reevaluación Cedar por cada contexto. `SHOULD`. |
| `IDN-01` | Emisor OIDC, clientes aceptados, token inválido, roles y política | **UI parcial.** Identity settings y ajustes del agente existen; falta administración completa de confianza, roles/mapeos y verificación JWT real. |
| `GRD-03` | Excepciones PII por rol validado | **Sin pantalla propia exigida.** Permisos y contexto de identidad; requiere API/guardrail. |
| `FIN-03` | Límites por usuario y costos | **UI parcial.** Persona en Spending y formulario individual; falta directorio de límites por usuario y período. |
| `MCP-01` | Registro de targets Lambda/OpenAPI, tools/list y control por ejecución | **UI ausente para registrar targets reales.** Un campo «Destination label» por tool no sustituye formulario de target (tipo, ARN/URL, autenticación, descubrimiento, estado). |
| `PLT-02` | Secretos de targets en bóveda | **Backend requerido; UI parcial relacionada con targets.** El operador necesita referencia/estado de credenciales del target, no secretos en claro. |
| `GRD-04` | Enmascaramiento de tool results | **Sin pantalla nueva exigida.** Debe quedar trazable en el registro de ejecución. |
| `POL-04` | Crear/editar reglas visuales y Cedar validado/versionado | **UI parcial.** Se crean reglas y borradores; no hay edición/publicación segura de Cedar validado ni historial textual completo. |
| `POL-02` | Matriz automatizada de 30 escenarios | **Sin pantalla de cliente exigida.** Request Studio puede apoyar QA, no reemplaza suite contra la puerta. |
| `OPS-01` | Guía personalizada por agente | **UI parcial/extendida en esta PR.** URL, token de un solo uso y guía; faltan orden por controles y fragmentos efectivos de MCP/identidad. La fuente exige número de puntos del índice (desviación). |
| `CON-07` | Catálogo de tools, aprobación, supervisión y reglas | **UI ofrecida / backend pendiente.** Las distinciones entre descubrimiento, routing y aprobación necesitan datos de gateway. |
| `HITL-01` | Supervisión autónoma/notificar/aprobar | **UI parcial.** Selección por tool presente; alerta en <1 min y decisiones reales pendientes. |
| `HITL-02` | Retención y resolución de la ejecución MCP | **UI parcial.** La bandeja no prueba ejecución única ni la respuesta de `gov_aprobacion_estado`. |
| `HITL-03` | Separación de funciones y falla cerrada | **UI ofrecida / backend pendiente.** Botones por rol; denegación 403 efectiva y log deben verificarse en API. |
| `CON-05` | Bandeja de aprobaciones con plazo, comentarios, argumentos, trace | **UI parcial.** Falta cuenta regresiva real y enlace al trace exacto; se muestra ventana estática. |
| `EVD-02` | Búsqueda de transacciones por criterios combinados | **UI ofrecida / backend pendiente.** Filtros presentes, búsqueda solo en registros locales. |
| `EVD-03` | Texto íntegro de regla histórica por versión | **UI parcial.** Muestra versión; no permite reconstruir el texto/versionado de la decisión histórica. |
| `EVD-05` | Ruta forense causal completa | **UI parcial.** Request timeline agrupa por agente+acción, explícitamente no establece causalidad. Falta recorrido por trace_id con pasos correlacionados y contexto. |
| `EVD-06` | Sello y prueba real de S3 Object Lock | **UI parcial.** Muestra Not verified sin evidencia; una acción real «probar inmutabilidad» no existe (correctamente, sin backend). |

**Módulo B (`AGT-01`–`AGT-07`)**: agente sintético y su chat de prueba, runner y herramientas. No constituyen pantallas obligatorias del producto Módulo A; no se deben mezclar con la navegación de cliente.

## Siguiente orden de implementación

1. **P0, alta y contrato de credenciales — `REG-02`, `OPS-01`**: integrar backend real de emisión única/rotación/revocación y la URL del despliegue. Esta PR solo entrega su experiencia de interfaz verificable. El operador siempre debe poder copiar la URL, pero nunca recuperar el secreto después de cerrar la entrega.
2. **P0, targets MCP — `MCP-01`, `PLT-02`**: pantalla de targets por agente con alta Lambda/OpenAPI, autenticación por referencia a bóveda, verificación, tools/list y estado por tool. No simular «conectado» por tener un alias de destino.
3. **P1, políticas completas — `POL-04`, `IDN-01`**: CRUD de reglas, validación Cedar, publicación/versiones y configuración de confianza OIDC con client IDs, política de tokens inválidos y grupos; no confundir «configurado» con «JWT verificado».
4. **P1, flujo y operaciones — `CON-03`, `CON-05`, `CON-06`, `FIN-02`, `FIN-03`**: completar columnas de eventos, pausa/recuperación, plazo de aprobación vivo, medidores por período y directorio de límites por persona.
5. **P1, trazabilidad — `EVD-03`, `EVD-05`, `EVD-06`**: timeline causal real, texto/versiones de políticas y evidencia de retención verificable, cuando exista servicio.
6. **Decisión formal de alcance — `CON-04`, `CON-08`, `OPS-01`**: acordar con la fuente normativa si se eliminan el índice y la presentación o si se implementan en un espacio específico; la preferencia de UX no cambia los requisitos por sí sola.

### Pruebas de aceptación propuestas

- Registro: nombre/responsable obligatorios, valores opcionales, modelos y presupuesto válidos, modo inicial Observe, única credencial por agente y misma llave para los dos canales.
- Entrega: `BASE_URL` de inferencia; API key mostrada exactamente una vez, copiable, no persistida en claro, no reaparece tras navegación/recarga.
- Ciclo de vida: rotar agrega otra credencial activa; revocar afecta a una credencial específica; otra sigue activa; cancelar no cambia registros; roles distintos de Operator no pueden modificar.
- Contrato real aún pendiente: tokens desconocidos/alterados/retirados retornan `401`, revocación toma ≤60 s, solo se almacena hash del token en servicio, y un cliente OpenAI real se conecta con el fragmento. Estas **no** deben darse por aprobadas con tests de navegador.
- La matriz de recorridos de la consola se conserva y se agregan pruebas específicas para onboarding, sin atribuir cumplimiento de gateway.
