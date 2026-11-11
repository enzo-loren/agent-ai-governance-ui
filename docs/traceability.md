# Screen-to-requirement mapping

**Sources:** [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml); [`insumo/contexto/04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md); [`insumo/contexto/03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md); [the deployed guide](https://enzo-loren.github.io/ai-governance-platform-docs/); [`assets/console-data.json`](https://github.com/enzo-loren/ai-governance-platform-docs/blob/main/assets/console-data.json). The **requirements YAML governs** if another document disagrees.

| Previous screen(s) | New destination | Mapped scope (not implemented backend) |
| --- | --- | --- |
| S0 agent registration | Catalog → Add agent; Agent detail | REG-02, CON-01: per-agent credential display is one-time *only in simulation* |
| S0 live flow | Activity | CON-03, CON-02: event status, reason, filters, pause (simulated, not under-3-second backend latency) |
| S1 agent governance | Catalog → Agent detail, Integrations | CON-04, POL-03: tool-by-tool routing, observed identities and connection gaps. **The CON-04 coverage index is intentionally not shown in this UI** (see deviation below). |
| S1 tool inventory | Catalog → Tools | INF-02, CON-07: class and approval state (sample metadata) |
| S1 shadow evaluation | Activity → Would block; Rules | POL-01, REG-01: Observe previews denials; do not claim active enforcement |
| S2 agent mode and suspension | Agent detail, Rules | REG-01, REG-03, INF-05: confirm Enforce, pause and restore, with B-boundary caveat |
| S2 spending and limits | Spending | CON-06, FIN-01/02: simulated spend, daily budget, alerts |
| S3 identity and role | Integrations → C; Agent detail; role preview | IDN-01, GRD-03, CON-01: no live OIDC; do not confuse role preview with real token |
| S3 per-person spending | Spending (future upgrade) | FIN-03: needs actual per-user attribution with C; intentionally not fabricated |
| S4 tool gateway | Integrations → B; Catalog Tools | MCP-01, PLT-02, GRD-04: real execution distinct from model intent |
| S4 policy builder | Rules | POL-04: preset selection simulated; parameter-level Cedar rule editor intentionally deferred |
| S4 connection guide | Integrations → A/B/C drawers | OPS-01: steps and fictitious example snippets; genuine setup remains external |
| S5 approvals | Approvals | HITL-01/02/03, CON-05: reviewer and decision state simulated, separated by role |
| S6 search | Audit | EVD-02: searchable transaction and sample status |
| S6 forensic path | Activity → See why; Audit → detail | EVD-03/05/06: explanation, version and synthetic record, not Object Lock proof |

## Semantic policy boundaries

**Expected platform behavior (source-derived):**

- A always exists. A+B, A+C, and A+B+C are distinct supported combinations, never a compulsory sequence B→C.
- Discovery mode has policies evaluated without their blocking effect for specific controls; authentication, some guardrails and limits may remain active. Do not describe it as bypassing every control.
- A can block or inspect the *model's intent to call a tool*. B centralizes *real calls* to tools via the MCP gateway and provides enforcement on parameters/answers. Unconnected local tools remain outside that control.
- C propagates a verified OIDC end-user token from the customer's application/agent to gateway so identity/role-aware decisions are possible; merely choosing a UI role cannot achieve C.
- When a policy requires B or C and they are absent, do not display the unavailable control as active.
- Suspending inference does not mechanically guarantee an agent cannot execute an external/local tool independently. The mockup makes this limitation visible.
- A complete audit proof needs backend evidence and relevant retention settings; a static frontend cannot verify these properties.

## Prototype coverage and deferred behaviors

**Working simulated interactions:** catalog search, create demo agent, once-visible example key, agent view, A/B/C toggles (except A), simulate inference vs actual tool, Observe/Enforce preview, simulated pause/resume, synthetic traces and status filter, pause synthetic activity feed, preset selection with confirmation, budget update, approval and reviewer role preview, audit search and explanation drawer, guided tour, appearance and reset.

**Not delivered:** actual AWS infrastructure, OpenAI-compatible proxy, secrets issuance, JWT verification, Cedar engine, MCP routing or live tool discovery, immutable S3 evidence, CloudWatch/OpenTelemetry, under-3-second live visibility, production RBAC, per-person cost attribution, parameter-level visual policy editor, a full integrated agent demo, real finops metering. They are architectural requirements, not features validated by this repository.

## Product decision: operational catalog instead of a coverage index (2026-11-11)

This product direction **does not implement the numerical governance coverage index** required in `CON-04` and `insumo/contexto/01-modelo-de-conexion.md`. That requirement remains in the governing source. It must not be silently interpreted as satisfied merely because the catalog now displays individual tools and identities. If this becomes the production UI, the requirement owner must approve a replacement criterion or provide the mandated index in an appropriate, secondary diagnostic surface.

The proposed first-level catalog answers operational questions without a composite score:

- **Agents:** current mode; tools `checked`, `observed`, `need review`, `need identity`, `need a second reviewer`, or `outside gateway`; presence of named users in recent requests.
- **Tools:** each entry retains its class and approval separately from its execution route and policy mode. `B connected` does **not** mean every declared tool is routed: registered MCP tools and locally executed tools are distinguished one by one.
- **People:** display names actually present in recorded requests with C at event time, plus unnamed requests. No fake identity directory is implied. If C is disconnected now, the catalog stops presenting prior named records as current configuration; the historical trace remains available in Audit.
- **Integrations:** A/B/C remains visible, with practical consequences; a toggle affects subsequent requests and current operational status, not historical events.

No tool should be presented as globally "safe" simply because it is approved or routed. Those facts are necessary but insufficient to establish policy outcome, effective role, configured guardrails, or external bypass prevention.

## Agent navigation and terminology

The UI uses **Model requests**, **Tool execution** and **User identity** instead of the connection identifiers A/B/C. The technical specification and implementation still use A/B/C to keep policy, trace and test mappings stable.

The Connections section lists agents with the same searchable card pattern as Catalog. Editing connections takes place within a particular agent (`#/agent/:id/connections`), so selection survives navigation and no global selector is required. Rendering 24 agents initially avoids displaying hundreds of cards at once; backend paging is outside this static implementation.

## High-volume navigation and transaction grouping · 2026-11-11

- **CON-04 / POL-04:** Rules uses the same agent-selection directory as Catalog and Connections, with per-agent policy settings. It does **not** implement a full visual rule constructor or bulk policy rollout.
- **CON-03 / EVD-02:** Activity and Audit search and render bounded batches, preserving agent-specific links. The client-side fixture cannot establish near-real-time delivery, server pagination, immutable evidence, or date-indexed querying.
- **CON-05:** Approvals separates pending and reviewed decisions, supports search, and renders 20 results initially. Reviewer authorization, expiration, and conflicts require a backend.
- **CON-06 / FIN-01 / FIN-03:** Spending provides agent-scoped budgets and a bounded historical per-person view, but its fixture totals do not validate real billing or cost attribution.
- **EVD-05 / EVD-06:** The fixture has trace IDs but no workflow/session/parent relationship. An audit trail across hundreds of multi-step flows requires additional event correlation fields and a dedicated drill-down. See [`scale-ux-audit.md`](scale-ux-audit.md).

## End-to-end user journeys audit · 2026-11-11

The [full journey audit](user-journey-audit.md), [93-case matrix](journey-matrix.md), and [executed browser cases](../qa/journeys.json) trace the console workflows and alternative paths to the governing requirements. The audit records a completed browser interaction separately from backend enforcement; 56 sample-UI paths are functional, 6 are partial, and 31 have no completion path. A known gap must not be interpreted as a passing acceptance test simply because its absence is asserted. A budget form submission bug discovered during the walkthrough is corrected in this branch.
