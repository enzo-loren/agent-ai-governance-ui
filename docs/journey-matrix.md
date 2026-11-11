# Matriz de recorridos de la consola

Fuente operativa: [`qa/journeys.json`](../qa/journeys.json); resultados de Chromium: [`qa/journey-results.json`](../qa/journey-results.json).
Requisitos: [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml).

## Lectura de los pasos

- **Funcional (simulado):** pasos hasta completar una operación visible en el navegador; no prueba backend.
- **Parcial:** pasos hasta observar la interfaz parcial; no existe el resultado exigido.
- **Sin recorrido:** pasos hasta el punto en el que falta una acción; el objetivo **no tiene** número de pasos de finalización.
- Cuenta una interacción por clic, selección de opción, escritura de un campo o envío. No cuenta pulsaciones individuales al teclear ni desplazamiento. Todos parten de Inicio. Los tiempos y latencia no se infieren de estos números.

| Resultado | Casos |
| --- | ---: |
| Funcional (simulado) | 56 |
| Parcial | 6 |
| Sin recorrido | 31 |

**Total: 93 recorridos y variantes.** Un caso marcado como «Sin recorrido» no es una prueba funcional aprobada.

## Catalog

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `C-01` | Find agent from Home | CON-04 | Funcional (simulado) | 2 |
| `C-02` | Search by owner among agents | CON-04 | Funcional (simulado) | 2 |
| `C-03` | No-results state is explanatory (*not found*) | CON-04 | Funcional (simulado) | 2 |
| `C-04` | Register sample agent and see one-time example key | REG-02 | Funcional (simulado) | 5 |
| `C-05` | Cancel new agent without changes (*cancel*) | REG-02 | Funcional (simulado) | 3 |
| `C-06` | Edit required agent metadata (*edit missing*) | REG-02 | Sin recorrido | 1 hasta bloqueo |
| `C-07` | Rotate agent credential with dual-active tokens (*rotation missing*) | REG-02 | Sin recorrido | 1 hasta bloqueo |
| `C-08` | Revoke an active agent credential (*revocation missing*) | REG-02 | Sin recorrido | 1 hasta bloqueo |
| `C-09` | Retire agent without erasing evidence | REG-02, REG-01 | Sin recorrido | 1 hasta bloqueo |
| `C-10` | List tools and filter needs action | CON-07, INF-02 | Funcional (simulado) | 3 |
| `C-11` | Inspect individual tool schema and suggested class (*detail missing*) | INF-02, CON-07 | Sin recorrido | 2 hasta bloqueo |
| `C-12` | Confirm or correct tool class after discovery (*no classification action*) | INF-02, CON-07 | Sin recorrido | 3 hasta bloqueo |
| `C-13` | Approve reviewed tool for use | CON-07, INF-02 | Sin recorrido | 3 hasta bloqueo |
| `C-14` | Reject reviewed tool for use (*rejection missing*) | CON-07, INF-02 | Sin recorrido | 3 hasta bloqueo |
| `C-15` | Set supervision autonomous/notify/approval for a tool (*supervision missing*) | HITL-01, CON-07 | Sin recorrido | 2 hasta bloqueo |
| `C-16` | Locate tools outside execution gateway | CON-07, MCP-01 | Funcional (simulado) | 3 |
| `C-17` | Observe newly declared tool in catalog after real inference | INF-02 | Sin recorrido | 2 hasta bloqueo |
| `C-18` | Inspect schema change and re-review pending tool | INF-02 | Sin recorrido | 2 hasta bloqueo |
| `C-19` | See actual named versus unassigned user requests | IDN-01, CON-04 | Funcional (simulado) | 2 |
| `C-20` | Inspect observed models | INF-03, CON-04 | Funcional (simulado) | 2 |
| `C-21` | Edit models permitted for agent | INF-03 | Sin recorrido | 1 hasta bloqueo |
| `C-22` | Auditor cannot create an agent (*auditor role*) | CON-01, REG-02 | Funcional (simulado) | 2 |

