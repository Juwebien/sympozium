const profile = {
  id: "opsclaw-platform-console",
  version: "v1",
  displayName: "OpsClaw platform console",
  readiness: "contract_only",
  audience: ["internal_operator", "tenant_operator_future_scope"],
  views: [
    {
      id: "agents",
      displayName: "Agents",
      sourceApi: "/v1/agent-instances",
      state: "planned_read_only",
      scopes: ["operator", "tenant"],
    },
  ],
  actions: [
    {
      id: "agent_create_update_delete",
      displayName: "Create, update, or delete agent personas",
      targetView: "agents",
      mode: "permissioned_write",
      state: "available_with_tenant_pat_durable_authoring_store",
      method: "POST/PUT/DELETE",
      sourceApi: "/v1/agents + /v1/agents/{id}",
      preflightApi: "/v1/personas/catalog + /v1/agents/{id}/versions",
      requiredScopes: ["tenant"],
      authGate: "tenant_pat_principal_plus_role_tier_policy",
      auditEvent: "agents/create|agents/update|agents/delete",
      rollbackPolicy:
        "soft_delete_for_delete_and_persona_version_rollback_for_update",
      evidenceRefs: [
        "specs/sympozium-platform-console/evidence.md",
        "specs/offer-catalog-three-sku/evidence.md",
      ],
    },
  ],
  writePolicy:
    "action_manifest_declared_console_writes_disabled_except_permissioned_agent_authoring",
  guardrails: {
    allowedActionModes: ["read_only", "propose_only", "permissioned_write"],
    disallowedClaims: [
      "console_as_source_of_truth",
      "write_action_without_audit",
    ],
  },
};

const readModel = {
  id: "opsclaw-platform-console-read-model",
  version: "v1",
  displayName: "OpsClaw platform console read model",
  readiness: "read_only_local",
  profileRef: "opsclaw-platform-console@v1",
  views: [
    {
      id: "agents",
      displayName: "Agents",
      sourceApi: "/v1/agent-instances",
      projection:
        "agent_instance_list_with_runtime_readiness_sku_bot_workspace_and_config_summary",
      state: "read_only",
      requiredScopes: ["operator", "tenant"],
    },
    {
      id: "tools",
      displayName: "Tools and MCPs",
      sourceApi: "/v1/tooling-matrix-profiles/opsclaw-agent-tooling-matrix@v1",
      projection: "tooling_status_by_sku_runtime_auth_mode_user_status",
      state: "read_only",
      requiredScopes: ["operator", "tenant"],
    },
  ],
  blockedWrites: [],
  guardrails: {
    allowedActionModes: ["read_only"],
    disallowedClaims: ["console_as_source_of_truth"],
  },
};

describe("OpsClaw Console", () => {
  it("renders the OpsClaw platform console contract without live API access", () => {
    cy.intercept(
      "GET",
      "/opsclaw-api/v1/platform-console-profiles/opsclaw-platform-console@v1",
      { success: true, data: profile },
    ).as("profile");
    cy.intercept(
      "GET",
      "/opsclaw-api/v1/platform-console-read-models/opsclaw-platform-console-read-model@v1",
      { success: true, data: readModel },
    ).as("readModel");

    cy.visit("/opsclaw-console", {
      onBeforeLoad(win) {
        win.localStorage.setItem("sympozium_token", "test-token");
        win.localStorage.setItem("sympozium_namespace", "default");
      },
    });

    cy.wait(["@profile", "@readModel"]);
    cy.contains("h1", "OpsClaw Console").should("be.visible");
    cy.contains("Product platform read model").should("be.visible");
    cy.contains("Read Model").should("be.visible");
    cy.contains("Agents").should("exist");
    cy.contains("Tools and MCPs").should("exist");
    cy.contains("Action Manifest").should("exist");
    cy.contains("permissioned_write").should("exist");
    cy.contains("console_as_source_of_truth").should("exist");
  });
});

export {};
