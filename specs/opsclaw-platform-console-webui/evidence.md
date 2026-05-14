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

## 2026-05-14 - Post-Merge Activation Evidence

Result:

- Sympozium PR `Juwebien/sympozium#2` merged as `91cccef993a8c9c70a2697f1f729700fba0540f5`.
- Post-merge build run `25844870398` completed successfully with 22/22 jobs green.
- All jobs ran on the homelab ARC label `sympozium-runners`, including format, test, codegen/Helm sync, build, vet, and every `build-and-push` image job.
- The published-image matrix included the platform WebUI-adjacent components and all runtime/tooling images needed by the OpsClaw/Sympozium integration slice.
- The workspace workflow audit found no first-party `ubuntu-latest`, `windows-latest`, `macos-latest`, or `${{ vars.RUNNER... }}` runner indirection outside ignored `node_modules` content.
- `scripts/platform-health.sh --all-repos` returned `dirty=0` for every canonical repo after the merge and local fast-forward.

Validation:

```bash
gh run view 25844870398 --repo Juwebien/sympozium --json status,conclusion,jobs
gh api repos/Juwebien/sympozium/actions/runs/25844870398/jobs --paginate --jq '.jobs[] | [.name,.status,.conclusion,.runner_name,((.labels//[])|join("+"))] | @tsv'
scripts/platform-health.sh --all-repos
```

Sympozium build run: https://github.com/Juwebien/sympozium/actions/runs/25844870398
Verified-By: codex at 2026-05-14T07:05:00Z
