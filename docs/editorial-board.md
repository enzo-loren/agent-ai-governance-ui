# Editorial board — rationale kept outside product copy

This is the process-only decision log required by *Scientific Writing Editor*. It belongs in the repository, not inside the user-facing product. Claims are separated by what the source mandates, what the interface proposes, and what still needs evidence.

| Claim / decision | Basis | Editorial / UX action | Confidence / remaining check |
| --- | --- | --- | --- |
| The audience should recognize the product without cloud infrastructure expertise | Meeting Nov 10 + `04-ux.md` §§1–4 | Familiar tasks as navigation; move platform internals to optional detail | Design proposal; field test with novices pending |
| The product must show “what would block” before enforcing | `requisitos.yaml` REG-01, POL-01 and preset state | “Observe” and “Would block”, confirmation with impact count | Source-defined semantics; simulation only |
| A and B protect different channels | `requisitos.yaml` connections and CTRL-12–18 | Separate “Model request” from “Tool execution”; explicitly mark outside B | Strongly supported; backend verification pending |
| C has an actual identity propagation dependency | `requisitos.yaml` and `01-modelo-de-conexion.md` | Explain “Identify users”, not just “Choose a role”; role picker labeled preview | Supported, implementation not present |
| Operator/Approver/Auditor have different permissions | CON-01 | Simulate disabled/missing actions by role with explanatory descriptions | Source-defined roles; frontend is not security |
| Evidence cannot be inferred from an attractive badge | EVD-01, CON-02, `04-ux.md` GV-6 | Explicit “sample record”, “no evidence”, never real immutable certification | Strongly supported limitation |
| Public documentation remains the deep explainer | Meeting Nov 10 | Link guide, avoid re-explaining 7 slices on every page | Requested direction; information architecture proposed |
| Brand palette should be adjustable without hardcoding | User request, semantic design-system practice | One token file with 3 palettes; semantic status colors independent of brand | Implemented; contrast review after any new palette |
| Short UI strings avoid overload | NN/g progressive disclosure; user request | Action verbs, short summaries, drawer for technical reason | Design intention; user testing pending |
| Agent spend is distinct from arbitrary LLM spend | Meeting Nov 10 | Spending by agent only; per-person attribution is explicitly unavailable without C | Grounded; backend accounting not verified |
| Prefer operational status to a composite governance score | Explicit user direction (2026-11-11); `CON-04` still requires an index | Add Catalog → Tools / People, per-tool route and policy status, recent named requests; omit index and percentage | Design deviation tracked in `docs/traceability.md`; requirement change not approved |
| Multi-account and very granular budgets should not block demo | Meeting Nov 10 | Keep deferred from first-level UI | Scope direction, not a formal permanent exclusion |

## Copy rules for contributors

1. **One decision, one consequence.** `Blocked · Delete warehouse was denied by the selected rule` is better than internal telemetry jargon.
2. **Show status + cause.** “Denied” alone is not sufficient.
3. **Never label a preview as enforcement.** “Would block” describes a counterfactual.
4. **Never imply unconnected tools were blocked.** Explicitly state “Not covered” for local tool execution without B.
5. **Avoid repeated disclaimers.** Keep one unobtrusive Preview label in the application; distinguish real security boundaries in context and leave implementation qualifications in documentation.
6. **Keep explanation under a click.** Show `Technical details` only when a person requests it.
7. **A source-derived requirement is not an implemented feature.** If an implementation is absent, state so rather than weakening the requirement or inventing results.
8. **Preserve operational caveats in the content**, but keep reasons for *word choice or organization* in this editorial board.

## Audit of exclusions

Raw YAML/Cedar/JSON, AWS services, Object Lock modes and token propagation belong to documentation and optional detail—not home KPIs. No unsupported “platform is safe” percentages. No comparison of Cloudscape “quality”; only observation that it resembles AWS and was flagged during review. No invented timing, security guarantees, test coverage of backend or return-on-investment figures.

## 2026-11-11 · Agent-centric navigation and connection language

- Product UI names **Model requests**, **Tool execution** and **User identity**; A, B and C remain stable internal connection IDs and technical requirements references. This is a terminology change, not a change in the domain model.
- Connections is a searchable agent directory, using the same cards as Catalog. Its destination is the agent's **Connections** tab. The small native agent selector was removed; the same selection workflow supports large organizations. This follows [NN/g guidance on long selects](https://www.nngroup.com/articles/dropdown-list/) and [GOV.UK research on select usability](https://design-system.service.gov.uk/components/select/).
- Both directories render an initial batch of 24 agents with a Show more action. A production server-backed directory will also need pagination and query handling.
- Connection state continues to describe the configured path, **not** a blanket assertion that all tools or requests are covered. The details view keeps per-tool routing and named/unnamed request counts.
- Existing `#/integrations` links remain readable through a legacy route alias, while visible navigation uses `#/connections`.
- Reasoning belongs in this board and the Git commit, not in the product's first-level copy.

## Multi-agent consistency review · 2026-11-11

- Rules no longer selects an agent through an all-agent dropdown: Catalog, Connections, and Rules now use the same searchable directory, with a shared `Agent → Overview / Connections / Rules` hierarchy.
- Activity, Approvals, Spending, and Audit preserve an explicitly scoped agent in deep links; global lists remain global. Hidden filters must never silently exclude events when a user follows an agent link.
- Large tables show bounded batches and a visible result count. This is **DOM control**, not server pagination. Requirements involving event timing, correlation, and immutable evidence remain separate from frontend behavior.
- In Spending, previously recorded user-attributed events remain historical evidence after identity is disconnected; the current connection is not retroactively applied to those events.
- Detailed findings, residual design questions, and verification conditions are in [`scale-ux-audit.md`](scale-ux-audit.md). No claims of security coverage are inferred from card counts or test counts.

