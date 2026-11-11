# UX review: thinking like a first-time operator

**Context.** The predecessor was an educational seven-slice Cloudscape/AWS-style mockup. Meeting notes dated 10 November 2026 requested both: preserve the explanatory guide, and create a product-like **separate** demo. Reviewers wanted less cognitive load, English UI, visible Catalog/Integrations, roles, exact scope and a visual identity independent of AWS.

**Product promise.** "Every agent. One clear view." The first view should orient a beginner within five seconds: *what is connected, what happened, and what needs attention*. Familiar destinations replace framework-oriented navigation. Explanations use "See why", "Would block", "Not covered", and "Approve", with rule IDs and protocols one click deeper.

## Hierarchy and cognitive load

1. **Home answers what matters.** One hero, three summary metrics with periods, an actionable attention strip, known agents and recent decisions; no raw logs and no connection wizard blocking first use.
2. **Catalog is the primary entity directory.** Agents are central; Tools and Models are tabs, avoiding separate sidebar entries for every inventory type. Agent cards show owner, mode and A/B/C without technical paragraphs.
3. **Activity begins with a verdict and reason.** Each event has a status text + icon + short explanation; selection opens an event narrative containing actor, channel, reason, rule version and evidence status. Missing evidence is not shown as success.
4. **Rules requires preview before turning on enforcement.** Mode changes have a deliberate confirmation, not a decorative toggle. Zero preview events are labeled "no sample matches", never "guaranteed safe".
5. **Approvals is a focused inbox.** A reviewer sees an action, its requester and consequence. A dedicated role preview demonstrates separate authority, but cannot be mistaken for real authentication.
6. **Integrations is a user's capability ladder.** A observes, B governs actual tool calls through MCP, C identifies end users. B/C are not a fake linear compulsory order. Missing connections produce visible coverage gaps.
7. **Audit is a reconstruction tool.** Events lead to rule version and explanatory timeline; sample evidence records are explicitly synthetic, not an immutable store.

## Specific changes relative to the previous UI

| Previously prominent | Replacement | Why |
| --- | --- | --- |
| Fundación / slices | Agent workspace and product navigation | Users need tasks rather than implementation milestones |
| Decisión en sombra | Would block / Observe | Describes consequence without implying enforcement |
| Tarjeta de gobernanza | Agent details → Coverage | Describe what the person actually gains |
| Kill Switch | Pause agent + gateway caveat | Avoid implying unconnected local tools are disabled |
| Tools / MCP in different sections | Catalog: Tools; Integrations: B | Separate entity inventory from connection setup |
| Rol / identidad conflated | Role preview vs identity connection C | Prevent simulated authorization being mistaken for OIDC |
| AWS Cloudscape look | Original tokens, sidebar and responsive cards | Avoid confusion with an AWS product and reduce density |
| Dense how-to text | Concise summaries + optional drawers | Progressive disclosure |

## Heuristics / direct test questions

| Standard | Applied principle | Human question to test |
| --- | --- | --- |
| NN/g: visibility of system status | Paused feed, would-block, pending review, missing evidence, toast confirmation | "Did my action work?" |
| NN/g: system–real-world match | Catalog, Activity, Spending and explanation language | "Can I understand this without knowing MCP or Cedar?" |
| NN/g: user control/freedom | Cancel dialogs, observe vs enforce preview, reset demo | "Can I back out safely?" |
| NN/g: consistency | Shared event status pill in home, activity, agent and audit | "Does blocked mean the same everywhere?" |
| NN/g: error prevention | Confirmation on enforcement and review, validates forms | "Will I accidentally break a workflow?" |
| NN/g: recognition not recall | See why, guided tour, connection badges and glossary on demand | "Do I need a manual open?" |
| NN/g: aesthetic minimalism | No first-level YAML/Cedar/JSON, focused cards | "What can I ignore?" |
| Microsoft Human-AI: communicate what system can/cannot do | Repeated demo banner and channel limitation | "What do you actually control?" |
| Google PAIR: feedback and control | Show why, simulation feedback, role preview | "How do I respond to an unexpected decision?" |
| WCAG 2.2 | Text + icon + color status, input labels, focus indicator, reduced motion and responsive views | "Can I use it without a mouse or color perception?" |

**Evidence level:** design intentions and runnable simulations, not usability-study outcomes. Actual novice interviews, automated axe-core scans, keyboard/screen-reader sessions, real mobile device testing and verified latency tests are pending. The QA notes distinguish what has been checked from future validation.
