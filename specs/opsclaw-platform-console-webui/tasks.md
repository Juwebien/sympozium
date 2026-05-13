# Tasks

## Task: Add read-only OpsClaw console route

Owner: Codex

Repo area: `repos/sympozium/sympozium`

Paths allowed:

- `web/src/App.tsx`
- `web/src/components/layout/sidebar.tsx`
- `web/src/hooks/use-opsclaw-api.ts`
- `web/src/lib/opsclaw-api.ts`
- `web/src/pages/opsclaw-console.tsx`
- `web/vite.config.ts`
- `web/cypress/e2e/opsclaw-console.cy.ts`
- `web/cypress/e2e/sidebar-hierarchy.cy.ts`
- `specs/opsclaw-platform-console-webui/*`

Paths forbidden:

- `api/`
- `cmd/`
- `controllers/`
- `config/`
- Kubernetes manifests
- Any OpsClaw product repo implementation paths from this Sympozium task

Acceptance command:

```bash
../../opsclaw-product/tools/specops/validate-spec.sh specs/opsclaw-platform-console-webui
cd web && npm run build
```

Evidence expected:

- Build output recorded in `evidence.md`.
- Product specs updated with the Sympozium WebUI handoff evidence.

Rollback:

- Revert the frontend route, page, client, hook, Vite proxy, Cypress spec, and sidebar entry.

Stop conditions:

- Stop if the implementation needs to store OpsClaw secrets in the WebUI.
- Stop if a write action is requested without the OpsClaw action manifest, auth gate, audit event, and rollback policy.
- Stop if the page requires changing Sympozium runtime CRDs.

Runner impact:

- None. The task is WebUI-only.

Image impact:

- None in this local slice. A future Sympozium web image build can include the route.

GitOps impact:

- None in this local slice. Runtime rollout requires the usual image digest promotion later.

SOPS/secret impact:

- None. The WebUI forwards the existing bearer token and does not add secrets.
