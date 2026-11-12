# Agent Governance UI

An interactive governance console for reviewing agents, tool access, policies, model requests, spending and decisions. Its hosted demo uses an in-browser data service with deterministic fixtures.

**Environment:** browser-hosted demonstration. The data adapter keeps sample configurations and requests separate from the UI. Production authorization, routing and immutable evidence are not provided by this repository.

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
python qa/test_mock_boundary.py
```

The [deep UX and data audit](docs/deep-ux-data-audit.md) records corrected data contradictions, requirements still depending on platform services, and evidence limits. The [mock data contract](docs/mock-backend-contract.md) describes the in-browser adapter.

The [journey matrix](docs/journey-matrix.md) records every tested task and alternative, its steps from Home and its outcome. The [audit](docs/user-journey-audit.md) separates working simulated UI paths from capabilities that still require backend integration. CI checks JavaScript behavior, browser interactions and the generated static distribution.

## Structure

- `src/mock/fixtures.js`: deterministic agents, tools, users, events and scenarios.
- `src/mock/backend.js`: versioned in-browser workspace repository (replaceable by HTTP).
- `src/data.js`: policy and navigation definitions.
- `src/domain.js`: simulation state and decision rules.
- `src/views.js`: primary navigation and screens.
- `src/operations.js`: tool review and other task workflows.
- `src/router.js`: shareable cross-view filter URLs.
- `src/app.js`: event handling, local UI state and coordination with the adapter.
- `src/styles/tokens.css`: palette and semantic design tokens.
- `qa/`: browser journeys and measurable outcomes.
- `docs/`: requirement mapping, audits and editorial decisions.

The source of truth is [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), with [`03-politicas-y-estado-inicial.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/03-politicas-y-estado-inicial.md) and [`04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md) as context. The UI favors operational catalog statuses over a numerical coverage index; this differs from the unmodified `CON-04` requirement and is tracked in [traceability](docs/traceability.md).