## Connections

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `I-01` | Find agent in a shared searchable directory | OPS-01 | Funcional (simulado) | 2 |
| `I-02` | Open connection guide for tool execution | OPS-01 | Funcional (simulado) | 3 |
| `I-03` | Switch on tool execution connection for an agent | OPS-01, MCP-01 | Funcional (simulado) | 3 |
| `I-04` | Disconnect identity without changing historical trace | IDN-01 | Funcional (simulado) | 3 |
| `I-05` | Register real MCP targets and verify tool-by-tool routing | MCP-01, OPS-01 | Sin recorrido | 3 hasta bloqueo |
| `I-06` | Configure OIDC trust, allowed clients and verify request token | IDN-01, OPS-01 | Sin recorrido | 3 hasta bloqueo |
| `I-07` | Copy model gateway config safely from live credentials | REG-02, OPS-01 | Parcial | 3 hasta bloqueo |
| `I-08` | Auditor cannot connect or disconnect a channel (*auditor role*) | CON-01, OPS-01 | Funcional (simulado) | 3 |
| `I-09` | Required model connection cannot be disconnected (*required channel*) | OPS-01 | Funcional (simulado) | 2 |
| `I-10` | Disabling identity preserves existing event attribution (*historic identity*) | IDN-01, EVD-04 | Funcional (simulado) | 3 |

## Agent overview

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `A-01` | Inspect model requests, tool routing and named identities | CON-04 | Funcional (simulado) | 1 |
| `A-02` | Preview and confirm change to Observe (*enforce to observe*) | REG-01 | Funcional (simulado) | 3 |
| `A-03` | Cancel mode change; no mutation (*cancel*) | REG-01 | Funcional (simulado) | 3 |
| `A-04` | Pause agent with confirmation | REG-03 | Funcional (simulado) | 3 |
| `A-05` | Resume agent to previous Enforce mode (*suspend/resume*) | REG-03 | Funcional (simulado) | 5 |
| `A-06` | Model-request simulation opens an explanatory trace | CON-02, POL-01 | Funcional (simulado) | 2 |
| `A-07` | Outside-gateway tool simulation cannot claim control (*local tool*) | CON-07, MCP-01 | Funcional (simulado) | 2 |
| `A-08` | Block enforcement when required owner is absent | REG-01 | Sin recorrido | 1 hasta bloqueo |
| `A-09` | A request without end-user identity remains attributable to agent (*solo_workload sample*) | IDN-01 | Funcional (simulado) | 3 |

## Rules

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `R-01` | Locate agent by policy and open its rules | CON-07 | Funcional (simulado) | 3 |
| `R-02` | Preview alternate preset without mutating active policy | CON-07, POL-05 | Funcional (simulado) | 3 |
| `R-03` | Cancel candidate preset selection (*cancel selection*) | CON-07 | Funcional (simulado) | 4 |
| `R-04` | Apply candidate preset with explicit final confirmation (*commit*) | CON-07 | Funcional (simulado) | 5 |
| `R-05` | Cancel policy confirmation; keep saved preset (*cancel confirmation*) | CON-07 | Funcional (simulado) | 5 |
| `R-06` | Warn when selected preset requires absent identity and tool gateway | CON-07 | Funcional (simulado) | 3 |
| `R-07` | Auditor may preview but cannot apply preset (*auditor*) | CON-01, CON-07 | Funcional (simulado) | 4 |
| `R-08` | Build parameterized visual rule and validate schema | POL-04 | Sin recorrido | 2 hasta bloqueo |
| `R-09` | Author and validate Cedar text and versioned rules | POL-04 | Sin recorrido | 2 hasta bloqueo |
| `R-10` | Simulate alternative policy on recorded contexts | POL-05 | Parcial | 3 hasta bloqueo |
| `R-11` | Inspect rule conflict and author history | EVD-04, POL-04 | Sin recorrido | 2 hasta bloqueo |
| `R-12` | Confirm preset in Observe mode without enabling enforcement (*Observe*) | REG-01, CON-07 | Funcional (simulado) | 5 |

## Activity

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `V-01` | Search by agent owner and inspect events | CON-03 | Funcional (simulado) | 2 |
| `V-02` | Filter by decision state | CON-03 | Funcional (simulado) | 2 |
| `V-03` | Open decision explanation in one additional action | CON-02 | Funcional (simulado) | 2 |
| `V-04` | Pause feed then resume retaining intervening events | CON-03 | Parcial | 2 hasta bloqueo |
| `V-05` | Filter by user and channel independently | CON-03 | Sin recorrido | 1 hasta bloqueo |
| `V-06` | See live gateway event under three seconds | CON-03, NFR-03 | Sin recorrido | 1 hasta bloqueo |
| `V-07` | Agent deep link fixes scope and hides irrelevant agent picker (*agent scope*) | CON-03 | Funcional (simulado) | 2 |