## Policy selection versus application · 2026-11-11

- A policy card is a **read-only selection for preview**, not a mutation. This prevents an exploratory click from changing authorization behavior. The UI distinguishes **Active** (saved policy) from the **selected preview** and renders the candidate's rule consequences without changing the saved agent state.
- Changes require an explicit **Apply policy** action and a second **Confirm policy change** dialog identifying the agent and both policies. This applies in Observe and Enforce; Observe remains Observe after saving a preset. Cancellation, navigation and reset discard the temporary preview, while modal cancellation preserves it for further comparison.
- Source constraints remain intact: role-restricted writes depend on verified identity, real tool execution checks apply only to routed tools, and exploratory policy preview is not backend enforcement. An Auditor can inspect the same policy explanations but cannot apply a change.
- `Request as` remains a test-request identity selector; it is not authentication. Its label, native keyboard behavior, focus indicator, field width and dropdown icon now follow the form controls used elsewhere, including narrow screens and semantic themes.
- Verification: 52 Node tests; local static build; rendered Chromium walkthrough of selection, cancellation, confirmation, auditor restrictions, Observe handling, and selector geometry at 320, 390, 670, 900, 1100 and 1440px. The test fixtures represent the frontend, not production authorization.

## Task-based audit · 2026-11-11

- **Source versus interpretation:** the canonical YAML and policy context specify administrative tool classification/approval and separate one-time MCP execution approvals. Proposed screens and action counts are design decisions rather than source-mandated steps.
- **Validation labels:** “functional” means that a real browser can finish a simulated UI journey; “partial” means that a visible screen does not satisfy its requirement; “no path” means the interface stops before completion. Reports and test names do not imply verification of AWS/Cedar/Secrets Manager/real identities.
- **Proof location:** `qa/journeys.json` defines actions, variants, roles and expected outcomes; Chromium records the actions from Home in `qa/journey-results.json`. Editorial rationale and limitations live in `docs/user-journey-audit.md`, not in UI banners.
- **Discovered defect:** a form field named `id` shadows `HTMLFormElement.id`, so the budget submit branch did not run. Read the DOM `id` attribute explicitly. This is a corrected frontend bug with a browser regression; it is not evidence that real budgets are enforced.

## Cierre de recorridos operativos en la UI · 2026-11-11

- Afirmación fuente: INF-02, CON-07 y HITL-01 distinguen clasificación, aprobación y supervisión de herramientas; CON-05 y HITL-02/03 rigen **una ejecución pendiente**, no la aprobación del catálogo. Diseño: ficha propia de tool, vista previa y confirmación, estado actualizado e historial local; las dos autorizaciones no comparten un botón ambiguo.
- Los 31 huecos y 6 recorridos parciales del diagnóstico original se trataron como objetivos de diseño, no como pruebas que ya «pasaban». La nueva matriz contiene 115 recorridos con oráculos sobre resultados, cancelaciones, errores, permisos y volumen; 95 son operaciones de UI simuladas y 20 son parciales porque faltan garantías externas. No se les atribuye cumplimiento de seguridad.
- El texto evita afirmar «conectado» cuando solo se almacena una URL, «credencial emitida» cuando solo se incrementa una versión, «regla Cedar validada» cuando se comprueba sintaxis básica o «evidencia inmutable» cuando se presenta un ejemplo. Esas condiciones quedan junto a la operación correspondiente, no escondidas en esta nota.
- En Audit, los filtros técnicos están bajo un control desplegable para mantener el primer nivel legible. En móvil, Tools usa tarjetas con revisión visible; en escritorio mantiene tabla para densidad. El toggle de presentación altera realmente la escala y el chrome, no solo el título.
- La desviación CON-04 sigue abierta. Un estado operativo en el catálogo no se equipara al índice exigido por el documento vigente.
- La documentación de desarrollo se separó del README de producto; se eliminaron instrucciones personales para crear otro repositorio o desplegar Pages, obsoletas para este repositorio existente.

## Spending como punto de investigación · 2026-11-11

- Hallazgo observado: la primera matriz verificaba importes, filtros y modificaciones en Spending, pero no la posibilidad de investigar el origen del gasto; un nombre llevaba a Overview y los totales de persona/modelo no ofrecían continuación. La etiqueta «funcional» era válida solo para esas acciones aisladas, no para la tarea completa del cliente.
- Decisión de UX: transformar el gasto agregado en **escala de detalle**: global → agente → eventos de modelo → decisión/auditoría, con vías paralelas por persona, modelo y alerta. Usar rutas de agente explícitas y conservar filtros de origen; poner la navegación de retorno en el alcance del agente.
- Protección epistémica: la muestra de eventos no reconcilia las métricas `agent.spent`; se rotulan los registros como parciales y no se inventa atribución. Personas sin identidad verificada siguen contabilizadas en el agente. La UI no presenta un importe como evidencia de facturación de un proveedor.
- Verificación: 9 recorridos de Chromium nuevos desde Inicio (`S-10`–`S-18`) y pruebas de ida y vuelta/errores de atribución a 1100 y 390 px. El conjunto total queda en 124 casos (104 UI simulada, 20 parciales por backend); la acción de clic cuenta como paso, no el desplazamiento o apertura del menú móvil.
