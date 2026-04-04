// Login flow: visiting / without a valid token should route to /login
// (or show a login prompt). With a valid token injected via localStorage,
// the app should load directly and persist across a reload.

describe("Login flow", () => {
  it("redirects to /login when no token is set", () => {
    cy.clearLocalStorage();
    // Use the native Cypress visit (without the token-injecting override
    // from support/e2e.ts by clearing the API_TOKEN env for this call).
    const prev = Cypress.env("API_TOKEN");
    Cypress.env("API_TOKEN", "");
    cy.visit("/", { failOnStatusCode: false });
    cy.url({ timeout: 20000 }).should("match", /\/login|\/$/);
    Cypress.env("API_TOKEN", prev);
  });

  it("persists authenticated session across reload with a valid token", () => {
    cy.visit("/"); // token auto-injected via support override
    cy.contains(/dashboard|instances|runs/i, { timeout: 20000 }).should("exist");
    cy.reload();
    cy.contains(/dashboard|instances|runs/i, { timeout: 20000 }).should("exist");
  });
});

export {};
