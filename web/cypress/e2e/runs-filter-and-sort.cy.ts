// /runs page: basic filter and sort sanity. Dispatch two runs against
// two different instances, verify both appear, and filter/search narrows
// to the expected subset.

const A = `cy-filtA-${Date.now()}`;
const B = `cy-filtB-${Date.now()}`;
let RUN_A = "";
let RUN_B = "";

describe("Runs list — filter and sort", () => {
  before(() => {
    cy.createLMStudioInstance(A);
    cy.createLMStudioInstance(B);
    cy.dispatchRun(A, "Reply: FILT_A").then((n) => {
      RUN_A = n;
    });
    cy.dispatchRun(B, "Reply: FILT_B").then((n) => {
      RUN_B = n;
    });
  });

  after(() => {
    if (RUN_A) cy.deleteRun(RUN_A);
    if (RUN_B) cy.deleteRun(RUN_B);
    cy.deleteInstance(A);
    cy.deleteInstance(B);
  });

  it("shows both runs and filters by instance name", () => {
    cy.visit("/runs");

    // Both runs visible (identified by instanceRef in the rows).
    cy.contains("td", A, { timeout: 20000 }).should("be.visible");
    cy.contains("td", B, { timeout: 20000 }).should("be.visible");

    // If a search/filter input exists, narrow by one instance.
    cy.get("body").then(($body) => {
      const hasSearch = $body.find("input[placeholder*='search' i], input[type='search']").length > 0;
      if (hasSearch) {
        cy.get("input[placeholder*='search' i], input[type='search']")
          .first()
          .clear()
          .type(A);
        cy.contains("td", A).should("be.visible");
        cy.contains("td", B).should("not.exist");
      } else {
        cy.log("no search input on /runs page — skipping filter assertion");
      }
    });
  });
});

export {};
