// Pause + resume a schedule via API, verifying the UI reflects the
// suspended state toggle correctly.

const INSTANCE = `cy-scpr-${Date.now()}`;
const SCHEDULE = `cy-scpr-sched-${Date.now()}`;

function authHeaders(): Record<string, string> {
  const token = Cypress.env("API_TOKEN");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

describe("Schedule — pause and resume", () => {
  before(() => {
    cy.createLMStudioInstance(INSTANCE);
    cy.request({
      method: "POST",
      url: "/api/v1/schedules?namespace=default",
      headers: authHeaders(),
      body: {
        name: SCHEDULE,
        instanceRef: INSTANCE,
        cron: "*/10 * * * *",
        type: "scheduled",
        task: "pause/resume test",
      },
      failOnStatusCode: false,
    });
  });

  after(() => {
    cy.deleteSchedule(SCHEDULE);
    cy.deleteInstance(INSTANCE);
  });

  it("toggles suspend=true then suspend=false and UI reflects the state", () => {
    cy.visit("/schedules");
    cy.contains(SCHEDULE, { timeout: 20000 }).should("be.visible");

    // Pause.
    cy.request({
      method: "PATCH",
      url: `/api/v1/schedules/${SCHEDULE}?namespace=default`,
      headers: authHeaders(),
      body: { suspend: true },
      failOnStatusCode: false,
    });
    cy.visit("/schedules");
    cy.contains(SCHEDULE)
      .parents("tr")
      .within(() => {
        cy.contains(/paused|suspend|inactive/i, { timeout: 20000 }).should("exist");
      });

    // Resume.
    cy.request({
      method: "PATCH",
      url: `/api/v1/schedules/${SCHEDULE}?namespace=default`,
      headers: authHeaders(),
      body: { suspend: false },
      failOnStatusCode: false,
    });
    cy.visit("/schedules");
    cy.contains(SCHEDULE)
      .parents("tr")
      .within(() => {
        cy.contains(/active|running|enabled/i, { timeout: 20000 }).should("exist");
      });
  });
});

export {};
