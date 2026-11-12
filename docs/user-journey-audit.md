# Auditoría de recorridos · consola de referencia

**Base normativa:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), [`03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) y [`04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md). Se distinguen los requisitos de la plataforma y el comportamiento de esta UI estática.

## Resultado de la revisión

| Estado de los recorridos de UI | Casos | Significado |
| --- | ---: | --- |
| Funcionales en el prototipo | **104** | La tarea produce una respuesta o un cambio verificable en el navegador, sobre datos sintéticos |
| Parciales | **20** | Existe un recorrido visible, pero falta una garantía central que depende de servicios o evidencia externa |
| Sin recorrido | **0** | No quedan objetivos de la matriz anterior sin una entrada de UI |
| **Total** | **124** | Recorridos principales, variantes, errores y pruebas a escala |

Se mide una acción por clic, selección, escritura en un campo o envío. **Todos los casos empiezan en Inicio**. No se suman caracteres ni desplazamientos. Un caso parcial informa las acciones hasta la vista disponible, **no** un costo de finalización del requisito real. El desglose íntegro está en [la matriz](journey-matrix.md), con acciones en [`qa/journeys.json`](../qa/journeys.json) y resultados de Chromium en [`qa/journey-results.json`](../qa/journey-results.json).

Los resultados no equivalen a 115 requisitos implementados ni a cobertura de seguridad. El repositorio es un frontend sin backend.

## Recorridos operativos implementados

| Área | Recorrido disponible | Alternativas comprobadas | Requisitos asociados |
| --- | --- | --- | --- |
| **Tools** | Catalog → Tools → revisar herramienta → clasificación, decisión y supervisión → confirmar → ver estado e historial | Cancelar; rechazar; revisar versión nueva; auditor; control de ejecución ausente; alta sintética | INF-02, CON-07, HITL-01 |
| **Agentes** | Catalog → agente → editar datos, modelos permitidos, versión de credencial o retirar agente | Cancelar; límite de propietario; agente retirado conserva registros | REG-01/02/03, INF-03 |
| **Connections** | Elegir agente → confirmar conexión o desconexión; configurar destino y emisor OIDC de ejemplo | Cancelar; B parcial; C ausente; HTTPS obligatorio; datos históricos intactos | MCP-01, IDN-01, OPS-01 |
| **Rules** | Elegir agente → previsualizar preset → aplicar y confirmar; crear regla por parámetro o texto Cedar de ejemplo | Cancelación; auditor solo lectura; parámetro inexistente; `amount=8` frente a `amount=25`; historial | POL-01/04/05, CON-07 |
| **Activity** | Consultar eventos → filtrar por persona, agente, decisión y canal → pausar, generar un ejemplo y reanudar | Sin resultados; enlace al agente; ejecución local fuera del gateway | CON-02/03 |
| **Approvals** | Revisar una solicitud pendiente con detalles → autorizar o rechazar con comentario; simular vencimiento | Autoaprobación impedida; cancelar; rol insuficiente; vencimiento ilustrativo | CON-05, HITL-02/03 |
| **Spending** | Consultar gastos → abrir agente → rastrear solicitudes de modelo, persona o traza → seguir al Audit filtrado → volver al mismo agente; gestionar límites y tarifas | Auditor sin edición; valores inválidos; alertas con ruta a agente; sin identidad | CON-06, FIN-01/02/03, EVD-02 |
| **Audit** | Buscar y combinar filtros → abrir decisión y línea de tiempo de muestra; ver cambios administrativos | Sin evidencia; limpiar búsqueda; filtros combinados; prueba de retención ilustrativa | EVD-02/03/04/05/06 |
| **Workspace** | Cambiar apariencia, usar presentación, recorrer tour y restablecer | Cancelar restablecimiento; teclado; siete anchos de pantalla | CON-01/02/08 |

### Revisión de herramientas: recorrido principal

La ficha de una herramienta ofrece el esquema de argumentos, su versión, el agente, la ruta de ejecución, la clase sugerida o confirmada, el estado del catálogo, la supervisión y el uso observado. El operador puede conservar, corregir o rechazar la clasificación; el resultado se aplica **después de confirmar**. La decisión y sus valores anterior/nuevo quedan en el historial de **esta demostración**. Si el esquema se modifica en el ejemplo, vuelve a requerir revisión.

**Separación obligatoria:** aprobar la herramienta en el catálogo no ejecuta operaciones. Una invocación crítica requiere otra aprobación cuando la política y el canal MCP lo permiten. Si la ejecución de la herramienta es local, su ficha sigue indicando *Outside gateway* incluso después de aprobarla. La interfaz no debe convertir una intención visible en una ejecución supuestamente controlada.

### Navegación de Spending · segunda revisión de recorridos

La auditoría inicial verificaba si se podían **editar presupuestos y filtrar listados**, pero no exigía que el cliente pudiera continuar desde un importe hacia una solicitud, su decisión y el control relacionado. Por eso la pantalla aparecía funcional en la matriz, aunque sus totales eran prácticamente terminales. Se corrigió esa insuficiencia del contrato de pruebas, en lugar de considerarla una preferencia superficial.

