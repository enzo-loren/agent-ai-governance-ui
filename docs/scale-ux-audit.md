# Multi-agent interface audit

**Review date:** 2026-11-11  
**Source:** [`insumo/contexto/04-ux.md`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/contexto/04-ux.md) and [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml)  
**Scope:** navigation, filtering, bounded rendering, and agent-specific context. This is a review of the browser interface, not an assertion that the target backend supports these operations.

## Design rule

Use one agent-selection pattern for configuration: a searchable directory and the same agent detail page. Use searchable, bounded collections for operational records. An agent-specific link must preserve that agent in the destination. Global views must make their scope visible rather than silently selecting the first agent.

## Screen-by-screen findings

| Area | Previous issue | Change in this branch | Remaining implementation dependency |
| --- | --- | --- | --- |
| Overview | First four agents were shown without identifying the subset | Show "N of M agents" beside the list and keep the direct link to Catalog | Action-based ordering requires reliable live alerts and periods; do not infer incidents from arbitrary fixtures |
| Catalog / Agents | Directory already had search and incremental cards | Reused as the selection pattern for Rules; preserved name, team, and owner search | Querying thousands of agents requires a server-backed directory and access-aware filtering |
| Catalog / Tools | Entire tool table was rendered regardless of size | Initially show 30 matching tools; load further results explicitly | Tool inventory is currently a static fixture and must become a queried MCP/inference inventory |
| Catalog / People | Rows for every agent were rendered | Limit the initial list to 24 agents; retain the named-versus-unidentified distinction | Identity and request observations require a defined reporting period and server-side aggregation |
| Connections | Previously corrected in PR #4: directory and agent-scoped configuration | Retained the shared directory; Rules uses the same pattern | Setup switches do not implement real routing, OIDC, or secret provisioning |
| Rules | Native agent dropdown became unwieldy as agents increased, and linked pages could lose context | Searchable agent directory; `Agent → Rules` tab; links back to the exact agent's Connections | Rule authoring, inheritance, bulk assignment, audit of rule revisions, and policy conflict detection remain backend/product requirements |
| Activity | A second all-agent dropdown, a global Test button hardwired to Atlas, and a full unbounded event table | Separate search fields for events and agents; 30 visible rows; exact agent routes; test only when an agent is selected | Real-time transport, retention, sorting by timestamp, server-side searching, and event pagination must be implemented by an API |
| Approvals | Pending and reviewed requests could grow into one long page | Pending/Reviewed/All filters, requester/action/agent search, actionable-first pending order, 20 visible rows, and agent-scoped links | Expires-at timestamps, concurrency control, reviewer assignment, and authorization must be enforced on the server |
| Spending | Every budget was rendered; filtering to one agent required leaving the view; earlier identity attribution disappeared from the view after C was toggled off | Search agent/team/owner, 24-agent budget batches, agent-scoped totals, bounded person list, and historical attribution retained as historical data | Actual billing records, consistent attribution periods, rate cards, and costs from outside the gateway must be modeled and reconciled |
| Audit | Search results could render every event at once, with no agent-specific entry point | 30 rows initially, incremental results, exact agent routes, trace/person/action search | Immutable evidence, query pagination, full time filters, and correlation across multi-step workflows require real stored events and identifiers |
| Appearance / Reset | Reset did not reset search/filter state, leaving apparently missing agents in a restored workspace | Clear filters and list limits alongside restoring the sample workspace | None beyond the simulation boundary |

## Multi-step workflows are not yet a first-class object

The current browser state has **individual events and trace IDs**, but no durable `workflow_id`, `session_id`, `parent_trace_id`, or model-to-tool call relationship. Therefore a list of 3,200 individual events is **not** evidence that the UI can reconstruct hundreds of multi-step workflows. A production audit view needs correlating identifiers, event ordering, causal links, and a flow-detail view for each grouped request. These elements must originate in the backend's event model, not be guessed by grouping records by time or agent.

A complete production implementation must also move agent/event/approval queries, filtering, pagination, and sorting server-side. The current "Show more" limits browser DOM rendering, but still evaluates local arrays. It does **not** benchmark network throughput, event delivery, or database query performance.

## Verification

- `npm run check`: 53 passing Node tests, including 120 agents, 3,210 events, 422 approval records, exact agent deep links, filtered cost totals, and bounded views.
- `npm run build`: static bundle completed.
- Chromium checks at **1440 × 900** and **390 × 844**: Rules directory → agent policy → Connections, Activity agent filter, Audit, Approvals, Spending, load more with 120 agents, and 3,200 added events; no JavaScript exceptions or document-level horizontal overflow observed.
- Tests cover frontend behavior and rendering. They do not establish accessibility conformance, real-time performance, end-to-end authentication, or backend enforcement correctness.

## Editorial boundary

The interface uses short labels and answers the immediate operational question. These editorial decisions, unresolved requirements, and test limitations belong in this review and the commit messages rather than in explanatory banners on every screen. The numerical coverage index required by the current `CON-04` remains a separately documented design deviation.
