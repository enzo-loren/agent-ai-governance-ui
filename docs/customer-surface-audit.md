# Customer-surface audit: separating operations from test controls

**Basis:** `insumo/requisitos.yaml` and the connected UX/policy requirements, the existing 124-journey audit, source templates and browser tests in this repository. **Scope:** the customer-facing workspace, not a deployed API. Reviewed 12 November 2026.

## Customer expectation

A customer should encounter agent administration, tool review, policy configuration, request activity, approvals, spending investigation and audit. A test operator should have a different place to create synthetic requests and change fixture state. Mixing them makes an ordinary customer screen look like an internal demonstration; it also weakens testing because the same view being tested contains the controls that fabricate its evidence.

## Customer-facing surfaces reviewed

| Surface | Previously exposed | Change | Intended customer task |
| --- | --- | --- | --- |
| Top bar | Large `Demo`, user-selectable **View as**, presentation icon | Removed from the console; current role is displayed as read-only | Identify workspace and access role |
| Help drawer | `Product requirements` link to thesis repository, tour/testing instructions | Removed; help describes how to navigate and investigate | Find an agent, rule, connection or decision |
| Home | Prominent Tour entry | Removed | Find pending work and recent activity |
| Agent overview | **Try a request**, person picker, four synthetic request buttons | Entire test panel removed; links to real workspace destinations retained | Understand configuration and recent activity |
| Rules | Test request and synthetic identity picker | Removed; preview/apply/confirm and rule editing remain | Compare and manage policies without accidental writes |
| Catalog / Tools | **Discover tool** button that inserted a fictitious record | Removed; discovery test lives in Request Studio | Review tools actually present in the catalog |
| Tool detail | **Update schema** button that fabricated a revision | Removed; simulated schema revision is submitted from Request Studio | Inspect revision and review classification/supervision |
| Activity | **Generate request**, Pause/Replay of an in-memory feed | Removed; filters, traces and explanations remain | Investigate observed requests |
| Approvals | **Review as** impersonation picker and manual **Expire request** | Read-only reviewer label; expiration test moved | Review a specific held operation |
| Appearance | Reset all fixture data | Removed from customer settings, moved to Request Studio | Customize personal display preferences |
| Audit / Evidence | Event reason said 'demonstration' and a previous fake S3 response | Neutral recorded-status copy; `Not verified` retained when no proof exists | Inspect evidence without invented guarantees |

**Not removed:** `Previewing` a policy, `Would block`, `Outside gateway`, `Not verified`, and unissued/unknown connection state. These describe genuine operational distinctions required to interpret an action. Their presence is not a marketing disclaimer.

## Test environment

[`test-console.html`](../test-console.html) is a standalone page named **Request Studio**, intentionally absent from the customer sidebar and Help. It uses a `POST`-shaped in-browser adapter with editable JSON, scenario templates, explicit status/response bodies, trace links, counters and a return link to the workspace.

The local handler has the following endpoints:

| Method / path | State transition |
| --- | --- |
| `POST /v1/model-requests` | Inject model request into activity and update spending |
| `POST /v1/tool-invocations` | Evaluate tool routing/decision without inventing model cost |
| `POST /v1/tools/discoveries` | Insert an unclassified tool requiring review |
| `POST /v1/tools/schema-revisions` | Bump schema version and invalidate previous approval |
| `POST /v1/approvals/expire` | Move a pending approval to expired |
| `POST /_test/session/role` | Choose operator, approver or auditor for UI-permission tests |
| `POST /_test/session/reviewer` | Set the example reviewer for separation-of-duties tests |
| `POST /_test/workspace/presentation` | Exercise presentation layout |
| `POST /_test/workspace/reset` | Restore synthetic fixtures with explicit confirmation |

These are **function calls inside the browser**, not HTTP routes served by GitHub Pages. They share the local data repository (`src/mock/backend.js`) with the main workspace on the same origin. `test-console.html` is not an authorization or isolation boundary; its purpose is to keep operational UI free of fixture controls.

## Measured regressions

The previous **124 Home-origin journeys** included 13 actions that existed solely to manipulate synthetic data, identity or layout. These IDs were archived in [`qa/studio-migrated-journals.json`](../qa/studio-migrated-journals.json), not silently counted as current product completions.

After the split the **111 customer journeys** were rerun: 92 complete in the sample UI, 19 remain partial because they require real backend behavior, and zero fail their browser oracles. Roles needed to test customer permissions are established in test setup, not counted as a user action. The steps in [`journey-matrix.md`](journey-matrix.md) were regenerated accordingly. This is a task-based UX audit, not security coverage.

Additional evidence: 94 Node tests, Request Studio Chromium walkthrough at 1100 px and 390 px, and a compiled-site smoke across seven widths. GitHub Actions repeats these checks; see the PR for the final CI conclusion.

## Remaining platform dependencies

Request Studio cannot establish JWT verification, actual MCP interception, model-provider billing, Cedar compilation, server-side permissions, Object Lock immutability, or backend throughput. The in-browser repository's revision checks are also not atomic across concurrent tabs. The underlying requirements remain unchanged, including the explicit `CON-04` coverage-index deviation in [`traceability.md`](traceability.md).
