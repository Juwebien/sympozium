# Plan

## Design

Add a narrow read-only integration layer rather than extending the existing Sympozium Kubernetes API client. The OpsClaw API has a different routing base and should not inherit Sympozium namespace behavior.

## Implementation Steps

1. Add `web/src/lib/opsclaw-api.ts` with typed contracts, envelope unwrapping, bearer token forwarding, and configurable base URL.
2. Add dedicated React Query hooks for the profile and read model.
3. Add a dense operational console page with status cards, read-model view table, action manifest table, and guardrails.
4. Wire `/opsclaw-console` into the protected router and sidebar.
5. Add a Vite dev proxy for `/opsclaw` to the local control-plane API.
6. Add Cypress coverage with intercepted OpsClaw API responses.
7. Record evidence in this repo and the product specs that reference the Sympozium WebUI handoff.

## Risks

- OpsClaw API availability can differ from the Sympozium API availability. The page must isolate that failure.
- Reusing the Sympozium API client would accidentally append namespace query parameters. The implementation avoids that.
- Future permissioned writes must be added only behind the OpsClaw action manifest, auth gate, audit event, and rollback policy.

## Rollback

Remove the route, sidebar entry, OpsClaw client, hooks, page, Cypress spec, and dev proxy. The change is frontend-only and does not alter runtime CRDs or product APIs.
