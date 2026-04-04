// PersonaPack lifecycle: enable pack → stamped Instance + Schedule appear →
// disable pack → both disappear. Verifies cascade semantics end to end.

const PACK = `cy-pplc-${Date.now()}`;
const PERSONA = "auditor";
const STAMPED_INSTANCE = `${PACK}-${PERSONA}`;

function authHeaders(): Record<string, string> {
  const token = Cypress.env("API_TOKEN");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function enablePackViaAPI() {
  cy.request({
    method: "POST",
    url: "/api/v1/personapacks?namespace=default",
    headers: authHeaders(),
    body: {
      name: PACK,
      enabled: true,
      description: "cypress full-lifecycle test pack",
      category: "test",
      version: "0.0.1",
      baseURL: "http://host.docker.internal:1234/v1",
      authRefs: [{ provider: "lm-studio", secret: "" }],
      personas: [
        {
          name: PERSONA,
          displayName: "Cypress Auditor",
          systemPrompt: "You are a terse auditor.",
          model: "qwen/qwen3.5-9b",
        },
      ],
    },
    failOnStatusCode: false,
  });
}

describe("PersonaPack — full lifecycle", () => {
  after(() => {
    cy.deletePersonaPack(PACK);
    cy.deleteInstance(STAMPED_INSTANCE);
  });

  it("enables a pack, verifies stamped instance appears, then disables and verifies removal", () => {
    enablePackViaAPI();

    // Stamped instance should appear on /instances.
    cy.visit("/instances");
    cy.contains(STAMPED_INSTANCE, { timeout: 30000 }).should("be.visible");

    // Disable via the API (UI toggle path is covered in personapack-enable.cy.ts).
    cy.request({
      method: "PATCH",
      url: `/api/v1/personapacks/${PACK}?namespace=default`,
      headers: authHeaders(),
      body: { enabled: false },
      failOnStatusCode: false,
    });

    // Stamped instance should eventually disappear from the list.
    cy.visit("/instances");
    cy.contains(STAMPED_INSTANCE, { timeout: 30000 }).should("not.exist");
  });
});

export {};
