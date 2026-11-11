# Verification record — 11 Nov 2026

## Checks performed

- **Automated:** `npm run check` — syntax check and 22 unit/markup assertions passed, including A-only tool execution outside B, Observe vs Enforce, role restrictions, state validation, trace IDs and visible demo labels.
- **Interactive browser exercise:** Chromium rendered an inline test bundle of the same frontend code. A tester added an agent; copied an example key; simulated an uncovered local tool; enabled B; saw a “Would block” result; activated Enforce after preview; saw a blocked model request; changed to auditor and confirmed controls were unavailable; switched to approver and reviewed a pending action. No JavaScript errors in that exercise.
- **Visual:** 8 primary routes + agent detail at desktop 1440px, tablet 820px and mobile 390px were captured and checked for horizontal overflow and information hierarchy. The demo is responsive; screenshots were local QA artifacts, not a formal usability study.
- **Contrast focus:** light-appearance muted text tokens adjusted after a contrast audit; WCAG certification remains unclaimed. Icon+text status labels do not rely on color alone.
- **Build:** no npm dependencies, deterministic static `dist/` with HTML/CSS/JS/SVG; GitHub Actions workflow prepared for Pages.

## Known gaps and follow-up acceptance tests

- Run `axe-core` or `@axe-core/playwright` on a normal hosted build and fix any serious/critical findings. This environment's browser proxy blocked direct local navigation, so tests used inline-rendered pages; actual GitHub Pages navigation is still unverified.
- Test NVDA/VoiceOver, touch exploration, keyboard-only order (including dialogs), 200%/400% zoom, and reduced-motion on actual devices.
- Recruit 3–5 non-technical trial users. Ask them to explain the difference between A and B, find a blocked tool, make sense of missing evidence, and change a policy without assuming a live production connection. Record task success, wrong assumptions and confusion words.
- Verify new repository creation, Actions permissions, Pages deployment and final URL. This deliverable prepares the workflow but cannot establish remote status until an authorized repository exists.
- Confirm design token contrast whenever adding palettes, including dark mode.

## High-risk claims to reject

- “Enforce blocks *all* tools”: false without B for the actual execution channel.
- “Audit badge proves immutability”: false; fake data cannot prove storage.
- “Role preview provides security”: false; real OIDC/RBAC must be implemented server-side.
- “A+C and A+B must be installed in sequence”: false; they are independent optional extensions to A.
- “No would-block examples means a policy is safe”: false; only sample data were evaluated.
