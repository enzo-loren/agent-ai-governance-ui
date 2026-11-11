# Agent Governance UI

Frontend for inspecting AI agents, tool execution paths, identity attribution, policy decisions, approvals, and spending.

![Agent Governance interface](docs/preview.webp)

## Development

Requires Node.js 20 or later. No third-party packages.

```bash
npm run dev     # http://127.0.0.1:4173
npm run check   # syntax and automated tests
npm run build   # static site in dist/
```

## Application

The navigation includes **Overview, Catalog, Activity, Rules, Approvals, Spending, Audit,** and **Integrations**.

- **Catalog** groups agents, tools, and people. Each tool shows its execution route, approval, and current policy handling; people appear only when identified in recorded requests.
- **Integrations** lets the operator switch connections B and C for each agent. Changes affect current tool handling and subsequent events, not the history recorded in Activity and Audit.
- **Rules** distinguishes observing decisions from enforcing them. Critical tool actions may require another person's approval.
- **Appearance** contains the theme controls and workspace reset.

The connection model follows [the platform requirements](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml):

| Connection | Scope |
| --- | --- |
| A · Inference | Model requests, responses, declared tool calls, and model usage |
| B · MCP | Actual execution of tools routed through the gateway; other tools remain outside it |
| C · Identity | End-user identity on requests that carry a valid user token |

A is required; B and C are independent and can have partial adoption. Observing a tool call through A does not control an execution outside B.

The interface uses browser-side scenarios and local storage. It does not connect to a backend or implement AWS, Cedar, MCP, or OIDC enforcement.

## Code

| Path | Responsibility |
| --- | --- |
| `src/data.js` | Agents, tools, events, and policy fixtures |
| `src/domain.js` | Connection and decision logic |
| `src/views.js` | Screens, drawers, and dialogs |
| `src/app.js` | Navigation, interactions, and persistence |
| `src/styles/tokens.css` | Color palettes, semantic colors, spacing, and typography |
| `src/styles/app.css` | Layout and components |
| `tests/` | Domain and UI tests |
| `.github/workflows/` | Pull-request checks and static-site publishing |

Components use semantic design tokens; new palettes belong in `src/styles/tokens.css`, not individual component rules.

## Design and requirements

- [Screen-to-requirement mapping and known gaps](docs/traceability.md)
- [UX rationale](docs/ux-rationale.md)
- [Editorial decisions](docs/editorial-board.md)
- [QA notes](docs/qa-notes.md)
