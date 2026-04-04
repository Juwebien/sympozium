// PersonaPack channel binding: enable a pack with a channel configured →
// verify the channel binding shows up on the stamped instance detail page
// and persists across a reload.

const PACK = `cy-ppch-${Date.now()}`;
const PERSONA = "notifier";
const STAMPED_INSTANCE = `${PACK}-${PERSONA}`;

function authHeaders(): Record<string, string> {
  const token = Cypress.env("API_TOKEN");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

describe("PersonaPack — channel binding", () => {
  after(() => {
    cy.deletePersonaPack(PACK);
    cy.deleteInstance(STAMPED_INSTANCE);
  });

  it("stamps a persona with a channel binding and surfaces it on instance detail", () => {
    cy.request({
      method: "POST",
      url: "/api/v1/personapacks?namespace=default",
      headers: authHeaders(),
      body: {
        name: PACK,
        enabled: true,
        description: "channel binding test",
        baseURL: "http://host.docker.internal:1234/v1",
        authRefs: [{ provider: "lm-studio", secret: "" }],
        personas: [
          {
            name: PERSONA,
            systemPrompt: "You notify via channel.",
            model: "qwen/qwen3.5-9b",
            channels: ["slack"],
          },
        ],
      },
      failOnStatusCode: false,
    });

    cy.visit("/instances");
    cy.contains(STAMPED_INSTANCE, { timeout: 30000 }).should("be.visible").click();

    // Instance detail should mention the slack channel binding somewhere.
    cy.contains(/slack/i, { timeout: 20000 }).should("exist");

    // Reload — the binding must still be there (persistence).
    cy.reload();
    cy.contains(/slack/i, { timeout: 20000 }).should("exist");
  });
});

export {};