| Pregunta operativa | Recorrido desde Inicio | Acciones verificadas | Caso |
| --- | --- | ---: | --- |
| ¿Qué agente explica el gasto? | Spending → Atlas Support → ficha de uso | 2 | `S-10` |
| ¿Qué solicitudes de modelo lo originaron? | Spending → agente → Model requests (canal modelo prefiltrado) | 3 | `S-11` |
| ¿Qué solicitudes se atribuyeron a una persona? | Spending → Maya Chen → Activity filtrada por actor, agente y canal | 2 | `S-12` |
| ¿Qué modelo aparece en los registros? | Spending → desglose por modelo → Activity filtrada | 2 | `S-13` |
| ¿Por qué aparece una solicitud concreta? | Spending → agente → Audit trace (mismo agente y trace_id) | 3 | `S-14` |
| ¿De quién es una alerta? | Spending → alerts → ficha de gasto del agente | 3 | `S-15` |
| ¿Cómo se vuelve sin perder el agente? | Spending → traza en Audit → Spending del mismo agente | 4 | `S-16` |
| ¿Puedo leer la explicación sin abandonar Spending? | Spending → agente → detalle del evento | 3 | `S-17` |

Se añadieron filtros de **modelo** en Activity y el enlace inverso a Spending en vistas de agente; también se mantuvo el comportamiento de borrado de filtros. Los eventos sin token de usuario **no** reciben un enlace falso a una identidad. En dispositivos móviles, el camino se recorrió abriendo la navegación compacta; los contenedores se verificaron a 390 px.

**Límite del dato:** los totales diarios `agent.spent` y los eventos `state.events` proceden de distintas porciones de la muestra. El desglose por modelo y las trazas visibles son ejemplos de registros individuales, **no** una conciliación contable ni evidencia de facturación completa. Las vistas lo explican donde aparecen los eventos; la integración real deberá correlacionar coste, `trace_id`, agente, usuario verificado y ventana temporal antes de atribuir causalmente gasto.

### Escala y navegación

Se ejercitaron directorios con **123 agentes**, **465 herramientas** y **272 solicitudes de aprobación**. Las listas renderizan bloques acotados y permiten buscar o cargar más; esto valida la presentación del ejemplo, no consultas paginadas de servidor. Se probó ausencia de desbordamiento horizontal en **320, 390, 670, 900, 1100, 1440 y 1920 px**. El catálogo de herramientas cambia a tarjetas en móvil y los filtros avanzados de Audit se despliegan a demanda.

## Límites pendientes: pantalla disponible no significa control implementado

La matriz conserva **20 recorridos parciales** porque requieren garantías que este repositorio no puede proporcionar:

- **Credenciales de agente** (`REG-02`): las versiones, rotación, revocación y retiro son representaciones locales; no se emiten tokens opacos, no se mantienen dos credenciales reales y no se prueban respuestas 401 ni revocación en plazo.
- **Conexiones** (`MCP-01`, `IDN-01`, `OPS-01`): formularios de destinos y confianza OIDC no registran MCP real ni validan JWT. La presencia del campo no prueba encaminamiento ni identidad.
- **Reglas** (`POL-04`, `POL-05`): se valida el esquema simple de muestra y se simulan comparaciones, pero no se compila ni evalúa Cedar contra datos históricos completos. La previsualización histórica es ilustrativa.
- **Aprobación humana** (`HITL-02/03`, `CON-05`): el solicitante y el revisor son ejemplos seleccionables. No hay sesión autenticada, bloqueo 403 de API, expiración de backend ni liberación real de una llamada MCP.
- **Actividad** (`CON-03`, `NFR-03`): el flujo, la pausa y la reanudación corresponden a eventos en memoria; no se miden latencias de publicación ni streaming de la puerta.
- **Consumo e identidad** (`FIN-03`): los límites por persona se configuran como ejemplo; no se aplican a tráfico real ni se verifican contra tokens OIDC.
- **Auditoría** (`EVD-01/02/04/05/06`): el historial administrativo y las agrupaciones de solicitudes son locales; faltan correlación causal del backend, registro durable y prueba real de S3 Object Lock. La respuesta `403 AccessDenied` mostrada en «Retention test · example» está identificada como **ilustrativa**, no como ejecución de S3.

Estos pendientes corresponden al proyecto de plataforma, no a una promesa de seguridad de esta UI. El índice numérico exigido por `CON-04` sigue siendo una desviación de diseño explícita: el catálogo muestra hechos operativos sin puntuación global, según la decisión de producto, pero el YAML todavía no cambió.

## Reproducción

```bash
npm run check
npm run build
python -m pip install playwright==1.57.0
python -m playwright install chromium
bash qa/run_all.sh
python qa/generate_matrix.py
python qa/test_extended.py
python qa/test_distribution.py
```

El pipeline comprueba que cada escenario ejecutado conserva su clasificación, sus pasos y sus oráculos. Las pruebas positivas verifican resultados visibles y cambios de estado; las negativas verifican ausencia de mutación ante cancelación, permisos o datos inválidos. Los casos parciales registran su límite explícitamente y no se promocionan automáticamente a requisito satisfecho.


## Reevaluación tras la separación del mock · 2026-11-11

Se ejecutó de nuevo la matriz de 124 recorridos después de separar fixtures, almacenamiento y rutas. El detalle de defectos confirmados y pendientes está en [`deep-ux-data-audit.md`](deep-ux-data-audit.md). Las 20 rutas parciales siguen siendo parciales por dependencias externas; las pantallas nuevas no convierten ausencia de backend en un requisito cumplido. Se agregaron tests sobre integridad de datos, snapshots, edición concurrente, borradores Cedar y URLs de investigación.