## Approvals

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `H-01` | Approve pending execution as reviewer | CON-05, HITL-02 | Funcional (simulado) | 4 |
| `H-02` | Reject pending execution as reviewer (*reject*) | CON-05, HITL-02 | Funcional (simulado) | 4 |
| `H-03` | Cancel pending approval dialog (*cancel*) | CON-05 | Funcional (simulado) | 4 |
| `H-04` | Operator cannot act as reviewer (*operator denied*) | CON-01, CON-05 | Funcional (simulado) | 1 |
| `H-05` | Separate requester and approver identities | HITL-03, CON-05 | Sin recorrido | 2 hasta bloqueo |
| `H-06` | See masked arguments, request trace and expiry clock | CON-05, HITL-02 | Parcial | 2 hasta bloqueo |
| `H-07` | Leave optional decision comment | CON-05 | Sin recorrido | 3 hasta bloqueo |
| `H-08` | Expire pending approval at deadline | HITL-02 | Sin recorrido | 2 hasta bloqueo |
| `H-09` | Filter reviewed requests | CON-05 | Funcional (simulado) | 2 |
| `H-10` | Pending request missing identity is not approvable (*C absent*) | HITL-03, CON-05 | Funcional (simulado) | 2 |

## Spending

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `S-01` | View agent spend by searching owner | CON-06 | Funcional (simulado) | 2 |
| `S-02` | Edit daily budget through form | CON-06, FIN-02 | Funcional (simulado) | 4 |
| `S-03` | Cancel budget change (*cancel*) | CON-06 | Funcional (simulado) | 4 |
| `S-04` | Auditor cannot change limit (*auditor*) | CON-01, CON-06 | Funcional (simulado) | 2 |
| `S-05` | Configure rate/tokens/budget action alert/throttle/block | FIN-02, CON-06 | Sin recorrido | 1 hasta bloqueo |
| `S-06` | Edit model tariffs and breakdown by model | FIN-01, CON-06 | Sin recorrido | 1 hasta bloqueo |
| `S-07` | View attributed historical person spend | FIN-03 | Parcial | 1 hasta bloqueo |
| `S-08` | Inspect alerts at 50/80/100 thresholds | FIN-02, CON-06 | Sin recorrido | 1 hasta bloqueo |
| `S-09` | Invalid budget input is rejected without state mutation (*invalid value*) | CON-06, FIN-02 | Funcional (simulado) | 4 |

## Audit

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `E-01` | Find a trace ID and read its decision | EVD-02 | Funcional (simulado) | 3 |
| `E-02` | Inspect technical rule details | CON-02, EVD-03 | Funcional (simulado) | 3 |
| `E-03` | Combine period, model, tool, channel and connection filters | EVD-02 | Sin recorrido | 1 hasta bloqueo |
| `E-04` | Reconstruct correlated multi-step transaction | EVD-05 | Sin recorrido | 2 hasta bloqueo |
| `E-05` | Inspect administrative changes with old/new value | EVD-04 | Sin recorrido | 1 hasta bloqueo |
| `E-06` | Prove Object Lock immutability with denied delete | EVD-06 | Sin recorrido | 2 hasta bloqueo |
| `E-07` | Identify missing evidence explicitly | EVD-01, CON-02 | Funcional (simulado) | 2 |
| `E-08` | Clear nonmatching trace search and restore results (*clear filters*) | EVD-02 | Funcional (simulado) | 3 |

## Workspace

| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |
| --- | --- | --- | --- | ---: |
| `G-01` | Open appearance drawer and switch theme | CON-02 | Funcional (simulado) | 2 |
| `G-02` | Reset workspace after confirmation | CON-01 | Funcional (simulado) | 3 |
| `G-03` | Cancel reset without losing workspace (*cancel reset*) | CON-01 | Funcional (simulado) | 3 |
| `G-04` | Launch and progress guided tour | CON-08 | Funcional (simulado) | 2 |
| `G-05` | Enter actual presentation mode at 1080p | CON-08 | Sin recorrido | 1 hasta bloqueo |
| `G-06` | Reach evidence from agent catalog in three clicks | EVD-05, CON-02 | Parcial | 3 hasta bloqueo |

## Límite del método

Los recorridos se ejecutan en la UI de muestra con datos sintéticos y un navegador real. No hay llamadas a AWS, OIDC, Cedar, MCP ni servicios de evidencia. La presencia de botones, sus simulaciones y el resultado de una acción en memoria no demuestran autorización ni persistencia del producto final.
Las ausencias se corroboraron contra el código de las vistas, sus acciones y el modelo de estado. Las pruebas de ausencia son detectores de regresión del *inventario de brechas*: no sustituyen pruebas del comportamiento requerido una vez que se implemente.

