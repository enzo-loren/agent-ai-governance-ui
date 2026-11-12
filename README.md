# Agent Governance

The workspace uses original [Morris & Opazo brand assets](https://github.com/christophernavarro/Governance-AI/commit/506ae122032c0f98d250287b5d25374dde07dab2) vendored in `assets/branding/`, including the [official site wordmark](https://www.morrisopazo.com/wp-content/uploads/2026/07/logo-morrisopazo.png). The official wordmark has exactly the same Git blob hash as the already vendored `morris-wordmark.png` (`e3d96b14...`), so no duplicate binary is kept. The transparent white logo is rendered dark with a CSS filter on light backgrounds and unmodified white in dark mode. This avoids a forced dark container and works with all user-selectable palettes. The blue `morris-mark.png` is retained for the favicon and narrow-screen header. Request Studio uses the same wordmark and product lockup.

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

Agent registration exposes a model `BASE_URL` and a one-time agent credential. Newly registered agents appear as **Awaiting connection** until their first authenticated inference request is submitted from [Request Studio](test-console.html) and recorded with a trace ID. Open the standalone studio at `test-console.html?agent=<agent-id>`, paste the key in the separate credential field, and send the preselected request. The customer-facing workspace does not link to the test harness. The catalog and agent details update from the shared workspace event. In this static workspace, issuance is local and does not authenticate a deployed gateway; credential hashes and metadata are persisted, never the raw value. Live keys, gateway authentication, and revocation guarantees require the platform API.

The tool catalog review workflow and an approval for one specific tool execution remain separate. Tool approval does not imply that local execution is routed through the gateway.

## Sharing the workspace

The root URL is the Overview sharing entry point. Its Open Graph and Twitter Card metadata point to `assets/social/overview-og.png` (1200 × 630), a locally hosted social preview built from a real Chromium render of the current Overview (not an outdated screenshot). The source of truth for regeneration is `scripts/render_social_preview.py`. Share `https://enzo-loren.github.io/agent-ai-governance-ui/` to use this preview. Routes after `#` are client-side and cannot supply individual per-agent social previews.

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
