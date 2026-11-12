# Agent Governance UI

A static, interactive reference interface for reviewing agents, their tools, policies, requests and operational decisions. The application uses local sample data; changes remain in the browser.

**Status:** frontend prototype. It does not authenticate users, issue credentials, route inference or MCP requests, execute Cedar, or validate S3 evidence. The role and identity selectors illustrate expected product behavior rather than enforce authorization.

## Product areas

| Area | Available workflow in the prototype |
| --- | --- |
| Catalog | Search agents, tools, people and models; inspect a tool; review its classification, approval and supervision |
| Agent details | Edit sample metadata, allowed models and credential status; inspect routing and recorded activity |
| Connections | Inspect model, tool and identity paths; configure example tool destinations and identity settings |
| Rules | Compare presets without applying them, confirm a change, create example parameter rules and inspect history |
| Activity | Filter recorded events, pause the sample feed, add an example request and inspect the decision |
| Approvals | Inspect a pending execution, review masked example arguments, approve/reject with a comment, simulate expiry |
| Spending | Investigate an agent, follow model/person costs into filtered requests and audit traces, inspect alerts, and edit example limits or tariffs |
| Audit | Filter decisions, inspect a sample request timeline and view administrative changes |

**Tool catalog review and approval of a pending execution are separate operations.** Reviewing a tool changes its catalog status; approving an execution authorizes one specific pending request. A tool approved for the catalog is not automatically protected at execution if it remains outside the gateway.

## Verification

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

The [journey matrix](docs/journey-matrix.md) records every tested task and alternative, its steps from Home and its outcome. The [audit](docs/user-journey-audit.md) separates working simulated UI paths from capabilities that still require backend integration. CI checks JavaScript behavior, browser interactions and the generated static distribution.

## Structure

- `src/data.js`: sample agents, tools, requests and policy presets.
- `src/domain.js`: simulation state and decision rules.
- `src/views.js`: primary navigation and screens.
- `src/operations.js`: tool review and other task workflows.
- `src/app.js`: routing, browser state and event handling.
- `src/styles/tokens.css`: palette and semantic design tokens.
- `qa/`: browser journeys and measurable outcomes.
- `docs/`: requirement mapping, audits and editorial decisions.

The source of truth is [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), with [`03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) and [`04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md) as context. The UI favors operational catalog statuses over a numerical coverage index; this differs from the unmodified `CON-04` requirement and is tracked in [traceability](docs/traceability.md).
