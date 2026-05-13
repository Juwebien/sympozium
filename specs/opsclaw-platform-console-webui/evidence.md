# Evidence

## 2026-05-13 - Spec Draft

Created a repo-local spec-kit package for a read-only OpsClaw platform console route inside Sympozium WebUI.

## 2026-05-13 - Local Implementation Slice

Changed paths:

- `web/src/lib/opsclaw-api.ts`
- `web/src/hooks/use-opsclaw-api.ts`
- `web/src/pages/opsclaw-console.tsx`
- `web/src/App.tsx`
- `web/src/components/layout/sidebar.tsx`
- `web/vite.config.ts`
- `web/cypress/e2e/opsclaw-console.cy.ts`
- `web/cypress/e2e/sidebar-hierarchy.cy.ts`
- `web/src/components/ensemble-builder.tsx`
- `web/src/components/ensemble-canvas.tsx`
- `specs/opsclaw-platform-console-webui/{spec.md,plan.md,tasks.md,evidence.md}`

Result:

- Added the protected `/opsclaw-console` route in the Sympozium WebUI.
- Added a separate OpsClaw API client that forwards the existing bearer token, defaults to `VITE_OPSCLAW_API_BASE` or `/opsclaw-api`, unwraps OpsClaw envelopes, and does not append Sympozium namespace query parameters.
- Added read-only profile/read-model hooks and a dense operational page for views, actions, write policy, guardrails, and disconnected API state.
- Added the sidebar entry under Infrastructure.
- Added a Vite dev proxy from `/opsclaw-api` to the local OpsClaw control-plane port.
- Added Cypress coverage with mocked OpsClaw contract endpoints.
- Fixed existing ReactFlow TypeScript drift in `ensemble-builder.tsx` and `ensemble-canvas.tsx` so the WebUI build can pass on the current dependency set.

Commands:

```bash
cd /home/ju/projects/opstech-platform/repos/sympozium/sympozium
../../opsclaw-product/tools/specops/validate-spec.sh specs/opsclaw-platform-console-webui

cd /home/ju/projects/opstech-platform/repos/sympozium/sympozium/web
npm install
npm run build
npx cypress install
CYPRESS_BASE_URL=http://127.0.0.1:5174 CYPRESS_API_TOKEN=test-token npx cypress run --spec cypress/e2e/opsclaw-console.cy.ts
```

Outcome: all passed locally. The Vite build completed with the existing large chunk warning.

CI: not run yet.
Image: not built in this local slice.
