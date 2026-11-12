# Agent Governance

A console for managing AI agents, tool access, connection settings, policies, approvals, spending and request decisions.

## Workspace

The navigation is organized around operator tasks:

| Section | Primary actions |
| --- | --- |
| Catalog | Register agents, obtain one-time connection details, review tools, inspect people and models |
| Connections | Configure model, tool and identity paths for an agent |
| Rules | Preview policy changes, confirm policies and manage rules |
| Activity | Filter requests and inspect the decision for a trace |
| Approvals | Examine and decide held tool executions |
| Spending | Investigate agent costs and reach related requests and audit records |
| Audit | Search decisions, administrative changes and evidence status |

Agent registration exposes a model `BASE_URL` and a one-time agent credential. In this static workspace, issuance is local and does not authenticate a deployed gateway; credential hashes and metadata are persisted, never the raw value. Live keys, gateway authentication, and revocation guarantees require the platform API.

The tool catalog review workflow and an approval for one specific tool execution remain separate. Tool approval does not imply that local execution is routed through the gateway.

## Data and testing

The static site uses a local data repository with synthetic initial records. The presentation does not embed fixture creation controls.

**[Request Studio](test-console.html)** is the separate test page. It takes editable JSON bodies and runs `POST`-shaped requests through a local handler. New traces and tool updates appear in the workspace, and the response supplies direct links for investigation. This is an in-browser transport, **not a hosted API**.

The data modules are `src/mock/fixtures.js`, `src/mock/backend.js`, `src/mock/credentials.js`, and `src/mock/test-api.js`. The customer-facing screens live in `src/views.js` and `src/operations.js`. The same repository can later be backed by an HTTP client without putting test-data creation buttons back into the product.

```bash
npm run check
npm run build
python -m pip install playwright==1.57.0
python -m playwright install chromium
bash qa/run_all.sh
python qa/generate_matrix.py
python qa/test_request_studio.py
python qa/test_extended.py
python qa/test_distribution.py
```

See the [requirement-to-screen audit](docs/requirements-ui-audit.md), [customer-surface audit](docs/customer-surface-audit.md), [data integrity review](docs/deep-ux-data-audit.md), [journey matrix](docs/journey-matrix.md), and [mock contract](docs/mock-backend-contract.md). Requirements remain defined by [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml), not by the UI tests.
