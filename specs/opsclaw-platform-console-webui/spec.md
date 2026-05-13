# OpsClaw Platform Console WebUI

## Objective

Expose the OpsClaw platform console contract inside the Sympozium WebUI without moving product ownership into Sympozium.

The page is an operational read model for OpsClaw hosted agents, customers, configuration, filesystem, tools, observability, notifications, and portal apps. Sympozium remains the runtime and UI shell; OpsClaw control-plane remains the source of truth for product data and write authorization.

## Existing System

- Sympozium WebUI already has authenticated routing, grouped navigation, React Query hooks, and a Vite development proxy for the local Sympozium API.
- OpsClaw control-plane exposes static contract endpoints for the platform console profile and read model:
  - `GET /v1/platform-console-profiles/opsclaw-platform-console@v1`
  - `GET /v1/platform-console-read-models/opsclaw-platform-console-read-model@v1`
- The OpsClaw contract declares permissioned writes, audit event names, rollback policy, required scopes, and the source API for each action.
- The read model is currently contract-backed and read-only. It is suitable for display, not for direct mutation.

## Scope

Implement a dedicated Sympozium WebUI page at `/opsclaw-console` that:

- Uses the existing Sympozium bearer token storage for requests.
- Calls OpsClaw through a separate configurable API base, defaulting to `/opsclaw-api`.
- Does not append the Sympozium namespace query parameter to OpsClaw requests.
- Displays the platform profile, read model views, permissioned actions, guardrails, and blocked writes.
- Shows a clear disconnected state when the OpsClaw API is not reachable.
- Adds a dev proxy from `/opsclaw-api` to the OpsClaw control-plane local port.

## Out of Scope

- Implementing write forms for permissioned actions.
- Persisting OpsClaw data in the Sympozium repo.
- Adding direct product policy or tenant state to Sympozium CRDs.
- Creating GitOps or image promotion changes.
- Adding secrets to the WebUI.

## Source of Truth

- OpsClaw control-plane owns product contracts, tenant and agent source APIs, plan policy, portal policy, filesystem policy, notification policy, and observability policy.
- Sympozium WebUI owns the local presentation shell and route.
- GitOps owns runtime deployment and promoted image versions.

## Acceptance

- The route `/opsclaw-console` renders behind existing Sympozium auth.
- The page reads the OpsClaw platform console profile and read model from the configured OpsClaw API base.
- The sidebar exposes the new page under Infrastructure.
- Unitless frontend build passes.
- A Cypress route test can verify the page with mocked OpsClaw API responses.
- The product repo specs `sympozium-platform-console` and `sympozium-opsclaw-unification` are updated with evidence for this handoff.
